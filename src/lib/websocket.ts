// src/lib/websocket.ts

export type WSMessage =
  | { type: "sensorData"; data: any }
  | { type: "pumpStatus"; data: any }
  | { type: "systemAlert"; data: any }
  | { type: "systemConfig"; data: any }
  | { type: "ping"; data?: any }
  | { type: "hello"; ts: number };

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private onMessageCallback: ((data: WSMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  /** 🔌 Conecta ao WebSocket do backend (Render ou local) */
  connect(onConnect?: () => void) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.onConnectCallback = onConnect || null;

    // 🌐 URL segura e adaptável
    const apiUrl =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_API_URL?.replace(/^http/, "ws") ||
      (window.location.hostname === "localhost"
        ? "ws://localhost:5000/ws"
        : "wss://acquasys-backend.onrender.com/ws");

    console.log("🔌 Conectando ao WebSocket:", apiUrl);

    try {
      this.ws = new WebSocket(apiUrl);

      this.ws.onopen = () => {
        console.log("✅ Conectado ao servidor WebSocket AcquaSys.");
        this.reconnectAttempts = 0;
        this.onConnectCallback?.();
        // Envia uma mensagem inicial de identificação
        this.send({ type: "hello", ts: Date.now() });
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          if (data.type === "ping") return; // ignorar keep-alive
          this.onMessageCallback?.(data);
        } catch (error) {
          console.error("⚠️ Erro ao interpretar mensagem WS:", error, event.data);
        }
      };

      this.ws.onclose = () => {
        console.warn("🔌 Conexão WebSocket encerrada.");
        this.onCloseCallback?.();
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error("❌ Erro WebSocket:", error);
        this.ws?.close();
      };
    } catch (error) {
      console.error("❌ Falha ao criar conexão WebSocket:", error);
      this.reconnect();
    }
  }

  /** ♻️ Reconexão automática progressiva (até 10 tentativas) */
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("🚫 Limite de reconexões atingido.");
      return;
    }

    const delay = Math.min(15000, 1000 * 2 ** this.reconnectAttempts); // 1s → 2s → 4s → 8s → 15s máx
    this.reconnectAttempts++;
    console.log(`⏳ Tentando reconectar (#${this.reconnectAttempts}) em ${delay / 1000}s...`);

    setTimeout(() => this.connect(), delay);
  }

  /** 📡 Desconecta manualmente */
  disconnect() {
    if (this.ws) {
      console.log("🔌 WebSocket desconectado manualmente.");
      this.ws.close();
      this.ws = null;
    }
  }

  /** 📨 Registra callback de mensagem */
  onMessage(callback: (data: WSMessage) => void) {
    this.onMessageCallback = callback;
  }

  /** 🔔 Registra callback de desconexão */
  onClose(callback: () => void) {
    this.onCloseCallback = callback;
  }

  /** 📤 Envia dados JSON com verificação de conexão */
  send(data: WSMessage | Record<string, any>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ WebSocket não conectado — mensagem ignorada:", data);
    }
  }

  /** 🧩 Retorna status atual da conexão */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();

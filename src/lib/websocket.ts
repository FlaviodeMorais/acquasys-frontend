// src/lib/websocket.ts
/**
 * 🌐 WebSocketManager (frontend)
 * Cliente WebSocket do AcquaSys — comunicação bidirecional
 * com backend hospedado no Render.
 */

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

  /** 🔌 Conecta ao WebSocket do backend */
  connect(onConnect?: () => void) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.onConnectCallback = onConnect || null;

    // 🧩 Usa VITE_API_URL para conectar ao backend Render
    const baseUrl = import.meta.env.VITE_API_URL || "https://acquasys-backend.onrender.com";
    const wsUrl = baseUrl.replace(/^http/, "ws") + "/ws";

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("✅ Conectado ao servidor WebSocket AcquaSys.");
        this.reconnectAttempts = 0;
        this.onConnectCallback?.();
        // Confirma estado inicial
        this.ws?.send(JSON.stringify({ type: "hello", ts: Date.now() }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          if (data.type === "ping") return;
          this.onMessageCallback?.(data);
        } catch (error) {
          console.error("⚠️ Erro ao interpretar mensagem WS:", error);
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

  /** ♻️ Reconexão automática com backoff progressivo */
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("🚫 Limite de reconexões atingido.");
      return;
    }
    const delay = Math.min(10000, 1000 * 2 ** this.reconnectAttempts); // 1s, 2s, 4s...
    this.reconnectAttempts++;
    console.log(`⏳ Tentando reconectar em ${delay / 1000}s...`);
    setTimeout(() => this.connect(), delay);
  }

  /** 📡 Desconecta manualmente */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log("🔌 WebSocket desconectado manualmente.");
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

  /** 📤 Envia dados JSON */
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ WebSocket não conectado; mensagem ignorada.");
    }
  }

  /** 🧩 Status de conexão */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();

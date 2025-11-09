// src/App.tsx
import React, { createContext, useEffect, useState, useContext } from "react";
import { wsManager, WSMessage } from "@/lib/websocket";
import Dashboard from "@/pages/dashboard";

/**
 * 🌐 AcquaSys Context Provider
 * Gerencia o estado global do sistema (sensores, bomba, alertas, modo)
 * e mantém a comunicação WebSocket em tempo real.
 */

// Tipos do estado global
interface SensorData {
  device?: string;
  timestamp?: string | number;
  waterLevel?: number;
  temperature?: number;
  current?: number;
  flowRate?: number;
  efficiency?: number;
  pump?: boolean;
}

interface SystemContextType {
  connected: boolean;
  sensor: SensorData | null;
  alerts: string[];
  pumpStatus: boolean;
  pumpAutoMode: boolean;
  sendCommand: (action: "on" | "off" | "auto") => void;
}

// Contexto padrão
const AcquaSysContext = createContext<SystemContextType>({
  connected: false,
  sensor: null,
  alerts: [],
  pumpStatus: false,
  pumpAutoMode: true,
  sendCommand: () => {},
});

// Hook para acesso fácil em qualquer componente
export const useAcquaSys = () => useContext(AcquaSysContext);

/**
 * 🔌 Provedor global — gerencia WebSocket e estado
 */
export const AcquaSysProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [pumpStatus, setPumpStatus] = useState(false);
  const [pumpAutoMode, setPumpAutoMode] = useState(true);

  useEffect(() => {
    // Define callbacks WebSocket
    wsManager.onMessage((msg: WSMessage) => {
      switch (msg.type) {
        case "sensorData":
          setSensor(msg.data);
          break;
        case "systemAlert":
          setAlerts((prev) => [...prev.slice(-4), msg.data.message]);
          break;
        case "pumpStatus":
          setPumpStatus(!!msg.data.pump);
          break;
        case "systemConfig":
          if (typeof msg.data.pumpAutoMode === "boolean") {
            setPumpAutoMode(msg.data.pumpAutoMode);
          }
          break;
      }
    });

    wsManager.connect(() => setConnected(true));

    wsManager.onClose(() => {
      setConnected(false);
    });

    return () => wsManager.disconnect();
  }, []);

  /** 🚀 Envia comando via WebSocket (controla bomba remotamente) */
  const sendCommand = (action: "on" | "off" | "auto") => {
    wsManager.send({ type: "controlPump", action });
  };

  return (
    <AcquaSysContext.Provider
      value={{ connected, sensor, alerts, pumpStatus, pumpAutoMode, sendCommand }}
    >
      {children}
    </AcquaSysContext.Provider>
  );
};

/**
 * 🌊 App principal
 * Agora o Dashboard e outras páginas consomem dados via Context API.
 */
const App: React.FC = () => {
  return (
    <AcquaSysProvider>
      <Dashboard />
    </AcquaSysProvider>
  );
};

export default App;


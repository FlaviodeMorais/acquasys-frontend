import React, { useEffect, useState } from "react";
import { wsClient } from "@/lib/websocket"; // <== integração WebSocket
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

type SensorPayload = {
  device?: string;
  timestamp?: string | number;
  waterLevel?: number;
  temperature?: number;
  current?: number;
  flowRate?: number;
  efficiency?: number;
  pump?: boolean;
};

export default function Dashboard(): JSX.Element {
  const [sensor, setSensor] = useState<SensorPayload | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    wsClient.onConnect = () => {
      setConnected(true);
      console.log("🟢 WS conectado");
    };
    wsClient.onDisconnect = () => {
      setConnected(false);
      console.log("🔴 WS desconectado");
    };
    wsClient.onMessage = (msg) => {
      switch (msg.type) {
        case "sensorData":
          setSensor(msg.data);
          setHistory((prev) => [
            ...prev.slice(-48),
            {
              time: new Date(msg.data.timestamp).toLocaleTimeString(),
              level: msg.data.level ?? msg.data.waterLevel ?? 0,
            },
          ]);
          break;
        case "systemAlert":
          setAlerts((prev) => [...prev.slice(-4), msg.data.message]);
          break;
        case "pumpStatus":
          console.log("💧 Status da bomba:", msg.data);
          break;
      }
    };
    wsClient.connect();

    return () => wsClient.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 p-6">
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center text-white font-semibold text-lg">
            A
          </div>
          <div>
            <h1 className="text-2xl font-semibold">AcquaSys</h1>
            <p className="text-sm text-slate-500">IoT · Monitoramento em tempo real</p>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          WS:{" "}
          <span className={connected ? "text-green-600" : "text-red-500"}>
            {connected ? "Online" : "Offline"}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Métricas */}
        <section className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm text-slate-500">Nível do Tanque</h2>
            <div className="flex items-end gap-4 mt-3">
              <div className="text-4xl font-bold text-sky-700">
                {sensor ? `${(sensor.waterLevel ?? 0).toFixed(1)}%` : "--"}
              </div>
              <div className="text-sm text-slate-500">
                Última leitura:{" "}
                {sensor?.timestamp
                  ? new Date(sensor.timestamp).toLocaleTimeString()
                  : "-"}
              </div>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded mt-4 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-emerald-400 to-sky-600"
                style={{
                  width: `${Math.max(0, Math.min(100, sensor?.waterLevel ?? 0))}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm text-slate-500">Status da Bomba</h2>
            <div className="flex items-center justify-between mt-3">
              <div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    sensor?.pump
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {sensor?.pump ? "LIGADA" : "DESLIGADA"}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-slate-500">Corrente</div>
                <div className="text-lg font-medium">
                  {sensor ? `${(sensor.current ?? 0).toFixed(2)} A` : "--"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gráfico */}
        <section className="col-span-12 lg:col-span-8 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Histórico (últimas 6h)</h3>
              <div className="text-sm text-slate-500">
                Atualiza em tempo real
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid stroke="#e6eef8" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="level"
                    stroke="#0078D4"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm text-slate-600 mb-2">Alertas</h4>
            {alerts.length === 0 ? (
              <div className="text-sm text-slate-400">Nenhum alerta ativo.</div>
            ) : (
              <ul className="space-y-2 mt-2">
                {alerts.map((a, i) => (
                  <li
                    key={i}
                    className="text-sm p-2 rounded border border-slate-100 bg-red-50 text-red-700"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

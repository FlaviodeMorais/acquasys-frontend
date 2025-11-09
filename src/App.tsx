import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// AcquaSys - Corporate dashboard single-file React component
// - Default export React component
// - TailwindCSS classes used (assumes Tailwind configured)
// - Reads API base from import.meta.env.VITE_API_URL
// - Polls latest sensor data and fetches last-hour history for chart

type SensorPayload = {
  id?: string;
  device?: string;
  timestamp?: string | number;
  waterLevel?: number;
  temperature?: number;
  current?: number;
  flowRate?: number;
  vibration?: number;
  vibrationX?: number;
  vibrationY?: number;
  vibrationZ?: number;
  pumpStatus?: boolean;
  efficiency?: number;
};

export default function AcquaSysDashboard(): JSX.Element {
  const API = import.meta.env.VITE_API_URL || '';
  const [latest, setLatest] = useState<SensorPayload | null>(null);
  const [history, setHistory] = useState<Array<any>>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [connected, setConnected] = useState({ mqtt: false, influx: false });
  const pollRef = useRef<number | null>(null);

  async function fetchLatest() {
    try {
      const res = await fetch(`${API}/api/mqtt/sensor-data/latest`);
      if (!res.ok) throw new Error('no-latest');
      const data = await res.json();
      setLatest(data);
      setConnected((c) => ({ ...c, mqtt: true }));
    } catch (err) {
      setConnected((c) => ({ ...c, mqtt: false }));
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`${API}/api/mqtt/sensor-data/history?hours=6`);
      if (!res.ok) throw new Error('no-history');
      const data = await res.json();
      // expect array of readings; map to chart points
      const points = (data || []).map((r: any) => ({
        time: new Date(r.timestamp || r._time || Date.now()).toLocaleTimeString(),
        level: r.level ?? r.waterLevel ?? 0,
      }));
      setHistory(points.slice(-48));
      setConnected((c) => ({ ...c, influx: true }));
    } catch (err) {
      setConnected((c) => ({ ...c, influx: false }));
    }
  }

  useEffect(() => {
    fetchLatest();
    fetchHistory();

    // poll every 5s for latest
    pollRef.current = window.setInterval(() => fetchLatest(), 5000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    // simple alert logic based on latest
    if (!latest) return;
    const newAlerts: string[] = [];
    if ((latest.waterLevel ?? 0) < 12) newAlerts.push(`Nível crítico: ${(latest.waterLevel ?? 0).toFixed(1)}%`);
    if ((latest.efficiency ?? 100) < 50) newAlerts.push(`Eficiência baixa: ${(latest.efficiency ?? 0).toFixed(1)}%`);
    if ((latest.current ?? 0) > 4.5) newAlerts.push(`Corrente alta: ${(latest.current ?? 0).toFixed(2)}A`);
    setAlerts(newAlerts);
  }, [latest]);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 p-6">
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center text-white font-semibold text-lg">A</div>
          <div>
            <h1 className="text-2xl font-semibold">AcquaSys</h1>
            <p className="text-sm text-slate-500">IoT · Monitoramento de reservatório</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">MQTT: <span className={connected.mqtt ? 'text-green-600' : 'text-red-500'}>{connected.mqtt ? 'online' : 'offline'}</span></div>
          <div className="text-sm text-slate-600">InfluxDB: <span className={connected.influx ? 'text-green-600' : 'text-red-500'}>{connected.influx ? 'online' : 'offline'}</span></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Metrics */}
        <section className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm text-slate-500">Nível do Tanque</h2>
            <div className="flex items-end gap-4 mt-3">
              <div className="text-4xl font-bold text-sky-700">{latest ? `${(latest.waterLevel ?? 0).toFixed(1)}%` : '--'}</div>
              <div className="text-sm text-slate-500">Última atualização: {latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : '-'}</div>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded mt-4 overflow-hidden">
              <div className={`h-3 rounded bg-gradient-to-r from-emerald-400 to-sky-600`} style={{ width: `${Math.max(0, Math.min(100, latest?.waterLevel ?? 0))}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm text-slate-500">Status da Bomba</h2>
            <div className="flex items-center justify-between mt-3">
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${latest?.pumpStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {latest?.pumpStatus ? 'LIGADA' : 'DESLIGADA'}
                </div>
                <div className="text-xs text-slate-400 mt-2">Modo: {latest ? (latest.pumpStatus ? 'Manual/On' : 'Auto/Off') : '—'}</div>
              </div>

              <div className="text-right">
                <div className="text-sm text-slate-500">Corrente</div>
                <div className="text-lg font-medium">{latest ? `${(latest.current ?? 0).toFixed(2)} A` : '--'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Chart + Details */}
        <section className="col-span-12 lg:col-span-8 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Histórico de Nível (últimas 6h)</h3>
              <div className="text-sm text-slate-500">Atualiza a cada 5s</div>
            </div>

            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e6eef8" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="level" stroke="#0078D4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm text-slate-500">Temperatura</h4>
              <div className="mt-2 text-2xl font-semibold">{latest ? `${(latest.temperature ?? 0).toFixed(1)} °C` : '--'}</div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm text-slate-500">Vazão</h4>
              <div className="mt-2 text-2xl font-semibold">{latest ? `${(latest.flowRate ?? 0).toFixed(1)} L/m` : '--'}</div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm text-slate-500">Eficiência</h4>
              <div className="mt-2 text-2xl font-semibold">{latest ? `${(latest.efficiency ?? 0).toFixed(1)} %` : '--'}</div>
            </div>
          </div>
        </section>

        {/* Alerts / Logs */}
        <aside className="col-span-12 lg:col-span-4 order-last lg:order-none">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm text-slate-600 mb-2">Alertas</h4>
            {alerts.length === 0 && <div className="text-sm text-slate-400">Nenhum alerta.</div>}
            <ul className="space-y-2 mt-2">
              {alerts.map((a, i) => (
                <li key={i} className="text-sm p-2 rounded border border-slate-100 bg-red-50 text-red-700">{a}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-4 mt-4">
            <h4 className="text-sm text-slate-600 mb-2">Informações</h4>
            <div className="text-xs text-slate-500 space-y-1">
              <div>Dispositivo: {latest?.device ?? '—'}</div>
              <div>Última heap: {latest ? `${Math.round((latest.heap ?? 0) / 1024)} KB` : '—'}</div>
              <div>RSSI: {latest ? `${latest.rssi ?? 0} dBm` : '—'}</div>
            </div>
          </div>
        </aside>

        {/* Full-width footer cards */}
        <div className="col-span-12">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm text-slate-600 mb-2">Logs recentes</h4>
            <div className="text-xs text-slate-500">Conectividade e eventos serão exibidos aqui.</div>
          </div>
        </div>
      </main>
    </div>
  );
}

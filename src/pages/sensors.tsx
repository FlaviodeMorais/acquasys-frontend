import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MetricsGrid from "@/components/MetricsGrid";
import SensorDetails from "@/components/SensorDetails";
import SystemInformation from "@/components/SystemInformation";
import { wsManager } from "@/lib/websocket";
import type { SensorData, SystemConfig } from "@shared/schema";

export default function Sensors() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [realtimeData, setRealtimeData] = useState<{
    sensorData?: SensorData;
    systemConfig?: SystemConfig;
  }>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Fetch initial data
  const { data: initialSensorData } = useQuery<SensorData>({
    queryKey: ['/api/mqtt/sensor-data/latest'],
  });

  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

  // Setup WebSocket connection
  useEffect(() => {
    const handleDataUpdate = (data: any) => {
      if (data.sensorData) {
        setRealtimeData(prev => ({
          ...prev,
          sensorData: data.sensorData,
        }));
      }
      
      if (data.systemConfig) {
        setRealtimeData(prev => ({
          ...prev,
          systemConfig: data.systemConfig,
        }));
      }
    };

    const handleConnection = (data: any) => {
      if (data.type === 'connected') {
        setConnectionStatus('connected');
      } else if (data.type === 'disconnected') {
        setConnectionStatus('disconnected');
      }
    };

    wsManager.on('data-update', handleDataUpdate);
    wsManager.on('connection', handleConnection);

    return () => {
      wsManager.off('data-update', handleDataUpdate);
      wsManager.off('connection', handleConnection);
    };
  }, []);

  // Use realtime data if available, otherwise fall back to initial data
  const currentSensorData = realtimeData.sensorData || initialSensorData;
  const currentSystemConfig = realtimeData.systemConfig || systemConfig;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        connectionStatus={connectionStatus}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sensores</h1>
              <p className="text-muted-foreground">Monitoramento detalhado dos sensores do sistema</p>
            </div>

            {/* Sensor Metrics */}
            <MetricsGrid sensorData={currentSensorData} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Sensor Details */}
              <div className="xl:col-span-2">
                <SensorDetails sensorData={currentSensorData} />
              </div>

              {/* System Information */}
              <div>
                <SystemInformation 
                  systemConfig={currentSystemConfig}
                  connectionStatus={connectionStatus}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
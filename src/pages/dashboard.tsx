import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { wsManager } from "@/lib/websocket";
import { apiRequest } from "@/lib/queryClient";
import { SensorData, SystemConfig } from "@shared/schema";
import MetricsGrid from "@/components/MetricsGrid";
import { 
  Power,
  PlayCircle, 
  PauseCircle, 
  Activity,
  Wifi,
  WifiOff,
  Monitor,
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [realtimeData, setRealtimeData] = useState<{
    sensorData?: SensorData;
    systemConfig?: SystemConfig;
  }>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Fetch MQTT data (real-time)
  const { data: mqttData } = useQuery<SensorData>({
    queryKey: ['/api/mqtt/sensor-data/latest'],
    refetchInterval: 5000,
  });

  const { data: systemConfig, refetch: refetchSystemConfig } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
    refetchInterval: 5000,
  });

  const { data: systemAlerts } = useQuery({
    queryKey: ['/api/system-alerts'],
  });

  // Control mutations
  const pumpStartMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/pump/start'),
    onSuccess: () => {
      refetchSystemConfig();
    }
  });

  const pumpStopMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/pump/stop'),
    onSuccess: () => {
      refetchSystemConfig();
    }
  });

  const switchToAutoMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/pump/auto'),
    onSuccess: () => {
      refetchSystemConfig();
    }
  });

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      
      wsManager.connect(() => {
        setConnectionStatus('connected');
        console.log('WebSocket conectado');
      });

      wsManager.onMessage((data) => {
        if (data.type === 'sensorData') {
          console.log('📊 Dados recebidos via WebSocket:', data.data);
          
          // Converter dados WebSocket para formato SensorData
          const sensorData: SensorData = {
            id: data.data.id,
            timestamp: new Date(data.data.timestamp),
            waterLevel: data.data.waterLevel,
            temperature: data.data.temperature,
            flowRate: data.data.flowRate,
            vibration: data.data.vibrationXYZ ? 
              Math.sqrt(
                Math.pow(data.data.vibrationXYZ[0] || 0, 2) + 
                Math.pow(data.data.vibrationXYZ[1] || 0, 2) + 
                Math.pow(data.data.vibrationXYZ[2] || 0, 2)
              ) : 0, // Calcular magnitude RMS real da vibração
            current: data.data.current,
            pumpStatus: data.data.pumpStatus,
            efficiency: data.data.efficiency || 0,
            connectionStatus: 'connected'
          };
          
          setRealtimeData(prev => ({
            ...prev,
            sensorData: sensorData
          }));
          
          queryClient.invalidateQueries({ queryKey: ['/api/mqtt/sensor-data/latest'] });
        }
      });

      wsManager.onClose(() => {
        setConnectionStatus('disconnected');
        console.log('WebSocket desconectado');
        setTimeout(connectWebSocket, 3000);
      });
    };

    connectWebSocket();

    return () => {
      wsManager.disconnect();
    };
  }, [queryClient]);

  const currentData = realtimeData.sensorData || mqttData;
  const currentConfig = systemConfig;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AcquaSys v1.0 - Dashboard IoT
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sistema de Monitoramento de Água - ESP32 + MQTT
              </p>
            </div>
            
            {/* Navigation & Connection Status */}
            <div className="flex items-center gap-3">
              
              {/* Connection Status */}
              <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                {connectionStatus === 'connected' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        
        {/* Metrics Grid with Controls */}
        <div className="mb-8">
          <MetricsGrid 
            sensorData={currentData} 
            systemConfig={currentConfig}
            onPumpStart={() => pumpStartMutation.mutate()}
            onPumpStop={() => pumpStopMutation.mutate()}
            onPumpAuto={() => switchToAutoMutation.mutate()}
            pumpStartPending={pumpStartMutation.isPending}
            pumpStopPending={pumpStopMutation.isPending}
            pumpAutoPending={switchToAutoMutation.isPending}
          />
        </div>

        {/* Simulador Integrado */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-blue-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Simulador ESP32 - AcquaSys v1.0
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Projeto Wokwi: 441025764683811841
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href="https://wokwi.com/projects/441025764683811841"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <Monitor className="h-4 w-4" />
                    Abrir Wokwi
                  </a>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <iframe
                src="https://wokwi.com/projects/441025764683811841"
                className="w-full h-[500px] border-0 rounded-lg"
                title="Simulador ESP32 AcquaSys"
                allow="accelerometer; gyroscope; microphone; camera; autoplay"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                loading="lazy"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
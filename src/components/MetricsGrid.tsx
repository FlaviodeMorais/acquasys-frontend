import { Card } from "@/components/ui/card";
import { SimpleProgress as Progress } from "@/components/ui/simple-progress";
import { SensorData, SystemConfig } from "@shared/schema";
import { Droplets, Thermometer, Gauge, Cog, Zap, Activity, Power, PlayCircle, PauseCircle } from "lucide-react";

interface MetricsGridProps {
  sensorData?: SensorData;
  systemConfig?: SystemConfig;
  onPumpStart?: () => void;
  onPumpStop?: () => void;
  onPumpAuto?: () => void;
  pumpStartPending?: boolean;
  pumpStopPending?: boolean;
  pumpAutoPending?: boolean;
}

export default function MetricsGrid({ 
  sensorData, 
  systemConfig, 
  onPumpStart, 
  onPumpStop, 
  onPumpAuto,
  pumpStartPending,
  pumpStopPending,
  pumpAutoPending 
}: MetricsGridProps) {
  const waterLevel = sensorData?.waterLevel ?? 0;
  const temperature = sensorData?.temperature ?? 0;
  const flowRate = sensorData?.flowRate ?? 0;
  const current = sensorData?.current ?? 0;
  const vibration = sensorData?.vibration ?? 0;
  // Usar pumpStatus do sensor em tempo real (MQTT) quando disponível
  const pumpStatus = sensorData?.pumpStatus ?? systemConfig?.pumpStatus ?? false;

  const metrics = [
    {
      title: "Nível de Água",
      value: waterLevel.toFixed(1),
      unit: "%",
      icon: Droplets,
      iconColor: "text-blue-500",
      progress: waterLevel,
      description: "Faixa ideal: 70-85%",
      testId: "metric-water-level"
    },
    {
      title: "Temperatura",
      value: temperature.toFixed(1),
      unit: "°C",
      icon: Thermometer,
      iconColor: "text-orange-500",
      change: "↓ 0.5°C última hora",
      changeColor: "text-green-400",
      description: "Faixa de operação normal",
      testId: "metric-temperature"
    },
    {
      title: "Corrente",
      value: current.toFixed(2),
      unit: "A",
      icon: Zap,
      iconColor: "text-yellow-500",
      change: current > 3 ? "↑ Bomba ativa" : "↓ Standby",
      changeColor: current > 3 ? "text-yellow-400" : "text-green-400",
      description: "Consumo elétrico atual",
      testId: "metric-current"
    },
    {
      title: "Vibração",
      value: vibration.toFixed(3),
      unit: "G",
      icon: Activity,
      iconColor: "text-purple-500",
      change: vibration > 3.0 ? "↑ Alta vibração" : "↓ Normal",
      changeColor: vibration > 3.0 ? "text-red-400" : "text-green-400",
      description: "Aceleração do sistema",
      testId: "metric-vibration"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric) => (
        <Card 
          key={metric.title} 
          className="metric-card rounded-lg p-6"
          data-testid={metric.testId}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </h3>
            <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold" data-testid={`${metric.testId}-value`}>
              <span className={metric.valueColor}>{metric.value}</span>
              {metric.unit && (
                <span className="text-lg text-muted-foreground ml-1">
                  {metric.unit}
                </span>
              )}
            </div>
            
            {metric.progress !== undefined && (
              <Progress 
                value={isNaN(metric.progress) ? 0 : Math.max(0, Math.min(100, metric.progress))} 
                className="w-full h-2"
                data-testid={`${metric.testId}-progress`}
              />
            )}
            
            {metric.change && (
              <p className={`text-xs ${metric.changeColor}`} data-testid={`${metric.testId}-change`}>
                {metric.change}
              </p>
            )}
            
            {metric.status && (
              <div className="flex items-center space-x-2">
                <div className={`status-indicator ${pumpStatus ? 'status-online' : 'status-warning'}`} />
                <span className="text-sm" data-testid={`${metric.testId}-status`}>
                  {metric.status}
                </span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground" data-testid={`${metric.testId}-description`}>
              {metric.description}
            </p>
          </div>
        </Card>
      ))}
      
      {/* Control Panel Card */}
      <Card className="metric-card rounded-lg p-6" data-testid="control-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Controle da Bomba
          </h3>
          <Power className="h-5 w-5 text-blue-500" />
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => systemConfig?.pumpStatus ? onPumpStop?.() : onPumpStart?.()}
            disabled={pumpStartPending || pumpStopPending}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-white transition-colors text-sm ${
              systemConfig?.pumpStatus 
                ? 'bg-red-500 hover:bg-red-600 disabled:bg-gray-300' 
                : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300'
            }`}
          >
            {systemConfig?.pumpStatus ? (
              <>
                <PauseCircle className="h-4 w-4" />
                {pumpStopPending ? 'Desligando...' : 'Desligar'}
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                {pumpStartPending ? 'Ligando...' : 'Ligar'}
              </>
            )}
          </button>

          <button
            onClick={() => onPumpAuto?.()}
            disabled={pumpAutoPending}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
          >
            <Activity className="h-4 w-4" />
            {pumpAutoPending ? 'Ativando...' : 'Auto'}
          </button>
        </div>
      </Card>
    </div>
  );
}

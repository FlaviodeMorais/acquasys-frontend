import { Button } from "@/components/ui/button";
import { Menu, AlertTriangle } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}

export default function Header({ onMenuClick, onToggleSidebar, connectionStatus = 'connecting' }: HeaderProps) {
  const systemStatuses = [
    { label: "ESP32", status: connectionStatus === 'connected' ? 'online' : 'offline' },
    { label: "Sensors", status: connectionStatus === 'connected' ? 'online' : 'offline' },
    { label: "ML Model", status: "warning" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick || onToggleSidebar}
            data-testid="menu-button"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold" data-testid="page-title">
            Painel de Gerenciamento de Água
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* System Status Indicators */}
          <div className="flex items-center space-x-6">
            {systemStatuses.map((system) => (
              <div key={system.label} className="text-center">
                <div 
                  className={`status-indicator ${getStatusColor(system.status)}`}
                  data-testid={`status-${system.label.toLowerCase()}`}
                />
                <span className="text-xs text-muted-foreground">
                  {system.label}
                </span>
              </div>
            ))}
          </div>

          {/* Emergency Stop Button */}
          <Button
            variant="destructive"
            size="sm"
            className="font-medium"
            data-testid="emergency-stop-button"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Parada de Emergência
          </Button>
        </div>
      </div>
    </header>
  );
}

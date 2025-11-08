import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, AlertTriangle, Info, Settings } from "lucide-react";
import { SystemAlert } from "@shared/schema";

interface AlertSystemProps {
  alerts?: SystemAlert[];
}

export default function AlertSystem({ alerts: passedAlerts }: AlertSystemProps = {}) {
  const { data: fetchedAlerts, isLoading } = useQuery<SystemAlert[]>({
    queryKey: ['/api/system-alerts'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const alerts = passedAlerts || fetchedAlerts;

  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: string) => apiRequest("POST", `/api/alerts/acknowledge/${alertId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-alerts'] });
    },
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'info': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-card border border-border rounded-lg p-6" data-testid="alert-system-loading">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {!alerts || (Array.isArray(alerts) && alerts.length === 0) ? (
        <div className="text-center py-4" data-testid="no-alerts">
          <p className="text-sm text-muted-foreground">Nenhum alerta</p>
        </div>
      ) : (
        (Array.isArray(alerts) ? alerts : []).slice(0, 3).map((alert: SystemAlert) => {
          const AlertIcon = getAlertIcon(alert.type);
          
          return (
            <div
              key={alert.id}
              className="flex items-center space-x-2 p-2 rounded"
              data-testid={`alert-${alert.type}`}
            >
              <AlertIcon className={`h-3 w-3 ${alert.type === 'success' ? 'text-green-500' : 
                alert.type === 'warning' ? 'text-yellow-500' : 
                alert.type === 'error' ? 'text-red-500' : 'text-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" data-testid={`alert-title-${alert.id}`}>
                  {alert.title}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

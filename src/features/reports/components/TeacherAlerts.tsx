import React from 'react';
import { TeacherAlert } from '@/types';

interface TeacherAlertsProps {
  alerts: TeacherAlert[];
  onDismiss?: (alertId: string) => void;
}

export default function TeacherAlerts({ alerts, onDismiss }: TeacherAlertsProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'academic-struggle': return '📚';
      case 'mental-health': return '💭';
      case 'behavior': return '⚠️';
      case 'attendance': return '📅';
      default: return '📢';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800/50 text-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800/50 text-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800/50 text-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/50 text-blue-900 dark:text-blue-300';
      default: return 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'bg-red-600 dark:bg-red-700 text-white';
      case 'high': return 'bg-orange-600 dark:bg-orange-700 text-white';
      case 'medium': return 'bg-yellow-600 dark:bg-yellow-700 text-white';
      case 'low': return 'bg-blue-600 dark:bg-blue-700 text-white';
      default: return 'bg-[var(--accent-primary)] text-white';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">🔔 AI-Generated Teacher Alerts</h3>
        <span className="bg-red-600 dark:bg-red-700 text-white text-xs px-2 py-1 rounded-full font-medium">
          {alerts.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`border-2 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getAlertIcon(alert.alertType)}</span>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-lg">{alert.title}</h4>
                    <div className="flex gap-2 items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {onDismiss && alert.status === 'new' && (
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                <p className="text-sm mb-3">{alert.description}</p>
                
                <div className="bg-[var(--bg-card)] rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">AI Insight:</p>
                  <p className="text-sm italic">{alert.aiInsight}</p>
                </div>

                {alert.suggestedActions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">Suggested Actions:</p>
                    <ul className="space-y-1">
                      {alert.suggestedActions.map((action, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-[var(--accent-primary)] font-bold">→</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

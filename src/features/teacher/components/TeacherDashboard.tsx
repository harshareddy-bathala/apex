import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getAnalyticsAlerts, type AnalyticsAlert } from '@/api/client';

interface TeacherDashboardProps {
  idToken?: string;
}

const riskBadgeClass = (score: number): string => {
  if (score >= 80) {
    return 'bg-rose-500/20 text-rose-100';
  }
  if (score >= 60) {
    return 'bg-amber-400/20 text-amber-100';
  }
  return 'bg-emerald-400/20 text-emerald-100';
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ idToken }) => {
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLoad = useMemo(() => Boolean(idToken), [idToken]);

  const loadAlerts = useCallback(async () => {
    if (!idToken) {
      setAlerts([]);
      setError('Teacher session missing. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getAnalyticsAlerts(idToken);
      setAlerts(response.alerts ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics alerts.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (canLoad) {
      void loadAlerts();
    }
  }, [canLoad, loadAlerts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Live insights</p>
          <h2 className="text-2xl font-semibold text-white">AI Alerts</h2>
          <p className="text-sm text-white/60">Prioritized risk signals synthesized from check-ins, submissions, and attendance.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadAlerts()}
          disabled={!canLoad || loading}
          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:border-sky-400/60 hover:bg-white/20 transition-all disabled:opacity-60"
        >
          {!canLoad ? 'Sign in to refresh' : loading ? 'Refreshing...' : 'Refresh Insights'}
        </button>
      </div>

      {!canLoad && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          Connect your teacher session to view live analytics.
        </div>
      )}

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      {alerts.length === 0 ? (
        <div className="glass-card rounded-3xl border border-white/5 p-6 text-center text-white/70">No active risk signals detected.</div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const topSignals = alert.signals?.slice(0, 2) ?? [];
            return (
              <article key={alert.studentId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{alert.studentName ?? `Student ${alert.studentId}`}</p>
                    <p className="text-xs text-white/50">Student ID: {alert.studentId}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${riskBadgeClass(alert.riskScore)}`}>
                    Risk {alert.riskScore}
                  </span>
                </div>
                <p className="mt-3 text-sm text-white/80">{alert.aiSummary ?? 'No AI summary available.'}</p>
                {topSignals.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-white/60">
                    {topSignals.map((signal, index) => (
                      <li key={`${alert.studentId}-${index}`} className="flex items-start gap-2">
                        <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-white/60" aria-hidden />
                        <span>
                          <strong className="mr-1 text-white/80">{signal.category}:</strong>
                          {signal.description ?? 'Signal description unavailable.'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

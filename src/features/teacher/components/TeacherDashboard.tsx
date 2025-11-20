import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getAnalyticsAlerts, getTests, deleteAssignment, getSubjects, createSubject, deleteSubject, type AnalyticsAlert } from '@/api/client';
import { type Test } from '@/types';

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
  const [tests, setTests] = useState<Test[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLoad = useMemo(() => Boolean(idToken), [idToken]);

  const loadData = useCallback(async () => {
    if (!idToken) {
      setAlerts([]);
      setTests([]);
      setError('Teacher session missing. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [alertsResponse, testsResponse, subjectsResponse] = await Promise.all([
        getAnalyticsAlerts(idToken),
        getTests(idToken),
        getSubjects(idToken)
      ]);
      setAlerts(alertsResponse.alerts ?? []);
      setTests(testsResponse.tests ?? []);
      setSubjects(subjectsResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (canLoad) {
      void loadData();
    }
  }, [canLoad, loadData]);

  const handleDeleteTest = async (testId: string) => {
    if (!idToken || !confirm('Are you sure you want to delete this test?')) return;
    try {
      await deleteAssignment(idToken, testId);
      setTests(prev => prev.filter(t => t.id !== testId));
    } catch (err) {
      alert('Failed to delete test');
    }
  };

  const handleAddSubject = async () => {
    if (!idToken || !newSubject.trim()) return;
    try {
      await createSubject(idToken, newSubject.trim());
      setSubjects(prev => [...prev, newSubject.trim()]);
      setNewSubject('');
    } catch (err) {
      alert('Failed to add subject');
    }
  };

  const handleDeleteSubject = async (subject: string) => {
    if (!idToken || !confirm(`Delete subject "${subject}"?`)) return;
    try {
      await deleteSubject(idToken, subject);
      setSubjects(prev => prev.filter(s => s !== subject));
    } catch (err) {
      alert('Failed to delete subject');
    }
  };

  const handleDownloadReport = (studentName: string, summary: string) => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentName}-report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* AI Alerts Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Live insights</p>
            <h2 className="text-2xl font-semibold text-white">AI Alerts</h2>
            <p className="text-sm text-white/60">Prioritized risk signals synthesized from check-ins, submissions, and attendance.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
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
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${riskBadgeClass(alert.riskScore)}`}>
                        Risk {alert.riskScore}
                      </span>
                      {alert.aiSummary && (
                        <button
                          onClick={() => handleDownloadReport(alert.studentName ?? alert.studentId, alert.aiSummary ?? '')}
                          className="text-sm text-sky-400 hover:text-sky-300 underline"
                        >
                          Download Report
                        </button>
                      )}
                    </div>
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

      {/* Subject Management Section */}
      <div className="space-y-6 pt-6 border-t border-white/10">
        <div>
          <h2 className="text-2xl font-semibold text-white">Subject Management</h2>
          <p className="text-sm text-white/60">Manage the subjects available for assignments and tests.</p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/10">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Enter new subject name..."
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/30 focus:border-sky-500 focus:outline-none"
            />
            <button
              onClick={handleAddSubject}
              disabled={!newSubject.trim()}
              className="px-6 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Subject
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {subjects.map((subject) => (
              <div key={subject} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 group">
                <span className="text-white/80">{subject}</span>
                <button
                  onClick={() => handleDeleteSubject(subject)}
                  className="text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete subject"
                >
                  ×
                </button>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-white/40 italic">No subjects added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tests Section */}
      <div className="space-y-6 pt-6 border-t border-white/10">
        <div>
          <h2 className="text-2xl font-semibold text-white">Tests & Assignments</h2>
          <p className="text-sm text-white/60">Manage your created tests and homework.</p>
        </div>

        {tests.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/5">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-3xl">
              📝
            </div>
            <h3 className="text-lg font-medium text-white">No tests created yet</h3>
            <p className="text-slate-400 mt-2 max-w-sm mx-auto">
              Create your first assignment or test to start tracking student performance.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <div key={test.id} className="glass-card rounded-xl p-5 flex flex-col justify-between group hover:border-sky-500/30 transition-all duration-300">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 rounded-md bg-white/5 text-xs font-medium text-sky-300 border border-white/10 uppercase tracking-wider">
                      {test.type || 'Assignment'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {test.subject}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-lg group-hover:text-sky-400 transition-colors">{test.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{test.description}</p>
                  <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {new Date(test.testDate || test.dueDate || '').toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTest(test.id)}
                  className="mt-5 w-full rounded-lg bg-red-500/10 border border-red-500/20 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Assignment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;

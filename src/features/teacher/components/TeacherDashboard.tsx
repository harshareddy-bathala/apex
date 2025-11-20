import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { 
  getAnalyticsAlerts, 
  getTests, 
  deleteAssignment, 
  createAssignment,
  type AnalyticsAlert, 
  type Test,
  type CreateAssignmentPayload 
} from '@/api/client';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create Assignment State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAssignment, setNewAssignment] = useState<CreateAssignmentPayload>({
    title: '',
    classId: 'class-10a', // Default for now
    subject: '',
    type: 'homework',
    dueDate: '',
    description: ''
  });

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
      const [alertsResponse, testsResponse] = await Promise.all([
        getAnalyticsAlerts(idToken),
        getTests(idToken)
      ]);
      setAlerts(alertsResponse.alerts ?? []);
      setTests(testsResponse.tests ?? []);
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;

    setCreating(true);
    try {
      const created = await createAssignment(idToken, newAssignment);
      // Optimistically add to list or reload
      // The API returns AssignmentRecord which matches Test interface roughly
      // We'll reload to be safe and get server fields
      await loadData();
      setShowCreateModal(false);
      // Reset form
      setNewAssignment({
        title: '',
        classId: 'class-10a',
        subject: '',
        type: 'homework',
        dueDate: '',
        description: ''
      });
    } catch (err) {
      alert('Failed to create assignment');
    } finally {
      setCreating(false);
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
    <div className="space-y-8 relative">
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
                          onClick={() => handleDownloadReport(alert.studentName ?? alert.studentId, alert.aiSummary!)}
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

      {/* Tests Section */}
      <div className="space-y-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Tests & Assignments</h2>
            <p className="text-sm text-white/60">Manage your created tests and homework.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!canLoad}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-sky-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Create New
          </button>
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

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-xl font-bold text-white mb-6">Create Assignment</h3>
            
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newAssignment.title}
                  onChange={e => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-2.5 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                  placeholder="e.g., Algebra Quiz 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newAssignment.subject}
                    onChange={e => setNewAssignment(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-2.5 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                    placeholder="e.g., Math"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={newAssignment.type}
                    onChange={e => setNewAssignment(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-2.5 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none appearance-none"
                  >
                    <option value="homework" className="bg-slate-900">Homework</option>
                    <option value="test" className="bg-slate-900">Test</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={newAssignment.dueDate}
                  onChange={e => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-2.5 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newAssignment.description}
                  onChange={e => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-2.5 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none"
                  placeholder="Instructions for students..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-sky-500/20 transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

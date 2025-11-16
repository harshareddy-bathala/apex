import React, { useCallback, useEffect, useState } from 'react';
import { getHomework } from '@/api/client';
import { Homework } from '@/types';

interface HomeworkListProps {
  homework: Homework[];
  onUpdate: (homework: Homework[]) => void;
  token: string;
  loadingExternal?: boolean;
  errorMessage?: string | null;
}

export default function HomeworkList({ homework, onUpdate, token, loadingExternal, errorMessage }: HomeworkListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');
  const [isFetching, setIsFetching] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fetchHomework = useCallback(async () => {
    setIsFetching(true);
    setLocalError(null);
    try {
      const { homework: assignments } = await getHomework(token);
      onUpdate(assignments);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load homework right now.';
      setLocalError(message);
    } finally {
      setIsFetching(false);
    }
  }, [onUpdate, token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void fetchHomework();
  }, [token, fetchHomework]);

  const toggleComplete = (id: string) => {
    const updated = homework.map(hw => {
      if (hw.id === id) {
        const newStatus: Homework['status'] = hw.status === 'completed' ? 'pending' : 'completed';
        return {
          ...hw,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      }
      return hw;
    });
    onUpdate(updated);
  };

  const updateStatus = (id: string, status: Homework['status']) => {
    const updated = homework.map(hw => {
      if (hw.id === id) {
        return { ...hw, status };
      }
      return hw;
    });
    onUpdate(updated);
  };

  const filteredHomework = homework.filter(hw => {
    if (filter === 'all') return true;
    if (filter === 'pending') return hw.status !== 'completed' && hw.status !== 'submitted';
    if (filter === 'completed') return hw.status === 'completed' || hw.status === 'submitted';
    return true;
  });

  const sortedHomework = [...filteredHomework].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-accent-amber/20 text-yellow-300 border-accent-amber/30';
      case 'low': return 'bg-accent-green/20 text-accent-green border-accent-green/30';
      default: return 'bg-slate-600/20 text-slate-300 border-slate-600/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'submitted': return '📤';
      case 'in-progress': return '⏳';
      case 'overdue': return '⚠️';
      default: return '📝';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed' && status !== 'submitted';
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };

  const totalHomework = homework.length;
  const pendingCount = homework.filter(h => h.status !== 'completed' && h.status !== 'submitted').length;
  const completedCount = homework.filter(h => h.status === 'completed' || h.status === 'submitted').length;
  const overdueCount = homework.filter(h => isOverdue(h.dueDate, h.status)).length;
  const dueSoonCount = homework.filter(h => {
    const diff = new Date(h.dueDate).getTime() - new Date().getTime();
    return diff <= 3 * 24 * 60 * 60 * 1000 && diff >= -24 * 60 * 60 * 1000 && h.status !== 'completed' && h.status !== 'submitted';
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-micro text-muted-ink uppercase tracking-wide">Task 06</p>
          <h2 className="text-hero-mobile md:text-section-title font-bold text-white">Homework & To-Do</h2>
          <p className="text-body-sm text-muted-ink mt-1">Stay organized with a live feed of every assignment</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void fetchHomework()}
            disabled={isFetching || loadingExternal}
            className="px-4 py-2 rounded-xl text-body-sm font-medium bg-panel-elevated/80 border border-card-border text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-60"
          >
            {isFetching || loadingExternal ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Assignments', value: totalHomework, helper: 'Synced from teachers', icon: '📚' },
          { label: 'Due Soon', value: dueSoonCount, helper: 'Next 3 days', icon: '⏰' },
          { label: 'Completed', value: completedCount, helper: 'Turned in or done', icon: '✅' },
          { label: 'Overdue', value: overdueCount, helper: 'Past due date', icon: '⚠️', highlight: overdueCount > 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4 shadow-card backdrop-blur-lg ${
              stat.highlight ? 'ring-1 ring-red-400/40' : ''
            }`}
          >
            <div className="flex items-center justify-between text-muted-ink text-body-sm">
              <span>{stat.label}</span>
              <span>{stat.icon}</span>
            </div>
            <p className={`text-3xl font-semibold mt-2 ${stat.highlight ? 'text-red-300' : 'text-white'}`}>{stat.value}</p>
            <p className="text-body-xs text-muted-ink mt-1">{stat.helper}</p>
          </div>
        ))}
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-3 items-center bg-panel/80 p-4 rounded-2xl shadow-card border border-card-border backdrop-blur-xl">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All', count: totalHomework, icon: '🗂️' },
            { id: 'pending', label: 'Pending', count: pendingCount, icon: '⚙️' },
            { id: 'completed', label: 'Completed', count: completedCount, icon: '✅' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-4 py-2 rounded-xl text-body-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-discrete-highlight flex items-center gap-2 ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-primary-from to-primary-to text-white shadow-card'
                  : 'bg-panel-elevated text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <span className="text-body-sm text-muted-ink">Sort by</span>
          <div className="flex items-center gap-2 rounded-xl bg-panel-elevated px-3 py-1.5 border border-card-border text-body-sm">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Homework List */}
      {(localError || errorMessage) && (
        <p className="text-red-400 text-sm">{localError || errorMessage}</p>
      )}

      <div className="space-y-3">
        {sortedHomework.length === 0 ? (
          <div className="bg-panel rounded-2xl p-12 text-center shadow-card border border-card-border">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-section-title font-semibold text-white mb-2">All caught up!</h3>
            <p className="text-body text-muted-ink">
              {isFetching || loadingExternal ? 'Loading assignments...' : filter === 'all' ? 'No homework assigned yet' : `No ${filter} homework`}
            </p>
          </div>
        ) : (
          sortedHomework.map(hw => (
            <div
              key={hw.id}
              className={`relative overflow-hidden rounded-2xl p-5 shadow-card border border-card-border/80 transition-all duration-200 hover:shadow-card-hover ${
                isOverdue(hw.dueDate, hw.status)
                  ? 'ring-1 ring-red-500/40'
                  : hw.status === 'completed' || hw.status === 'submitted'
                  ? 'opacity-80'
                  : 'ring-1 ring-primary-to/40'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0" />
              <div className="relative flex items-start gap-4">
                {/* Checkbox */}
                <label className="relative flex items-center cursor-pointer group mt-1">
                  <input
                    type="checkbox"
                    checked={hw.status === 'completed' || hw.status === 'submitted'}
                    onChange={() => toggleComplete(hw.id)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded border-2 border-slate-600 peer-checked:bg-accent-green peer-checked:border-accent-green flex items-center justify-center transition-all group-hover:border-accent-green">
                    {(hw.status === 'completed' || hw.status === 'submitted') && (
                      <svg className="w-3 h-3 text-bg-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h3 className={`text-body font-semibold ${
                        hw.status === 'completed' || hw.status === 'submitted' ? 'line-through text-muted-ink' : 'text-white'
                      }`}>
                        {getStatusIcon(hw.status)} {hw.title}
                      </h3>
                      <p className="text-body-sm text-muted-ink mt-1">{hw.subject} • {hw.teacherName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className={`px-3 py-1 rounded-full text-micro font-semibold border ${getPriorityColor(hw.priority)}`}>
                        {hw.priority.toUpperCase()}
                      </span>
                      <span className="text-body-xs text-muted-ink flex items-center gap-1">
                        📅 {new Date(hw.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-body-sm text-slate-300 mb-3">{hw.description}</p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-body-sm">
                    <span className={`font-medium ${
                      isOverdue(hw.dueDate, hw.status) ? 'text-red-400' :
                      new Date(hw.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 ? 'text-orange-400' :
                      'text-muted-ink'
                    }`}>
                      📅 {getDaysUntilDue(hw.dueDate)}
                    </span>
                    {hw.estimatedTime && (
                      <span className="text-muted-ink">⏱️ {hw.estimatedTime} min</span>
                    )}
                    <span className="text-muted-ink">
                      Assigned: {new Date(hw.assignedDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status Update */}
                  {hw.status !== 'completed' && hw.status !== 'submitted' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => updateStatus(hw.id, 'in-progress')}
                        className={`px-3 py-1 rounded-xl text-body-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-discrete-highlight ${
                          hw.status === 'in-progress'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => updateStatus(hw.id, 'submitted')}
                        className="px-3 py-1 rounded-xl text-body-sm font-medium bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-green"
                      >
                        Mark Submitted
                      </button>
                    </div>
                  )}

                  {hw.completedAt && (
                    <p className="text-body-sm text-accent-green mt-2">
                      ✓ Completed on {new Date(hw.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

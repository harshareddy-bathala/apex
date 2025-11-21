import React, { useState } from 'react';
import { Homework } from '@/types';

const FILTER_TABS = [
  { id: 'all', label: 'All', icon: '🗂️' },
  { id: 'pending', label: 'Pending', icon: '⚙️' },
  { id: 'completed', label: 'Completed', icon: '✅' },
] as const;

const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
] as const;

type FilterValue = (typeof FILTER_TABS)[number]['id'];
type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const isSortValue = (value: string): value is SortValue => SORT_OPTIONS.some((option) => option.value === value);

interface HomeworkListProps {
  homework: Homework[];
  onStatusChange: (homeworkId: string, status: Homework['status']) => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
  loadingExternal?: boolean;
  errorMessage?: string | null;
}

export default function HomeworkList({
  homework = [],
  onStatusChange,
  onRefresh,
  loadingExternal,
  errorMessage,
}: HomeworkListProps) {
  // Defensive programming - ensure homework is always an array
  const safeHomework = Array.isArray(homework) ? homework : [];

  const [filter, setFilter] = useState<FilterValue>('all');
  const [sortBy, setSortBy] = useState<SortValue>('dueDate');
  const [inFlightId, setInFlightId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const toggleComplete = async (id: string) => {
    const target = safeHomework.find((item) => item.id === id);
    if (!target) return;
    const nextStatus: Homework['status'] = target.status === 'completed' || target.status === 'submitted' ? 'pending' : 'completed';
    await persistStatus(id, nextStatus);
  };

  const updateStatus = async (id: string, status: Homework['status']) => {
    await persistStatus(id, status);
  };

  const persistStatus = async (id: string, status: Homework['status']) => {
    setLocalError(null);
    setInFlightId(id);
    try {
      await onStatusChange(id, status);
    } catch (error) {
      setLocalError('Unable to update homework right now. Please retry.');
    } finally {
      setInFlightId(null);
    }
  };

  const handleRefresh = async () => {
    setLocalError(null);
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      setLocalError('Unable to refresh homework. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredHomework = safeHomework.filter(hw => {
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
    if (!dueDate) return false;
    const due = new Date(dueDate);
    return !isNaN(due.getTime()) && due < new Date() && status !== 'completed' && status !== 'submitted';
  };

  const getDaysUntilDue = (dueDate: string) => {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return 'Invalid date';

    const days = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };

  const totalHomework = safeHomework.length;
  const pendingCount = safeHomework.filter(h => h.status !== 'completed' && h.status !== 'submitted').length;
  const completedCount = safeHomework.filter(h => h.status === 'completed' || h.status === 'submitted').length;
  const overdueCount = safeHomework.filter(h => isOverdue(h.dueDate, h.status)).length;
  const dueSoonCount = safeHomework.filter(h => {
    const diff = new Date(h.dueDate).getTime() - new Date().getTime();
    return diff <= 3 * 24 * 60 * 60 * 1000 && diff >= -24 * 60 * 60 * 1000 && h.status !== 'completed' && h.status !== 'submitted';
  }).length;
  const filterCounts: Record<FilterValue, number> = {
    all: totalHomework,
    pending: pendingCount,
    completed: completedCount,
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (isSortValue(event.target.value)) {
      setSortBy(event.target.value);
    }
  };

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
            onClick={() => void handleRefresh()}
            disabled={isRefreshing || loadingExternal}
            className="px-4 py-2 rounded-xl text-body-sm font-medium bg-panel-elevated/80 border border-card-border text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-60"
          >
            {isRefreshing || loadingExternal ? 'Refreshing…' : 'Refresh'}
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
            className={`glass-panel rounded-2xl p-4 shadow-card ${stat.highlight ? 'glass-panel--highlight ring-0' : ''
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
      <div className="flex flex-wrap gap-3 items-center glass-panel p-4 rounded-2xl shadow-card">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-body-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-discrete-highlight flex items-center gap-2 ${filter === tab.id
                ? 'bg-gradient-to-r from-primary-from to-primary-to text-white shadow-card'
                : 'premium-chip hover:text-white'
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label} ({filterCounts[tab.id]})
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <span className="text-body-sm text-muted-ink">Sort by</span>
          <div className="flex items-center gap-2 rounded-xl premium-chip px-3 py-1.5 text-body-sm">
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="bg-transparent text-white focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
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
          <div className="glass-panel rounded-2xl p-12 text-center shadow-card">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-section-title font-semibold text-white mb-2">All caught up!</h3>
            <p className="text-body text-muted-ink">
              {isRefreshing || loadingExternal ? 'Loading assignments...' : filter === 'all' ? 'No homework assigned yet' : `No ${filter} homework`}
            </p>
          </div>
        ) : (
          sortedHomework.map(hw => (
            <div
              key={hw.id}
              className={`glass-panel relative overflow-hidden rounded-3xl p-5 shadow-card transition-all duration-200 hover:shadow-card-hover ${isOverdue(hw.dueDate, hw.status)
                ? 'glass-panel--highlight'
                : hw.status === 'completed' || hw.status === 'submitted'
                  ? 'opacity-80'
                  : ''
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <div className="relative flex items-start gap-4">
                {/* Checkbox */}
                <label className={`relative flex items-center cursor-pointer group mt-1 ${inFlightId === hw.id ? 'opacity-60' : ''}`}>
                  <input
                    type="checkbox"
                    checked={hw.status === 'completed' || hw.status === 'submitted'}
                    onChange={() => void toggleComplete(hw.id)}
                    disabled={inFlightId === hw.id}
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
                      <h3 className={`text-body font-semibold ${hw.status === 'completed' || hw.status === 'submitted' ? 'line-through text-muted-ink' : 'text-white'
                        }`}>
                        {getStatusIcon(hw.status)} {hw.title}
                      </h3>
                      <p className="text-body-sm text-muted-ink mt-1">{hw.subject} • {hw.teacherName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className={`premium-chip px-3 py-1 rounded-full text-micro font-semibold border ${getPriorityColor(hw.priority)}`}>
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
                    <span className={`font-medium ${isOverdue(hw.dueDate, hw.status) ? 'text-red-400' :
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
                        onClick={() => void updateStatus(hw.id, 'in-progress')}
                        disabled={inFlightId === hw.id}
                        className={`px-3 py-1 rounded-xl text-body-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-discrete-highlight disabled:opacity-60 ${hw.status === 'in-progress'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                          }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => void updateStatus(hw.id, 'submitted')}
                        disabled={inFlightId === hw.id}
                        className="px-3 py-1 rounded-xl text-body-sm font-medium bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-green disabled:opacity-60"
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

                  {inFlightId === hw.id && (
                    <p className="text-body-xs text-muted-ink mt-2">Updating…</p>
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

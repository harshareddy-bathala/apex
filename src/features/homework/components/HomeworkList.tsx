import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock4,
  ListChecks,
  RefreshCw,
  TimerReset,
} from 'lucide-react';

import type { Homework } from '@/types';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
] as const;

const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
] as const;

type FilterValue = (typeof FILTER_TABS)[number]['id'];
type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const isSortValue = (value: string): value is SortValue => SORT_OPTIONS.some((option) => option.value === value);

interface HomeworkListProps {
  homework?: Homework[];
  onStatusChange: (homeworkId: string, status: Homework['status']) => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
  loadingExternal?: boolean;
  errorMessage?: string | null;
}

const HomeworkList: React.FC<HomeworkListProps> = ({
  homework,
  onStatusChange,
  onRefresh,
  loadingExternal,
  errorMessage,
}) => {
  const isHomeworkArray = Array.isArray(homework);
  const safeHomework = useMemo(() => (isHomeworkArray ? homework : []), [homework, isHomeworkArray]);

  const [filter, setFilter] = useState<FilterValue>('all');
  const [sortBy, setSortBy] = useState<SortValue>('dueDate');
  const [inFlightId, setInFlightId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const toggleComplete = async (id: string) => {
    const target = safeHomework.find((item) => item?.id === id);
    if (!target) return;
    const nextStatus: Homework['status'] =
      target.status === 'completed' || target.status === 'submitted' ? 'pending' : 'completed';
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
    } catch {
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
    } catch {
      setLocalError('Unable to refresh homework. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredHomework = useMemo(() => {
    return safeHomework.filter((hw) => {
      if (!hw) {
        return false;
      }
      if (filter === 'all') return true;
      if (filter === 'pending') return hw.status !== 'completed' && hw.status !== 'submitted';
      if (filter === 'completed') return hw.status === 'completed' || hw.status === 'submitted';
      return true;
    });
  }, [safeHomework, filter]);

  const sortedHomework = useMemo(() => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
    return [...filteredHomework].sort((a, b) => {
      if (sortBy === 'priority') {
        return (priorityOrder[a?.priority ?? 'low'] ?? 3) - (priorityOrder[b?.priority ?? 'low'] ?? 3);
      }
      return new Date(a?.dueDate ?? '').getTime() - new Date(b?.dueDate ?? '').getTime();
    });
  }, [filteredHomework, sortBy]);

  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    return !Number.isNaN(due.getTime()) && due < new Date() && status !== 'completed' && status !== 'submitted';
  };

  const getPriorityTone = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100/20 text-red-700 border-red-200/40';
      case 'high':
        return 'bg-orange-100/20 text-orange-700 border-orange-200/40';
      case 'medium':
        return 'bg-amber-100/20 text-amber-700 border-amber-200/40';
      case 'low':
        return 'bg-emerald-100/20 text-emerald-700 border-emerald-200/40';
      default:
        return 'bg-slate-100/10 text-slate-500 border-slate-200/30';
    }
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return 'Date unavailable';

    const days = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };

  const totalHomework = safeHomework.length;
  const pendingCount = safeHomework.filter((h) => h?.status !== 'completed' && h?.status !== 'submitted').length;
  const completedCount = safeHomework.filter((h) => h?.status === 'completed' || h?.status === 'submitted').length;
  const overdueCount = safeHomework.filter((h) => isOverdue(h?.dueDate, h?.status)).length;
  const dueSoonCount = safeHomework.filter((h) => {
    const diff = new Date(h?.dueDate ?? '').getTime() - new Date().getTime();
    return (
      diff <= 3 * 24 * 60 * 60 * 1000 &&
      diff >= -24 * 60 * 60 * 1000 &&
      h?.status !== 'completed' &&
      h?.status !== 'submitted'
    );
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

  if (!isHomeworkArray) {
    return (
      <EmptyState
        title="Assignments unavailable"
        description="We couldn’t parse your homework data. Refresh to sync with the server."
        actionLabel="Reload homework"
        onAction={handleRefresh}
        icon={<AlertCircle size={24} />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">Task Console</p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Homework & Assignments</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Track every due date, priority, and submission status at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void handleRefresh()}
            disabled={isRefreshing || loadingExternal}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-50"
          >
            {isRefreshing || loadingExternal ? <TimerReset className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isRefreshing || loadingExternal ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Assignments', value: totalHomework, helper: 'Synced from faculty', icon: <ListChecks size={18} /> },
          { label: 'Due Soon', value: dueSoonCount, helper: 'Within 72 hours', icon: <Clock4 size={18} /> },
          { label: 'Completed', value: completedCount, helper: 'Submitted or done', icon: <CheckCircle2 size={18} /> },
          {
            label: 'Overdue',
            value: overdueCount,
            helper: 'Needs attention',
            icon: <AlertCircle size={18} />,
            highlight: overdueCount > 0,
          },
        ].map((stat) => (
          <article
            key={stat.label}
            className={`glass-panel flex flex-col rounded-3xl border border-[var(--border-subtle)] ${
              stat.highlight ? 'ring-1 ring-red-200/50' : ''
            }`}
          >
            <header className="flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span>{stat.label}</span>
              {stat.icon}
            </header>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-sm text-[var(--text-secondary)]">{stat.helper}</p>
          </article>
        ))}
      </div>

      <div className="glass-panel flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                filter === tab.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white shadow-md'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
              }`}
            >
              {tab.label} ({filterCounts[tab.id]})
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">Sort by</span>
          <div className="premium-chip flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm">
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="bg-transparent text-[var(--text-primary)] focus:outline-none"
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

      {(localError || errorMessage) && (
        <p className="text-sm text-red-600">{localError || errorMessage}</p>
      )}

      <div className="space-y-3">
        {sortedHomework.length === 0 ? (
          <EmptyState
            title={isRefreshing || loadingExternal ? 'Syncing assignments' : 'Nothing to show yet'}
            description={
              isRefreshing || loadingExternal
                ? 'Please wait while we fetch your latest homework.'
                : filter === 'all'
                ? 'No homework has been assigned.'
                : `No assignments match the "${filter}" filter.`
            }
            actionLabel="Refresh"
            onAction={handleRefresh}
            icon={<BookOpenCheck size={28} />}
          />
        ) : (
          sortedHomework.map((hw) => {
            if (!hw) return null;
            const overdue = isOverdue(hw?.dueDate, hw?.status);

            return (
              <article
                key={hw.id}
                className={`glass-panel relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] transition-all hover:border-[var(--border-strong)] ${
                  overdue ? 'ring-1 ring-red-200/50' : ''
                }`}
              >
                <div className="relative flex items-start gap-4">
                  <label
                    className={`relative mt-1 flex cursor-pointer items-center ${
                      inFlightId === hw.id ? 'opacity-60' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={hw?.status === 'completed' || hw?.status === 'submitted'}
                      onChange={() => void toggleComplete(hw.id)}
                      disabled={inFlightId === hw.id}
                      className="sr-only"
                    />
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                        hw?.status === 'completed' || hw?.status === 'submitted'
                          ? 'border-[var(--accent-success)] bg-[var(--accent-success)]/20 text-[var(--accent-success)]'
                          : 'border-[var(--border-color)] text-[var(--text-muted)]'
                      }`}
                    >
                      {hw?.status === 'completed' || hw?.status === 'submitted' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </label>

                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3
                          className={`text-base font-semibold ${
                            hw?.status === 'completed' || hw?.status === 'submitted'
                              ? 'text-[var(--text-muted)] line-through'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {hw?.title ?? 'Untitled assignment'}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {hw?.subject ?? 'General'} • {hw?.teacherName ?? 'Faculty'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <span className={`premium-chip border ${getPriorityTone(hw?.priority)}`}>
                          {(hw?.priority ?? 'medium').toUpperCase()}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)]">
                          <CalendarDays size={14} />
                          {hw?.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'Date TBA'}
                        </span>
                      </div>
                    </div>

                    {hw?.description && (
                      <p className="mb-3 text-sm text-[var(--text-secondary)]">{hw.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                      <span
                        className={`font-medium ${
                          overdue
                            ? 'text-red-600'
                            : new Date(hw?.dueDate ?? '').getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                            ? 'text-amber-600'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {getDaysUntilDue(hw?.dueDate)}
                      </span>
                      {hw?.estimatedTime ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock4 size={14} />
                          {hw.estimatedTime} min
                        </span>
                      ) : null}
                      {hw?.assignedDate && (
                        <span>Assigned {new Date(hw.assignedDate).toLocaleDateString()}</span>
                      )}
                    </div>

                    {hw?.status !== 'completed' && hw?.status !== 'submitted' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => void updateStatus(hw.id, 'in-progress')}
                          disabled={inFlightId === hw.id}
                          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                            hw?.status === 'in-progress'
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                              : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                          }`}
                        >
                          Mark In Progress
                        </button>
                        <button
                          onClick={() => void updateStatus(hw.id, 'submitted')}
                          disabled={inFlightId === hw.id}
                          className="rounded-2xl border border-[var(--accent-success)] bg-[var(--accent-success)]/10 px-4 py-2 text-sm font-semibold text-[var(--accent-success)] hover:bg-[var(--accent-success)]/20 disabled:opacity-50"
                        >
                          Mark Submitted
                        </button>
                      </div>
                    )}

                    {hw?.completedAt && (
                      <p className="mt-2 text-sm text-[var(--accent-success)]">
                        Completed {new Date(hw.completedAt).toLocaleDateString()}
                      </p>
                    )}

                    {inFlightId === hw.id && (
                      <p className="mt-2 text-sm text-[var(--text-muted)]">Updating…</p>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HomeworkList;

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction, icon }) => (
  <div className="glass-panel flex flex-col items-center gap-3 text-center">
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 p-4 text-[var(--text-primary)]">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
    <p className="max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
    <button
      type="button"
      onClick={onAction}
      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
    >
      <RefreshCw size={16} />
      {actionLabel}
    </button>
  </div>
);

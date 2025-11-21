import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookMarked,
  CalendarDays,
  Clock4,
  ListChecks,
  NotepadText,
  RefreshCw,
  ShieldAlert,
  TimerReset,
} from 'lucide-react';

import { getTests } from '@/api/client';
import type { Test } from '@/types';

const FILTER_TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'all', label: 'All' },
] as const;

type FilterValue = (typeof FILTER_TABS)[number]['id'];

interface TestsListProps {
  idToken: string;
}

const TestsList: React.FC<TestsListProps> = ({ idToken }) => {
  const [filter, setFilter] = useState<FilterValue>('upcoming');
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { tests: payload } = await getTests(idToken);
      if (!Array.isArray(payload)) {
        setTests([]);
        setError('Unexpected data format from the server.');
        return;
      }
      setTests(payload);
    } catch {
      setError('Unable to load tests. Please try again.');
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  const updatePreparationStatus = (id: string, status: Test['preparationStatus']) => {
    setTests((prev) =>
      prev.map((test) => (test.id === id ? { ...test, preparationStatus: status } : test)),
    );
  };

  const addNote = (id: string, note: string) => {
    setTests((prev) => prev.map((test) => (test.id === id ? { ...test, notes: note } : test)));
  };

  const safeTests = Array.isArray(tests) ? tests : [];

  const filteredTests = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return [...safeTests]
      .filter((test) => {
        const testDate = new Date(test?.testDate ?? '');
        if (Number.isNaN(testDate.getTime())) return false;

        if (filter === 'all') return true;
        if (filter === 'upcoming') return testDate > now;
        if (filter === 'today') return testDate <= todayEnd && testDate >= now;
        if (filter === 'week') return testDate <= weekEnd && testDate >= now;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a?.testDate ?? '').getTime() -
          new Date(b?.testDate ?? '').getTime(),
      );
  }, [safeTests, filter]);

  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case 'board-exam':
        return 'bg-red-100/20 text-red-600 border-red-200/50';
      case 'final':
        return 'bg-orange-100/20 text-orange-600 border-orange-200/50';
      case 'midterm':
        return 'bg-amber-100/20 text-amber-600 border-amber-200/50';
      case 'unit-test':
        return 'bg-sky-100/20 text-sky-600 border-sky-200/50';
      case 'quiz':
        return 'bg-emerald-100/20 text-emerald-600 border-emerald-200/50';
      default:
        return 'bg-slate-100/10 text-slate-500 border-slate-200/30';
    }
  };

  const getDaysUntilTest = (testDate?: string) => {
    if (!testDate) return 'Date unavailable';
    const target = new Date(testDate);
    if (Number.isNaN(target.getTime())) return 'Date unavailable';

    const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  if (!Array.isArray(tests) && !loading) {
    return (
      <EmptyState
        title="Assessment data unavailable"
        description="We couldn't interpret the tests coming from the server. Please retry."
        actionLabel="Reload tests"
        onAction={loadTests}
        icon={<ShieldAlert size={24} />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">Assessment Radar</p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Tests & Exams</h2>
          <p className="text-sm text-[var(--text-secondary)]">Monitor every exam window and prep status in one glance.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadTests()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-50"
        >
          {loading ? <TimerReset className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Syncing…' : 'Refresh'}
        </button>
      </header>

      <div className="glass-panel flex flex-wrap items-center gap-3">
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
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="glass-panel border border-red-200/40 text-red-600">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="glass-panel text-center">
          <p className="text-sm text-[var(--text-secondary)]">Fetching the latest assessments…</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <EmptyState
          title="No assessments to show"
          description="You’re all caught up. We’ll surface new tests as soon as teachers publish them."
          actionLabel="Refresh"
          onAction={loadTests}
          icon={<BookMarked size={24} />}
        />
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => {
            const isUrgent =
              new Date(test?.testDate ?? '').getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

            return (
              <article
                key={test?.id}
                className={`glass-panel rounded-3xl border border-[var(--border-subtle)] transition-all hover:border-[var(--border-strong)] ${
                  isUrgent ? 'ring-1 ring-red-200/50' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-[var(--bg-secondary)]/60 p-3 text-[var(--text-primary)]">
                      <NotepadText size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        {test?.title ?? 'Untitled test'}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {test?.subject ?? 'General'} • {test?.teacherName ?? 'Faculty'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <span className={`premium-chip border ${getImportanceColor(test?.importance)}`}>
                      {(test?.importance ?? 'standard').replace('-', ' ').toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-[var(--bg-secondary)]/60 px-3 py-1 text-sm text-[var(--text-primary)]">
                      <Clock4 size={14} />
                      {getDaysUntilTest(test?.testDate)}
                    </span>
                  </div>
                </div>

                {test?.description && (
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">{test.description}</p>
                )}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="glass-panel bg-transparent p-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Schedule
                    </p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {test?.testDate
                        ? new Date(test.testDate).toLocaleString(undefined, {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })
                        : 'Date TBA'}
                    </p>
                    {test?.duration && (
                      <p className="text-sm text-[var(--text-secondary)]">Duration: {test.duration} mins</p>
                    )}
                  </div>
                  <div className="glass-panel bg-transparent p-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Coverage
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(test?.syllabus ?? []).map((topic, idx) => (
                        <span
                          key={`${topic}-${idx}`}
                          className="rounded-lg bg-[var(--bg-secondary)]/70 px-2 py-1 text-xs text-[var(--text-secondary)]"
                        >
                          {topic}
                        </span>
                      ))}
                      {(!test?.syllabus || test.syllabus.length === 0) && (
                        <span className="text-sm text-[var(--text-muted)]">Syllabus pending</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Preparation Status
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['not-started', 'in-progress', 'well-prepared'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updatePreparationStatus(test?.id ?? '', status)}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                          test?.preparationStatus === status
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                        }`}
                      >
                        {status.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {(test?.studyMaterials?.length ?? 0) > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Study Materials
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                      {test?.studyMaterials?.map((material, idx) => (
                        <li key={`${material}-${idx}`}>{material}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Personal Notes
                  </p>
                  <textarea
                    value={test?.notes || ''}
                    onChange={(event) => addNote(test?.id ?? '', event.target.value)}
                    placeholder="Add your preparation notes, questions, or reminders..."
                    rows={2}
                    className="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TestsList;

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

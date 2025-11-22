import React, { useEffect, useMemo, useState } from 'react';

import {
  getPeerContacts,
  postAttendance,
  type AttendancePayload,
  type AttendanceRecordPayload,
  type AttendanceRecordResponse,
} from '@/api/client';
import type { ChatContact } from '@/types';

interface AttendanceTrackerProps {
  idToken: string;
}

type StudentStatus = {
  status: AttendanceRecordPayload['status'];
  notes: string;
};

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ idToken }) => {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [roster, setRoster] = useState<ChatContact[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [statusMap, setStatusMap] = useState<Record<string, StudentStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<AttendanceRecordResponse | null>(null);

  useEffect(() => {
    if (!idToken) {
      return;
    }
    setRosterLoading(true);
    setRosterError(null);
    void getPeerContacts(idToken)
      .then(({ peers }) => {
        const students = peers.filter((peer) => peer.role === 'student');
        setRoster(students);
        setStatusMap((prev) => {
          const next = { ...prev };
          students.forEach((student) => {
            if (!next[student.id]) {
              next[student.id] = { status: 'present', notes: '' };
            }
          });
          return next;
        });
      })
      .catch(() => setRosterError('Unable to load registered students.'))
      .finally(() => setRosterLoading(false));
  }, [idToken]);

  const isSubmitDisabled = useMemo(
    () => !classId.trim() || !date || roster.length === 0 || rosterLoading,
    [classId, date, roster.length, rosterLoading],
  );

  const filteredRoster = useMemo(() => {
    if (!filter.trim()) {
      return roster;
    }
    const query = filter.toLowerCase();
    return roster.filter((student) => student.name.toLowerCase().includes(query));
  }, [filter, roster]);

  const summary = useMemo(() => {
    return roster.reduce(
      (acc, student) => {
        const status = statusMap[student.id]?.status ?? 'present';
        acc[status] += 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0 },
    );
  }, [roster, statusMap]);

  const updateStatus = (studentId: string, status: AttendanceRecordPayload['status']) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const updateNotes = (studentId: string, value: string) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: { ...prev[studentId], notes: value } }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) {
      return;
    }

    const payload: AttendancePayload = {
      classId: classId.trim(),
      date,
      records: roster.map((student) => ({
        studentId: student.id,
        status: statusMap[student.id]?.status ?? 'present',
        notes: statusMap[student.id]?.notes || undefined,
      })),
      notes: notes || undefined,
    };

    setLoading(true);
    setError(null);
    try {
      const response = await postAttendance(idToken, payload);
      setLastSubmission(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Attendance Tracker</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Log today&apos;s attendance using the live student roster.</p>
      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Class ID
            <input
              type="text"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              required
            />
          </label>
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              required
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-4 text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Summary:</span>
          <span>Present {summary.present}</span>
          <span>Absent {summary.absent}</span>
          <span>Late {summary.late}</span>
          <div className="ml-auto flex items-center gap-2">
            <input
              type="search"
              placeholder="Search student"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
          {rosterLoading && <p className="text-sm text-[var(--text-secondary)]">Loading students…</p>}
          {rosterError && <p className="text-sm text-[var(--warning-foreground)]">{rosterError}</p>}
          {!rosterLoading && !rosterError && roster.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">No registered students found.</p>
          )}
          {filteredRoster.map((student) => {
            const entry = statusMap[student.id] ?? { status: 'present', notes: '' };
            return (
              <div key={student.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 p-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{student.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{student.id}</p>
                  </div>
                  <div className="flex gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateStatus(student.id, option.value)}
                        className={`rounded-xl border px-3 py-1 text-xs font-semibold transition ${
                          entry.status === option.value
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={entry.notes}
                  onChange={(event) => updateNotes(student.id, event.target.value)}
                  placeholder="Notes (optional)"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>
            );
          })}
        </div>

        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          Class Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          />
        </label>

        {error && <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        {lastSubmission && (
          <p className="rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            Attendance submitted for {lastSubmission.classId} on {lastSubmission.date}.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || isSubmitDisabled}
            className="rounded-2xl bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Submit attendance'}
          </button>
        </div>
      </form>
    </div>
  );
};

const statusOptions: Array<{ value: AttendanceRecordPayload['status']; label: string }> = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
];

export default AttendanceTracker;

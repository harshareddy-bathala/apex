import React, { useMemo, useState } from 'react';

import { type TimetableEntryPayload, type TimetableRecord, type UpsertTimetablePayload, upsertTimetable } from '@/api/client';

interface TimetableEditorProps {
  idToken: string;
}

type EditableEntry = TimetableEntryPayload & { key: string };

const generateKey = (): string => {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.random()}`;
};

const createEmptyEntry = (): EditableEntry => ({
  key: generateKey(),
  day: 'Monday',
  startTime: '09:00',
  endTime: '10:00',
  subject: '',
  location: '',
});

const TimetableEditor: React.FC<TimetableEditorProps> = ({ idToken }) => {
  const [classId, setClassId] = useState('');
  const [weekOf, setWeekOf] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<EditableEntry[]>([createEmptyEntry()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestTimetable, setLatestTimetable] = useState<TimetableRecord | null>(null);

  const isSubmitDisabled = useMemo(
    () => !classId.trim() || entries.some((entry) => !entry.subject.trim()),
    [classId, entries],
  );

  const updateEntry = (key: string, field: keyof TimetableEntryPayload, value: string) => {
    setEntries((prev) => prev.map((entry) => (entry.key === key ? { ...entry, [field]: value } : entry)));
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  };

  const removeEntry = (key: string) => {
    setEntries((prev) => (prev.length === 1 ? prev : prev.filter((entry) => entry.key !== key)));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) {
      return;
    }

    const payload: UpsertTimetablePayload = {
      classId: classId.trim(),
      weekOf,
      entries: entries.map(({ key: _key, ...entry }) => ({ ...entry, location: entry.location || undefined })),
    };

    setLoading(true);
    setError(null);
    try {
      const record = await upsertTimetable(idToken, payload);
      setLatestTimetable(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white">Timetable Editor</h2>
      <p className="mt-1 text-sm text-slate-400">Maintain up-to-date schedules for every class.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Class ID
            <input
              type="text"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Week Of
            <input
              type="date"
              value={weekOf}
              onChange={(event) => setWeekOf(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </label>
        </div>

        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={entry.key} className="rounded-lg border border-slate-800/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-300">Entry {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.key)}
                  className="text-xs text-slate-400 hover:text-red-300"
                  disabled={entries.length === 1}
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                  Day
                  <select
                    value={entry.day}
                    onChange={(event) => updateEntry(entry.key, 'day', event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                  Start Time
                  <input
                    type="time"
                    value={entry.startTime}
                    onChange={(event) => updateEntry(entry.key, 'startTime', event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                  End Time
                  <input
                    type="time"
                    value={entry.endTime}
                    onChange={(event) => updateEntry(entry.key, 'endTime', event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                  Subject
                  <input
                    type="text"
                    value={entry.subject}
                    onChange={(event) => updateEntry(entry.key, 'subject', event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </label>
              </div>
              <label className="mt-3 flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                Location
                <input
                  type="text"
                  value={entry.location ?? ''}
                  onChange={(event) => updateEntry(entry.key, 'location', event.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addEntry}
          className="rounded-md border border-dashed border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-400"
        >
          Add Entry
        </button>

        {error && <p className="rounded-md border border-red-600 bg-red-950/40 px-4 py-2 text-sm text-red-200">{error}</p>}
        {latestTimetable && (
          <p className="rounded-md border border-emerald-600 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-200">
            Timetable saved for week starting {latestTimetable.weekOf}.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || isSubmitDisabled}
          className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Timetable'}
        </button>
      </form>
    </div>
  );
};

export default TimetableEditor;

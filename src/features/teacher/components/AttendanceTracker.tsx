import React, { useMemo, useState } from 'react';

import { postAttendance, type AttendancePayload, type AttendanceRecordPayload, type AttendanceRecordResponse } from '@/api/client';

interface AttendanceTrackerProps {
  idToken: string;
}

type EditableRecord = AttendanceRecordPayload & { key: string };

const generateKey = (): string => {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return `record-${Date.now()}-${Math.random()}`;
};

const createEmptyRecord = (): EditableRecord => ({
  key: generateKey(),
  studentId: '',
  status: 'present',
  notes: '',
});

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ idToken }) => {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<EditableRecord[]>([createEmptyRecord()]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<AttendanceRecordResponse | null>(null);

  const isSubmitDisabled = useMemo(
    () => !classId.trim() || !date || records.some((record) => !record.studentId.trim()),
    [classId, date, records],
  );

  const updateRecord = (key: string, field: keyof AttendanceRecordPayload, value: string) => {
    setRecords((prev) => prev.map((record) => (record.key === key ? { ...record, [field]: value } : record)));
  };

  const addRecord = () => {
    setRecords((prev) => [...prev, createEmptyRecord()]);
  };

  const removeRecord = (key: string) => {
    setRecords((prev) => (prev.length === 1 ? prev : prev.filter((record) => record.key !== key)));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) {
      return;
    }

    const payload: AttendancePayload = {
      classId: classId.trim(),
      date,
      notes: notes || undefined,
      records: records.map(({ key, ...record }) => ({ ...record, notes: record.notes || undefined })),
    };

    setLoading(true);
    setError(null);
    try {
      const response = await postAttendance(idToken, payload);
      setLastSubmission(response);
    } catch (err) {
      console.error('Failed to record attendance', err);
      setError(err instanceof Error ? err.message : 'Unable to record attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white">Attendance Tracker</h2>
      <p className="mt-1 text-sm text-slate-400">Submit quick attendance snapshots for the day.</p>
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
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </label>
        </div>

        <div className="space-y-4">
          {records.map((record, index) => (
            <div key={record.key} className="rounded-lg border border-slate-800/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-300">Student {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeRecord(record.key)}
                  className="text-xs text-slate-400 hover:text-red-300"
                  disabled={records.length === 1}
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                  Student ID
                  <input
                    type="text"
                    value={record.studentId}
                    onChange={(event) => updateRecord(record.key, 'studentId', event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                  Status
                  <select
                    value={record.status}
                    onChange={(event) => updateRecord(record.key, 'status', event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                  Notes
                  <input
                    type="text"
                    value={record.notes}
                    onChange={(event) => updateRecord(record.key, 'notes', event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRecord}
          className="rounded-md border border-dashed border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-400"
        >
          Add Student
        </button>

        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
          />
        </label>

        {error && <p className="rounded-md border border-red-600 bg-red-950/40 px-4 py-2 text-sm text-red-200">{error}</p>}
        {lastSubmission && (
          <p className="rounded-md border border-emerald-600 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-200">
            Attendance submitted for {lastSubmission.classId} on {lastSubmission.date}.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || isSubmitDisabled}
          className="inline-flex items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Attendance'}
        </button>
      </form>
    </div>
  );
};

export default AttendanceTracker;

import React, { useMemo, useState } from 'react';

import { createAssignment, type AssignmentRecord, type CreateAssignmentPayload } from '@/api/client';

interface AssignmentCreatorProps {
  idToken: string;
}

const defaultFormState = {
  title: '',
  classId: '',
  subject: '',
  type: '',
  dueDate: '',
  description: '',
  instructions: '',
  attachments: '',
  studentIds: '',
};

const AssignmentCreator: React.FC<AssignmentCreatorProps> = ({ idToken }) => {
  const [formState, setFormState] = useState(defaultFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAssignment, setCreatedAssignment] = useState<AssignmentRecord | null>(null);

  const isSubmitDisabled = useMemo(() => !formState.title.trim() || !formState.classId.trim(), [formState.classId, formState.title]);

  const handleChange = (field: keyof typeof defaultFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) {
      return;
    }
    setLoading(true);
    setError(null);

    const attachments = formState.attachments
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const studentIds = formState.studentIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const payload: CreateAssignmentPayload = {
      title: formState.title.trim(),
      classId: formState.classId.trim(),
      subject: formState.subject || undefined,
      type: formState.type || undefined,
      dueDate: formState.dueDate || undefined,
      description: formState.description || undefined,
      instructions: formState.instructions || undefined,
      attachments: attachments.length ? attachments : undefined,
      studentIds: studentIds.length ? studentIds : undefined,
    };

    try {
      const assignment = await createAssignment(idToken, payload);
      setCreatedAssignment(assignment);
      setFormState(defaultFormState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white">Create Assignment</h2>
      <p className="mt-1 text-sm text-slate-400">Push new work to students and seed the submissions tracker.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Title
            <input
              type="text"
              value={formState.title}
              onChange={(event) => handleChange('title', event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Class ID
            <input
              type="text"
              value={formState.classId}
              onChange={(event) => handleChange('classId', event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Subject
            <input
              type="text"
              value={formState.subject}
              onChange={(event) => handleChange('subject', event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Assignment Type
            <input
              type="text"
              value={formState.type}
              onChange={(event) => handleChange('type', event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Quiz, Project, Essay"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Due Date
            <input
              type="datetime-local"
              value={formState.dueDate}
              onChange={(event) => handleChange('dueDate', event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Description
          <textarea
            value={formState.description}
            onChange={(event) => handleChange('description', event.target.value)}
            rows={3}
            className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Instructions
          <textarea
            value={formState.instructions}
            onChange={(event) => handleChange('instructions', event.target.value)}
            rows={3}
            className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Attachments (comma separated URLs)
            <input
              type="text"
              value={formState.attachments}
              onChange={(event) => handleChange('attachments', event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Target Student IDs (comma separated)
            <input
              type="text"
              value={formState.studentIds}
              onChange={(event) => handleChange('studentIds', event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              placeholder="student-123, student-456"
            />
          </label>
        </div>
        {error && <p className="rounded-md border border-red-600 bg-red-950/40 px-4 py-2 text-sm text-red-200">{error}</p>}
        {createdAssignment && (
          <p className="rounded-md border border-emerald-600 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-200">
            Assignment {createdAssignment.title} created successfully.
          </p>
        )}
        <button
          type="submit"
          disabled={loading || isSubmitDisabled}
          className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Assignment'}
        </button>
      </form>
    </div>
  );
};

export default AssignmentCreator;

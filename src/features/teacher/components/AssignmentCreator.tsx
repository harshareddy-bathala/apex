import React, { useMemo, useState } from 'react';

import { createAssignment, deleteAssignment, type AssignmentRecord, type CreateAssignmentPayload } from '@/api/client';

interface AssignmentCreatorProps {
  idToken: string;
}

const defaultFormState = {
  title: '',
  classId: '',
  subject: '',
  type: 'homework',
  dueDate: '',
  description: '',
};

const AssignmentCreator: React.FC<AssignmentCreatorProps> = ({ idToken }) => {
  const [formState, setFormState] = useState(defaultFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAssignment, setCreatedAssignment] = useState<AssignmentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isSubmitDisabled = useMemo(
    () =>
      !formState.title.trim() ||
      !formState.subject.trim() ||
      !formState.classId.trim() ||
      !formState.type ||
      !formState.dueDate,
    [formState.classId, formState.dueDate, formState.subject, formState.title, formState.type],
  );

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

    const payload: CreateAssignmentPayload = {
      title: formState.title.trim(),
      classId: formState.classId.trim(),
      subject: formState.subject.trim(),
      type: (formState.type as 'homework' | 'test') || 'homework',
      dueDate: new Date(formState.dueDate).toISOString(),
      description: formState.description.trim() || undefined,
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

  const handleDelete = async () => {
    if (!createdAssignment || deleting) {
      return;
    }
    setDeleting(true);
    try {
      await deleteAssignment(idToken, createdAssignment.id);
      setCreatedAssignment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete assignment');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--text-muted)]">Teacher tools</p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Assignment Creator</h2>
          <p className="text-sm text-[var(--text-secondary)]">Publish homework or tests directly to student dashboards.</p>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Title</span>
            <input
              type="text"
              value={formState.title}
              onChange={(event) => handleChange('title', event.target.value)}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Class / Section</span>
            <input
              type="text"
              value={formState.classId}
              onChange={(event) => handleChange('classId', event.target.value)}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              required
              placeholder="Class 10A"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Subject</span>
            <input
              type="text"
              value={formState.subject}
              onChange={(event) => handleChange('subject', event.target.value)}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              required
              placeholder="Mathematics"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Type</span>
            <select
              value={formState.type}
              onChange={(event) => handleChange('type', event.target.value)}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              required
            >
              <option value="homework">Homework</option>
              <option value="test">Test</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Due date</span>
            <input
              type="datetime-local"
              value={formState.dueDate}
              onChange={(event) => handleChange('dueDate', event.target.value)}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              required
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Description (optional)</span>
          <textarea
            value={formState.description}
            onChange={(event) => handleChange('description', event.target.value)}
            rows={3}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            placeholder="Add rubric, resources, or context students should know."
          />
        </label>

        {error && (
          <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {createdAssignment && (
          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex flex-wrap items-center justify-between gap-3">
            <span>
              Assignment <strong>{createdAssignment.title}</strong> published to students.
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl border border-red-200/70 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
            >
              {deleting ? 'Removing…' : 'Delete'}
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isSubmitDisabled}
          className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
        >
          {loading ? 'Publishing…' : 'Publish assignment'}
        </button>
      </form>
    </div>
  );
};

export default AssignmentCreator;

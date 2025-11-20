import React, { useMemo, useState } from 'react';

import { createAssignment, getSubjects, type AssignmentRecord, type CreateAssignmentPayload } from '@/api/client';

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
  const [assignToAll, setAssignToAll] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [dateInputType, setDateInputType] = useState<'datetime-local' | 'text'>('datetime-local');

  React.useEffect(() => {
    getSubjects(idToken).then(setSubjects).catch(console.error);
  }, [idToken]);

  const isSubmitDisabled = useMemo(() => !formState.title.trim() || !formState.classId.trim(), [formState.classId, formState.title]);

  const handleChange = (field: keyof typeof defaultFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };
  
  const handleDateChange = (value: string) => {
    try {
      // Validate and normalize date input
      if (value) {
        // Check if it's a valid datetime-local format (YYYY-MM-DDTHH:MM)
        const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        
        if (dateRegex.test(value)) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            // Valid date, store ISO string
            setFormState((prev) => ({ ...prev, dueDate: date.toISOString() }));
            if (error && error.includes('date')) {
              setError(null);
            }
            return;
          }
        }
        
        // If not in expected format, try to parse it
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setFormState((prev) => ({ ...prev, dueDate: date.toISOString() }));
          if (error && error.includes('date')) {
            setError(null);
          }
          return;
        }
        
        // Invalid date format
        setError('Invalid date format. Please use the date picker or enter a valid date.');
      } else {
        // Empty value is allowed (optional field)
        setFormState((prev) => ({ ...prev, dueDate: '' }));
        if (error && error.includes('date')) {
          setError(null);
        }
      }
    } catch (err) {
      setError('Error processing date. Please try using the date picker.');
      console.error('Date parsing error:', err);
    }
  };
  
  const getFormattedDateForInput = (): string => {
    if (!formState.dueDate) return '';
    
    try {
      const date = new Date(formState.dueDate);
      if (isNaN(date.getTime())) return '';
      
      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
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
      studentIds: assignToAll ? undefined : (studentIds.length ? studentIds : undefined),
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
            <select
              value={formState.subject}
              onChange={(event) => handleChange('subject', event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
              <option value="General">General</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Assignment Type
            <select
              value={formState.type}
              onChange={(event) => handleChange('type', event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select Type</option>
              <option value="homework">Homework</option>
              <option value="test">Test</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Due Date
            <div className="relative">
              <input
                type={dateInputType}
                value={getFormattedDateForInput()}
                onChange={(event) => handleDateChange(event.target.value)}
                onFocus={(e) => {
                  // Ensure datetime-local type on focus for better UX
                  if (dateInputType === 'text') {
                    setDateInputType('datetime-local');
                  }
                }}
                onBlur={(e) => {
                  // If empty and was text type, keep as text
                  if (!e.target.value && dateInputType === 'text') {
                    setDateInputType('text');
                  }
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Select due date and time"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                Optional
              </span>
            </div>
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
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={assignToAll}
                onChange={(e) => setAssignToAll(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950/60 text-emerald-500 focus:ring-emerald-500"
              />
              Assign to All Students
            </label>
            <label className={`flex flex-col gap-2 text-sm text-slate-200 ${assignToAll ? 'opacity-50' : ''}`}>
              Target Student IDs (comma separated)
              <input
                type="text"
                value={formState.studentIds}
                onChange={(event) => handleChange('studentIds', event.target.value)}
                disabled={assignToAll}
                className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed"
                placeholder="student-123, student-456"
              />
            </label>
          </div>
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

import React, { useMemo, useState } from 'react';

import { updateProfile } from '@/api/client';
import type { StudentProfile } from '@/types';

interface EditProfilePageProps {
  profile: StudentProfile;
  idToken: string | null;
  onClose: () => void;
  onProfileUpdated: (updates: Partial<StudentProfile>) => void;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ profile, idToken, onClose, onProfileUpdated }) => {
  const initialDob = profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '';
  const [name, setName] = useState(profile.name ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(initialDob);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [hobbiesInput, setHobbiesInput] = useState(profile.hobbies?.join(', ') ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parsedHobbies = useMemo(
    () =>
      hobbiesInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [hobbiesInput],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idToken) {
      setError('You are not authenticated. Please sign in again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload = {
        name: name.trim(),
        dateOfBirth: dateOfBirth || undefined,
        bio: bio.trim() || undefined,
        hobbies: parsedHobbies.length > 0 ? parsedHobbies : undefined,
      };
      const updated = await updateProfile(idToken, payload);
      onProfileUpdated({
        name: updated.name ?? payload.name,
        dateOfBirth: updated.dateOfBirth ?? payload.dateOfBirth,
        bio: updated.bio ?? payload.bio,
        hobbies: updated.hobbies ?? parsedHobbies,
        updatedAt: updated.updatedAt,
      });
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 900);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-5 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
      >
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Update profile</p>
          <h2 className="mt-1 text-2xl font-display text-[var(--text-primary)]">Keep your brief current</h2>
        </header>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Full Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              placeholder="e.g. Maya Patel"
              required
            />
          </label>

          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Date of Birth
            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Bio
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              placeholder="Share what motivates you, your favorite projects, or learning goals."
            />
          </label>

          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Hobbies (comma separated)
            <input
              type="text"
              value={hobbiesInput}
              onChange={(event) => setHobbiesInput(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              placeholder="Photography, debating, robotics"
            />
          </label>
        </div>

        {error && <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        {successMessage && (
          <p className="rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{successMessage}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/60"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;

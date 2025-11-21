import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, IdCard, ListChecks, Sparkles, UserRound } from 'lucide-react';

import { updateProfile } from '@/api/client';
import { useProfile } from '@/common/context/ProfileContext';

interface OnboardingPageProps {
  idToken: string | null;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ idToken }) => {
  const navigate = useNavigate();
  const { refetchProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    grade: '',
    tokenNumber: '',
    dateOfBirth: '',
    hobbies: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;

    setLoading(true);
    setError(null);

    try {
      const hobbiesList = formData.hobbies.split(',').map((h) => h.trim()).filter(Boolean);
      
      await updateProfile(idToken, {
        name: formData.fullName,
        grade: formData.grade,
        studentId: formData.tokenNumber,
        dateOfBirth: formData.dateOfBirth,
        interests: hobbiesList,
        onboardingComplete: true,
      });

      await refetchProfile();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10 space-y-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-[var(--bg-secondary)]/60 flex items-center justify-center text-[var(--text-primary)] shadow-card">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Finish onboarding</h2>
          <p className="text-sm text-[var(--text-secondary)]">We’ll use this to personalize insights and coordinate with your mentors.</p>
        </div>

        <form className="glass-panel rounded-3xl border border-[var(--border-subtle)] p-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Full name</span>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 px-4 py-3">
                <UserRound className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Avery Chen"
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Class / Grade</span>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 px-4 py-3">
                <ListChecks className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  id="grade"
                  name="grade"
                  type="text"
                  required
                  value={formData.grade}
                  onChange={handleChange}
                  placeholder="Grade 10"
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Student ID</span>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 px-4 py-3">
                <IdCard className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  id="tokenNumber"
                  name="tokenNumber"
                  type="text"
                  required
                  value={formData.tokenNumber}
                  onChange={handleChange}
                  placeholder="ST-2048"
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Date of Birth</span>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 px-4 py-3">
                <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Hobbies & interests</span>
            <textarea
              id="hobbies"
              name="hobbies"
              value={formData.hobbies}
              onChange={handleChange}
              rows={3}
              placeholder="Debate club, UI design, tennis…"
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/40"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[var(--accent-primary)] py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
          >
            {loading ? 'Saving profile…' : 'Complete setup'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;

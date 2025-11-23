import React from 'react';
import {
  BookOpen,
  CalendarDays,
  LogOut,
  Mail,
  Moon,
  NotebookPen,
  Palette,
  PenSquare,
  Settings as SettingsIcon,
  Sparkles,
  SunMedium,
  Target,
  UserRound,
  Users,
} from 'lucide-react';

import { useAuth } from '@/common/hooks/useAuth';
import { useTheme } from '@/common/context/ThemeContext';
import type { StudentProfile } from '@/types';

interface ProfilePageProps {
  profile: StudentProfile;
  onEditProfile: () => void;
  onEditGoals: () => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onEditProfile, onEditGoals, onLogout }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const firstName = profile.name.split(' ')[0] ?? profile.name;
  const bio = profile.bio?.trim() || 'Add a short bio so mentors know what fuels your curiosity.';
  const hobbyList = profile.hobbies?.filter(Boolean) ?? [];
  const interestList = profile.interests?.filter(Boolean) ?? [];
  const stats = [
    { label: 'Followers', value: profile.followers ?? 0, icon: Users },
    { label: 'Notes Shared', value: profile.notesShared ?? 0, icon: BookOpen },
    { label: 'Subjects', value: profile.subjects.length, icon: Palette },
  ];

  const formatNumber = (value: number): string => new Intl.NumberFormat().format(value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-muted)]">Profile</p>
        <h1 className="text-3xl font-display text-[var(--text-primary)]">Your personal brief</h1>
        <p className="font-hand text-lg text-[var(--text-secondary)]">Keep showing up, {firstName}.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-muted)]">Identity</p>
                <h2 className="mt-1 text-2xl font-display text-[var(--text-primary)]">Hi, {firstName}</h2>
                <p className="font-hand text-base text-[var(--text-secondary)]">You&apos;re writing your own playbook.</p>
              </div>
              <button
                type="button"
                onClick={onEditProfile}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                <PenSquare size={16} />
                Edit
              </button>
            </div>
            <div className="mt-6 grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Icon size={16} />
                    {label}
                  </div>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">{formatNumber(value)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Quick Actions</p>
                <p className="text-base font-semibold text-[var(--text-primary)]">Manage your account</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={onEditGoals}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 p-4 text-left transition hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)]"
              >
                <Target size={20} />
                <div>
                  <p className="font-semibold">Edit Goals</p>
                  <p className="text-sm opacity-70">Set academic and personal goals</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/settings'}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 p-4 text-left transition hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)]"
              >
                <SettingsIcon size={20} />
                <div>
                  <p className="font-semibold">Settings</p>
                  <p className="text-sm opacity-70">Customize your experience</p>
                </div>
              </button>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-2xl border border-red-400/40 bg-red-400/5 p-4 text-left transition hover:border-red-400 hover:bg-red-400/10"
              >
                <LogOut size={20} className="text-red-400" />
                <div>
                  <p className="font-semibold text-red-400">Sign Out</p>
                  <p className="text-sm text-red-400/70">Log out of your account</p>
                </div>
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Appearance</p>
                <p className="text-base font-semibold text-[var(--text-primary)]">Theme preference</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {theme === 'light' ? 'Soft daylight palette' : 'Midnight focus mode'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative h-9 w-16 rounded-full border border-[var(--border-color)] px-1 transition ${
                  theme === 'dark' ? 'bg-[var(--accent-primary)]/20' : 'bg-[var(--bg-secondary)]'
                }`}
                aria-label="Toggle theme"
              >
                <span
                  className={`absolute top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm transition ${
                    theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                  }`}
                >
                  {theme === 'dark' ? <Moon size={16} /> : <SunMedium size={16} />}
                </span>
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <UserRound size={18} />
              <p className="text-xs uppercase tracking-[0.2em]">Personal Details</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ProfileDetail label="Full Name" value={profile.name} />
              <ProfileDetail label="Email" value={user?.email ?? 'Not linked'} icon={<Mail size={14} />} />
              <ProfileDetail label="Grade / Class" value={profile.grade} icon={<BookOpen size={14} />} />
              <ProfileDetail
                label="Date of Birth"
                value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}
                icon={<CalendarDays size={14} />}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <NotebookPen size={18} />
              <p className="text-xs uppercase tracking-[0.2em]">Bio</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]">{bio}</p>
          </section>

          <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Sparkles size={18} />
              <p className="text-xs uppercase tracking-[0.2em]">Hobbies & Interests</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {hobbyList.length > 0 ? (
                hobbyList.map((hobby) => (
                  <span key={hobby} className="rounded-full border border-[var(--border-color)] px-3 py-1 text-sm text-[var(--text-primary)]">
                    {hobby}
                  </span>
                ))
              ) : (
                <p className="text-sm text-[var(--text-tertiary)]">No hobbies added yet.</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {interestList.length > 0 ? (
                interestList.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-[var(--accent-primary)]/10 px-3 py-1 text-sm font-medium text-[var(--accent-primary)]"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-sm text-[var(--text-tertiary)]">No interests added yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const ProfileDetail: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 p-4">
    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] flex items-center gap-1">
      {icon ? <span className="text-[var(--text-secondary)]">{icon}</span> : null}
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
  </div>
);

export default ProfilePage;

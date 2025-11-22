import React, { useMemo, useState } from 'react';
import { CalendarClock, ClipboardList, FileText, Sparkles } from 'lucide-react';

import type { StudentProfileRecord } from '@/api/client';
import type { User } from '@/features/auth/types';
import type { LucideIcon } from 'lucide-react';

import AssignmentCreator from './AssignmentCreator';
import AttendanceTracker from './AttendanceTracker';
import TeacherDashboard from './TeacherDashboard';
import TimetableEditor from './TimetableEditor';

type TeacherView = 'dashboard' | 'assignments' | 'attendance' | 'timetable';

interface TeacherAppProps {
  profile: StudentProfileRecord;
  idToken: string;
  authUser: User;
  onLogout: () => void | Promise<void>;
}

const navItems: Array<{ key: TeacherView; label: string; description: string; icon: LucideIcon }> = [
  { key: 'dashboard', label: 'Alerts', description: 'AI insights', icon: Sparkles },
  { key: 'assignments', label: 'Assignments', description: 'Create work', icon: FileText },
  { key: 'attendance', label: 'Attendance', description: 'Daily log', icon: ClipboardList },
  { key: 'timetable', label: 'Timetable', description: 'Weekly plan', icon: CalendarClock },
];

const TeacherApp: React.FC<TeacherAppProps> = ({ profile, idToken, authUser, onLogout }) => {
  const [view, setView] = useState<TeacherView>('dashboard');
  const teacherName = profile.name || authUser.name;
  const primaryClass = profile.grade || profile.subjects?.[0] || 'Homeroom';

  const content = useMemo(() => {
    switch (view) {
      case 'assignments':
        return <AssignmentCreator idToken={idToken} />;
      case 'attendance':
        return <AttendanceTracker idToken={idToken} />;
      case 'timetable':
        return <TimetableEditor idToken={idToken} />;
      case 'dashboard':
      default:
        return <TeacherDashboard idToken={idToken} />;
    }
  }, [idToken, view]);

  const isDashboardView = view === 'dashboard';

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-muted)]">Teacher Portal</p>
            <h1 className="text-3xl font-semibold font-display text-[var(--text-primary)]">{teacherName}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{primaryClass}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-[var(--text-muted)]">Signed in as</p>
              <p className="text-sm text-[var(--text-secondary)]">{authUser.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`rounded-2xl border px-4 py-5 text-left transition-all duration-200 ${
                  active
                    ? 'border-[var(--accent-primary)]/40 bg-[var(--bg-card)] shadow-[0_12px_30px_rgba(0,0,0,0.08)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-card)]/80 hover:border-[var(--accent-primary)]/40'
                }`}
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 text-[var(--accent-primary)]">
                  <Icon size={18} />
                </div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{item.label}</p>
                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{item.description}</p>
              </button>
            );
          })}
        </nav>

        <section
          className={`rounded-3xl p-6 ${
            isDashboardView
              ? 'border-white/10 bg-[#050d1f] text-white shadow-[0_30px_80px_rgba(3,7,18,0.7)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[0_30px_60px_rgba(0,0,0,0.08)]'
          }`}
        >
          {content}
        </section>
      </div>
    </div>
  );
};

export default TeacherApp;

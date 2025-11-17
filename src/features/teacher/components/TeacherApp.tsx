import React, { useMemo, useState } from 'react';

import type { StudentProfileRecord } from '@/api/client';
import type { User } from '@/features/auth/types';

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

const navItems: Array<{ key: TeacherView; label: string; description: string; icon: string }> = [
  { key: 'dashboard', label: 'Alerts', description: 'AI insights', icon: '⚡' },
  { key: 'assignments', label: 'Assignments', description: 'Create work', icon: '📝' },
  { key: 'attendance', label: 'Attendance', description: 'Daily log', icon: '📋' },
  { key: 'timetable', label: 'Timetable', description: 'Weekly plan', icon: '📅' },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#050d1f] to-[#030712] text-white">
      <header className="border-b border-white/5 bg-white/5 backdrop-blur-xl shadow-[0_10px_60px_rgba(3,7,18,0.65)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Teacher Portal</p>
            <h1 className="text-3xl font-semibold" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
              {teacherName}
            </h1>
            <p className="text-sm text-white/70">{primaryClass}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-white/50">Signed in as</p>
              <p className="text-sm text-white/80">{authUser.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:border-red-400 hover:text-red-200 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setView(item.key)}
              className={`rounded-2xl border px-4 py-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                view === item.key
                  ? 'bg-gradient-to-br from-indigo-500/30 to-sky-500/20 border-sky-400/50 shadow-[0_15px_45px_rgba(14,165,233,0.25)]'
                  : 'border-white/10 bg-white/5 hover:border-sky-400/40'
              }`}
            >
              <p className="text-2xl mb-2">{item.icon}</p>
              <p className="text-lg font-semibold text-white">{item.label}</p>
              <p className="text-xs uppercase tracking-wide text-white/60">{item.description}</p>
            </button>
          ))}
        </nav>

        <section className="glass-card rounded-3xl border border-white/10 p-6 shadow-[0_30px_80px_rgba(3,7,18,0.7)]">
          {content}
        </section>
      </div>
    </div>
  );
};

export default TeacherApp;

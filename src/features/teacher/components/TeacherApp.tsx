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

const navItems: Array<{ key: TeacherView; label: string; description: string }> = [
  { key: 'dashboard', label: 'Alerts', description: 'AI insights' },
  { key: 'assignments', label: 'Assignments', description: 'Create work' },
  { key: 'attendance', label: 'Attendance', description: 'Daily log' },
  { key: 'timetable', label: 'Timetable', description: 'Weekly plan' },
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
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-900 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Teacher Portal</p>
            <h1 className="text-3xl font-semibold">{teacherName}</h1>
            <p className="text-sm text-slate-400">{primaryClass}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-400">{authUser.email}</p>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-red-500 hover:text-red-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setView(item.key)}
              className={`rounded-xl border px-4 py-4 text-left transition-all ${
                view === item.key
                  ? 'border-indigo-500 bg-indigo-500/20 shadow-lg'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              <p className="text-lg font-semibold">{item.label}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.description}</p>
            </button>
          ))}
        </nav>

        <section className="mt-8">{content}</section>
      </div>
    </div>
  );
};

export default TeacherApp;

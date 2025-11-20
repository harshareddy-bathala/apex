import React, { useState } from 'react';
import { type User } from '@/features/auth/types';
import { type StudentProfile } from '@/types';

type View = 'dashboard' | 'chat' | 'checkin' | 'report' | 'homework' | 'tests' | 'peer-chat' | 'profile';

interface SidebarProps {
    authUser: User;
    profile: StudentProfile;
    role?: 'student' | 'teacher';
    currentView: View;
    hasTodayCheckIn: boolean;
    onViewChange: (view: View) => void;
    onCheckInClick: () => void;
    onReportClick: () => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    authUser,
    profile,
    role = 'student',
    currentView,
    hasTodayCheckIn,
    onViewChange,
    onCheckInClick,
    onReportClick,
    onLogout,
}) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
        { id: 'dashboard' as View, icon: '📊', label: 'Dashboard' },
        { id: 'homework' as View, icon: '📚', label: 'Homework' },
        { id: 'tests' as View, icon: '📝', label: 'Tests' },
        { id: 'peer-chat' as View, icon: '💬', label: 'Peers' },
        { id: 'chat' as View, icon: '🤖', label: 'AI Mentor' },
        { id: 'profile' as View, icon: '👤', label: 'Profile' },
    ];

    return (
        <>
            {/* Mobile Hamburger */}
            <button
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white md:hidden"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? '✕' : '☰'}
            </button>

            {/* Sidebar Container */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 p-6 border-b border-slate-800">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg">
                            SM
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight">Student Mentor</h1>
                            <p className="text-xs text-slate-400">AI Powered</p>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onViewChange(item.id);
                                    setIsMobileOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentView === item.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}

                        {role === 'teacher' && (
                            <button
                                onClick={() => {
                                    onReportClick();
                                    setIsMobileOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                            >
                                <span className="text-lg">📋</span>
                                Report
                            </button>
                        )}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-slate-800 space-y-3">
                        {!hasTodayCheckIn && (
                            <button
                                onClick={onCheckInClick}
                                className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
                            >
                                Daily Check-in
                            </button>
                        )}

                        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/50">
                            <img
                                src={authUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`}
                                alt={profile.name}
                                className="w-8 h-8 rounded-full bg-slate-700"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{profile.name}</p>
                                <p className="text-xs text-slate-400 truncate">{authUser.email}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                                title="Logout"
                            >
                                🚪
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;

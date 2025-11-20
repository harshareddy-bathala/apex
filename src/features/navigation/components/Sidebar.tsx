import React from 'react';
import { type User } from '@/features/auth/types';
import { type StudentProfile } from '@/types';

type View = 'dashboard' | 'chat' | 'checkin' | 'report' | 'homework' | 'tests' | 'peer-chat' | 'profile';

interface SidebarProps {
    authUser: User;
    profile: StudentProfile;
    role?: 'student' | 'teacher';
    currentView: View;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onViewChange: (view: View) => void;
    onCheckInClick: () => void;
    onReportClick: () => void;
    onEditProfile: () => void;
    onEditGoals: () => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    authUser,
    profile,
    role = 'student',
    currentView,
    isOpen,
    setIsOpen,
    onViewChange,
    onCheckInClick,
    onReportClick,
    onEditProfile,
    onEditGoals,
    onLogout,
}) => {
    const navItems = [
        { id: 'dashboard' as View, icon: '📊', label: 'Dashboard' },
        { id: 'homework' as View, icon: '📚', label: 'Homework' },
        { id: 'tests' as View, icon: '📝', label: 'Tests' },
        { id: 'peer-chat' as View, icon: '💬', label: 'Peers' },
        { id: 'chat' as View, icon: '🤖', label: 'AI Mentor' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen bg-[var(--card-bg)] border-r border-[var(--border-color)] transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20 hover:lg:w-64 group'}
        `}
            >
                {/* Header */}
                <div className="h-20 flex items-center px-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold shadow-md">
                            {authUser.photoURL ? (
                                <img
                                    src={authUser.photoURL}
                                    alt={authUser.name}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            ) : (
                                <span>SM</span>
                            )}
                        </div>
                        <div className={`whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100 lg:opacity-0'}`}>
                            <h1 className="font-bold text-[var(--text-primary)]">Student Mentor</h1>
                            <p className="text-xs text-[var(--text-secondary)]">AI Powered Learning</p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onViewChange(item.id);
                                if (window.innerWidth < 1024) setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group/item
                ${currentView === item.id
                                    ? 'bg-[var(--accent-primary)] text-white shadow-md'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                                }
              `}
                            title={item.label}
                        >
                            <span className="text-xl min-w-[1.5rem] text-center">{item.icon}</span>
                            <span className={`whitespace-nowrap font-medium transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 lg:group-hover:opacity-100 lg:group-hover:translate-x-0 lg:opacity-0'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}

                    {/* Divider */}
                    <div className="my-4 border-t border-[var(--border-color)]" />

                    {/* Check In Button */}
                    <button
                        onClick={onCheckInClick}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
                        title="Daily Check-in"
                    >
                        <span className="text-xl min-w-[1.5rem] text-center">✅</span>
                        <span className={`whitespace-nowrap font-medium transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100 lg:opacity-0'}`}>
                            Daily Check-in
                        </span>
                    </button>

                    {/* Teacher Actions */}
                    {role === 'teacher' && (
                        <button
                            onClick={onReportClick}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
                            title="Teacher Report"
                        >
                            <span className="text-xl min-w-[1.5rem] text-center">📋</span>
                            <span className={`whitespace-nowrap font-medium transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100 lg:opacity-0'}`}>
                                Teacher Report
                            </span>
                        </button>
                    )}
                </nav>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-[var(--border-color)]">
                    <button
                        onClick={onEditProfile}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                        title="Edit Profile"
                    >
                        <div className="w-8 h-8 min-w-[2rem] rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)] font-medium border border-[var(--border-color)]">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 lg:group-hover:opacity-100 lg:group-hover:w-auto lg:w-0'}`}>
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{profile.name}</p>
                            <p className="text-xs text-[var(--text-secondary)] truncate">{role}</p>
                        </div>
                    </button>

                    <button
                        onClick={onEditGoals}
                        className={`mt-1 w-full flex items-center gap-3 px-2 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all ${isOpen ? 'justify-start' : 'justify-center lg:group-hover:justify-start'}`}
                        title="Edit Goals"
                    >
                        <span className="text-lg min-w-[1.5rem]">🎯</span>
                        <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100 lg:opacity-0 w-0 lg:group-hover:w-auto'}`}>Edit Goals</span>
                    </button>

                    <button
                        onClick={onLogout}
                        className={`mt-1 w-full flex items-center gap-3 px-2 py-2 text-sm text-rose-500 hover:bg-rose-50 rounded-lg transition-all ${isOpen ? 'justify-start' : 'justify-center lg:group-hover:justify-start'}`}
                        title="Logout"
                    >
                        <span className="text-lg min-w-[1.5rem]">🚪</span>
                        <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100 lg:opacity-0 w-0 lg:group-hover:w-auto'}`}>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

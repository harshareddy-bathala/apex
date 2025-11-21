import React, { useState } from 'react';
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
    onLogout: () => void;
    onToggleTheme?: () => void;
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
    onLogout,
    onToggleTheme,
}) => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
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
                className={`fixed top-0 left-0 z-50 h-screen bg-[var(--bg-surface)] border-r border-[var(--border-color)] transition-all duration-300 ease-in-out flex flex-col shadow-lg
          ${isOpen
                        ? isCollapsed
                            ? 'w-20 translate-x-0'
                            : 'w-64 translate-x-0'
                        : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'
                    }
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

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-color)] space-y-2">
                    {/* Collapse Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-all"
                        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        <span className="text-lg">{isCollapsed ? '»' : '«'}</span>
                    </button>

                    {/* User Profile - with popup menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-left"
                            title="User Menu"
                        >
                            <div className="w-8 h-8 min-w-[2rem] rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-medium">
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                            {!isCollapsed && (
                                <div className="overflow-hidden flex-1">
                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{profile.name}</p>
                                    <p className="text-xs text-[var(--text-secondary)] truncate capitalize">{role}</p>
                                </div>
                            )}
                        </button>

                        {/* Profile Menu Popover */}
                        {showProfileMenu && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-lg py-2">
                                <button
                                    onClick={() => {
                                        onEditProfile();
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                >
                                    <span>⚙️</span>
                                    <span>Settings</span>
                                </button>
                                {onToggleTheme && (
                                    <button
                                        onClick={() => {
                                            onToggleTheme();
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                    >
                                        <span>🌓</span>
                                        <span>Toggle Theme</span>
                                    </button>
                                )}
                                <div className="border-t border-[var(--border-color)] my-1" />
                                <button
                                    onClick={() => {
                                        onLogout();
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-[var(--error)] hover:bg-red-50 flex items-center gap-2"
                                >
                                    <span>🚪</span>
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

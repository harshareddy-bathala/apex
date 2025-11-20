import React, { useEffect, useState } from 'react';
import { type StudentProfile } from '@/types';
import { useAuth } from '@/common/hooks/useAuth';

interface ProfilePageProps {
    profile: StudentProfile;
    onEditProfile: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onEditProfile }) => {
    const { user } = useAuth();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">Settings</p>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)]">My Profile</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Identity Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 rounded-3xl flex flex-col items-center text-center border border-[var(--border-color)]">
                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] mb-4 shadow-lg">
                            <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-secondary)]">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--text-primary)]">
                                        {profile.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-[var(--text-primary)]">{profile.name}</h3>
                        <p className="text-[var(--text-secondary)] mb-6">{profile.grade} Student</p>

                        <button
                            onClick={onEditProfile}
                            className="w-full py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium hover:bg-[var(--border-color)] transition-colors"
                        >
                            Edit Profile
                        </button>
                    </div>

                    {/* Theme Toggle Card */}
                    <div className="glass-card p-6 rounded-3xl border border-[var(--border-color)]">
                        <h4 className="font-semibold text-[var(--text-primary)] mb-4">Appearance</h4>
                        <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Theme Mode</span>
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 ${theme === 'dark' ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'
                                    }`}
                            >
                                <span
                                    className={`${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                                        } inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm`}
                                />
                            </button>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-3">
                            Switch between light and dark themes for better visibility.
                        </p>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-8 rounded-3xl border border-[var(--border-color)]">
                        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <span>👤</span> Personal Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div className="space-y-1">
                                <p className="text-sm text-[var(--text-secondary)]">Full Name</p>
                                <p className="font-medium text-[var(--text-primary)]">{profile.name}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-[var(--text-secondary)]">Email Address</p>
                                <p className="font-medium text-[var(--text-primary)]">{user?.email}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-[var(--text-secondary)]">Date of Birth</p>
                                <p className="font-medium text-[var(--text-primary)]">
                                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-[var(--text-secondary)]">Grade / Class</p>
                                <p className="font-medium text-[var(--text-primary)]">{profile.grade}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-3xl border border-[var(--border-color)]">
                        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <span>🎯</span> Interests & Goals
                        </h4>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-[var(--text-secondary)] mb-2">Academic Goals</p>
                                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
                                    {profile.academicGoals || 'No goals set yet.'}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-[var(--text-secondary)] mb-2">Hobbies & Interests</p>
                                <div className="flex flex-wrap gap-2">
                                    {profile.interests && profile.interests.length > 0 ? (
                                        profile.interests.map((interest, idx) => (
                                            <span key={idx} className="px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm font-medium">
                                                {interest}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[var(--text-tertiary)]">No interests added.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

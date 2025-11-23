import React from 'react';
import {
  LogOut,
  Moon,
  Palette,
  Settings as SettingsIcon,
  SunMedium,
  Target,
  UserRound,
} from 'lucide-react';

import { useTheme } from '@/common/context/ThemeContext';
import type { StudentProfile } from '@/types';

interface SettingsPageProps {
  profile: StudentProfile;
  onEditProfile: () => void;
  onEditGoals: () => void;
  onLogout: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  onEditProfile,
  onEditGoals,
  onLogout
}) => {
  const { theme, toggleTheme } = useTheme();
  const firstName = profile.name.split(' ')[0] ?? profile.name;

  const settingsSections = [
    {
      title: 'Account Settings',
      icon: UserRound,
      items: [
        {
          label: 'Edit Profile',
          description: 'Update your personal information and preferences',
          icon: UserRound,
          onClick: onEditProfile,
        },
        {
          label: 'Edit Goals',
          description: 'Set and modify your academic and personal goals',
          icon: Target,
          onClick: onEditGoals,
        },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          label: 'Theme',
          description: `Currently using ${theme === 'light' ? 'soft daylight palette' : 'midnight focus mode'}`,
          icon: theme === 'light' ? SunMedium : Moon,
          action: (
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
          ),
        },
      ],
    },
    {
      title: 'Account Actions',
      icon: SettingsIcon,
      items: [
        {
          label: 'Sign Out',
          description: 'Log out of your account',
          icon: LogOut,
          onClick: onLogout,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-muted)]">Settings</p>
        <h1 className="text-3xl font-display text-[var(--text-primary)]">Customize your experience</h1>
        <p className="font-hand text-lg text-[var(--text-secondary)]">Fine-tune APEX to match your style, {firstName}.</p>
      </div>

      <div className="space-y-8">
        {settingsSections.map((section) => (
          <section key={section.title} className="space-y-4">
            <div className="flex items-center gap-3">
              <section.icon size={20} className="text-[var(--text-secondary)]" />
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{section.title}</h2>
            </div>

            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition ${
                    item.onClick ? 'hover:border-[var(--border-strong)] cursor-pointer' : ''
                  } ${item.destructive ? 'hover:border-red-400/40 hover:bg-red-400/5' : ''}`}
                  onClick={item.onClick}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                      item.destructive
                        ? 'border-red-400/40 bg-red-400/10 text-red-400'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}>
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${
                        item.destructive ? 'text-red-400' : 'text-[var(--text-primary)]'
                      }`}>
                        {item.label}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>
                    </div>
                  </div>

                  {item.action && <div>{item.action}</div>}

                  {item.onClick && !item.action && (
                    <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;

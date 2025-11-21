import React, { useEffect, useMemo, useState } from 'react';
import {
  FolderKanban,
  LayoutDashboard,
  LucideIcon,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  SunMedium,
  UserRound,
  UsersRound,
} from 'lucide-react';

type ThemeMode = 'light' | 'dark';

export type AppShellView = 'dashboard' | 'community' | 'resources' | 'chat' | 'profile';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface AppShellProps {
  activeView: AppShellView;
  onNavigate: (view: AppShellView) => void;
  userName: string;
  userRole: 'student' | 'teacher';
  onLogout: () => void;
  children: React.ReactNode;
  quickActions?: QuickAction[];
  subHeader?: React.ReactNode;
}

const NAV_LINKS: Array<{ id: AppShellView; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'community', label: 'Community', icon: UsersRound },
  { id: 'resources', label: 'Resources', icon: FolderKanban },
  { id: 'chat', label: 'AI Mentor', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

const STORAGE_KEY = 'student-mentor-theme';

const AppShell: React.FC<AppShellProps> = ({
  activeView,
  onNavigate,
  userName,
  userRole,
  onLogout,
  children,
  quickActions = [],
  subHeader,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  );
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored ?? 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage failures in restricted environments
    }
  }, [theme]);

  useEffect(() => {
    if (!isDesktop) {
      setIsCollapsed(false);
    }
  }, [isDesktop]);

  const sidebarWidth = isDesktop ? (isCollapsed ? 88 : 280) : 0;

  const mainStyle = useMemo<React.CSSProperties>(
    () => (isDesktop ? { marginLeft: sidebarWidth } : {}),
    [isDesktop, sidebarWidth],
  );

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const handleNavigate = (view: AppShellView) => {
    onNavigate(view);
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  const themeIcon = theme === 'light' ? <Moon size={18} /> : <SunMedium size={18} />;
  const CollapseIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-[var(--border-strong)] bg-[var(--bg-elevated)]/90 backdrop-blur-md shadow-xl shadow-black/5 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{
          width: isDesktop ? sidebarWidth : 280,
        }}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-gradient-start)] text-lg font-semibold text-white shadow-lg shadow-[var(--brand-gradient-start)]/40">
              SM
            </div>
            {(!isCollapsed || !isDesktop) && (
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">Student Mentor</p>
                <p className="text-base font-semibold text-[var(--text-primary)]">AI Command</p>
              </div>
            )}
          </div>
          {isDesktop && (
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/60 p-2 text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] lg:block"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <CollapseIcon size={18} />
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-[0_8px_30px_rgb(0_0_0_/_0.08)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/80 hover:text-[var(--text-primary)]'
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                    active
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon size={18} />
                </span>
                {(!isCollapsed || !isDesktop) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4 px-4 pb-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{userName}</p>
            <p className="text-xs text-[var(--text-secondary)] capitalize">{userRole}</p>
            <button
              type="button"
              onClick={onLogout}
              className="mt-3 w-full rounded-xl border border-[var(--border-strong)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--border-strong)]/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Main content */}
      <div className="min-h-screen pt-20 lg:pt-0" style={mainStyle}>
        <header className="fixed top-0 left-0 right-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/80 backdrop-blur-xl lg:left-auto">
          <div className="flex items-center justify-between px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 p-2 text-[var(--text-primary)] lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">Command Center</p>
                <p className="text-lg font-semibold text-[var(--text-primary)] capitalize">{activeView}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/70 px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-card)]"
                  >
                    <Icon size={16} />
                    <span>{action.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/70 p-2.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                aria-label="Toggle color mode"
              >
                {themeIcon}
              </button>
            </div>
          </div>
          {subHeader && <div className="border-t border-[var(--border-subtle)] px-4 py-3 lg:px-8">{subHeader}</div>}
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;


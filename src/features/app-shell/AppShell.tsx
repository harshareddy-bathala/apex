import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  SunMedium,
  UserRound,
  UsersRound,
} from 'lucide-react';

import { useTheme } from '@/common/context/ThemeContext';

export type AppShellView = 'dashboard' | 'community' | 'resources' | 'chat' | 'profile' | 'settings' | 'assignments' | 'habits';

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
  { id: 'assignments', label: 'Assignments', icon: BookOpen },
  { id: 'habits', label: 'Habits', icon: CheckCircle },
  { id: 'community', label: 'Community', icon: UsersRound },
  { id: 'resources', label: 'Resources', icon: FolderKanban },
  { id: 'chat', label: 'AI Mentor', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'settings', label: 'Settings', icon: Settings },
];
const EXPANDED_SIDEBAR_WIDTH = 260;
const COLLAPSED_SIDEBAR_WIDTH = 72;
const SIDEBAR_PROFILE_ACTIONS = new Set(['Edit Goals']);

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
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setIsCollapsed(false);
    }
  }, [isDesktop]);

  const sidebarWidth = isDesktop ? (isCollapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH) : 0;

  const mainStyle = useMemo<React.CSSProperties>(
    () =>
      isDesktop
        ? {
            marginLeft: sidebarWidth,
            transition: 'margin 0.3s ease',
          }
        : {},
    [isDesktop, sidebarWidth],
  );

  const headerStyle = useMemo<React.CSSProperties>(
    () =>
      isDesktop
        ? {
            left: sidebarWidth,
            width: `calc(100% - ${sidebarWidth}px)`,
          }
        : {},
    [isDesktop, sidebarWidth],
  );

  const headerQuickActions = quickActions.filter((action) => !SIDEBAR_PROFILE_ACTIONS.has(action.label));
  const sidebarQuickActions = quickActions.filter((action) => SIDEBAR_PROFILE_ACTIONS.has(action.label));

  const handleNavigate = (view: AppShellView) => {
    onNavigate(view);
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  const themeIcon = theme === 'light' ? <Moon size={18} /> : <SunMedium size={18} />;
  const CollapseIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose;

  const profileMenuItems = [
    ...sidebarQuickActions.map((action) => ({
      label: action.label,
      icon: action.icon,
      onClick: action.onClick,
    })),
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-[var(--border-color)] bg-[var(--bg-elevated)]/95 backdrop-blur transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{
          width: isDesktop ? sidebarWidth : EXPANDED_SIDEBAR_WIDTH,
        }}
      >
        <div className={`flex items-center px-5 py-5 ${isCollapsed && isDesktop ? 'justify-between' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <img
                src="/logo.ico"
                alt="APEX Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            {(!isCollapsed || !isDesktop) && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">APEX</p>
                <p className="text-base font-semibold text-[var(--text-primary)] font-display">Workspace</p>
              </div>
            )}
          </div>

          {isDesktop && (
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 p-2 text-[var(--text-secondary)] transition hover:border-[var(--border-color)] hover:text-[var(--text-primary)]"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <CollapseIcon size={18} />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex flex-col gap-1 px-3 pb-4">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`group flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? 'border border-[var(--accent-primary)]/30 bg-[var(--bg-card)] text-[var(--text-primary)]'
                    : 'border border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)] hover:bg-[var(--bg-card)]/70 hover:text-[var(--text-primary)]'
                } ${isCollapsed && isDesktop ? 'justify-center' : 'gap-3'}`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                    active
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={18} />
                </span>
                {(!isCollapsed || !isDesktop) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        </div>

        {(!isCollapsed || !isDesktop) && (
        <div className="space-y-4 px-4 pb-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{userName}</p>
            <p className="text-xs text-[var(--text-secondary)] capitalize">{userRole}</p>
          </div>
          <div className="space-y-1">
            {profileMenuItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.onClick?.();
                    if (!isDesktop) {
                      setMobileOpen(false);
                    }
                  }}
                    className={`flex items-center rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-color)] hover:bg-[var(--bg-card)]/70 hover:text-[var(--text-primary)] ${
                      isCollapsed && isDesktop ? 'justify-center' : 'gap-3'
                    }`}
                >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                    <ItemIcon size={16} />
                  </span>
                  {(!isCollapsed || !isDesktop) && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
        )}

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
      <div className="min-h-screen bg-[var(--bg-app)]" style={mainStyle}>
        <header
          className="fixed top-0 left-0 right-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/85 backdrop-blur-xl transition-all"
          style={headerStyle}
        >
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
              {headerQuickActions.map((action) => {
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
            </div>
          </div>
          {subHeader && <div className="border-t border-[var(--border-subtle)] px-4 py-3 lg:px-8">{subHeader}</div>}
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-10 min-h-screen" style={{
          paddingTop: isDesktop ? '120px' : '140px'
        }}>{children}</main>
      </div>
    </div>
  );
};

export default AppShell;


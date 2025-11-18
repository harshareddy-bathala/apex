/**
 * Navigation Component
 * 
 * Responsive navigation bar with:
 * - View switching (Dashboard, Homework, Tests, Peers, AI Mentor)
 * - Check-in button (shows when no check-in for today)
 * - Report button
 * - User menu with profile actions
 * 
 * Updated: Uses premium design system colors
 * 
 * Accessibility: Keyboard navigation, ARIA labels, focus states
 */

import React from 'react';
import { type User } from '@/features/auth/types';
import { type StudentProfile } from '@/types';

type View = 'dashboard' | 'chat' | 'checkin' | 'report' | 'homework' | 'tests' | 'peer-chat';

interface NavigationProps {
  authUser: User;
  profile: StudentProfile;
  role?: 'student' | 'teacher';
  currentView: View;
  hasTodayCheckIn: boolean;
  onViewChange: (view: View) => void;
  onCheckInClick: () => void;
  onReportClick: () => void;
  onEditProfile: () => void;
  onEditGoals: () => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  authUser,
  profile,
  role = 'student',
  currentView,
  hasTodayCheckIn,
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
    <nav className="sticky top-0 z-40 backdrop-blur-2xl bg-[rgba(4,8,21,0.85)]/70 border-b border-white/5 shadow-[0_10px_60px_rgba(4,8,21,0.65)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#22d3ee] flex items-center justify-center text-white font-semibold shadow-lg ring-1 ring-white/10 overflow-hidden">
              {authUser.photoURL ? (
                <img 
                  src={authUser.photoURL} 
                  alt={authUser.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <img 
                  src="/favicon_io/favicon-32x32.png" 
                  alt="Student Mentor AI" 
                  className="w-full h-full object-contain" 
                />
              )}
            </div>
            <div className="hidden sm:block">
              <h1
                className="text-lg text-white font-semibold tracking-tight"
                style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}
              >
                Student Mentor AI
              </h1>
              <p className="text-xs text-white/60">
                Hey, {profile.name.split(' ')[0]}!
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {/* Main Nav Buttons */}
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60 border ${
                  currentView === item.id
                    ? 'text-white bg-gradient-to-r from-[#7c3aed] to-[#22d3ee] border-transparent shadow-[0_10px_30px_rgba(124,58,237,0.35)]'
                    : 'text-white/70 border-white/5 hover:text-white hover:bg-white/5'
                }`}
                aria-label={`View ${item.label}`}
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
            
            {/* Check In Button (only show if no check-in today) */}
            {!hasTodayCheckIn && (
              <button
                onClick={onCheckInClick}
                className="px-4 py-2 rounded-2xl text-sm font-semibold text-white shadow-[0_10px_35px_rgba(34,211,238,0.35)] bg-gradient-to-r from-[#22d3ee] to-[#14b8a6] hover:from-[#67e8f9] hover:to-[#2dd4bf] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60 flex items-center gap-2"
                aria-label="Complete daily check-in"
              >
                <span className="animate-pulse">✓</span>
                <span className="hidden sm:inline">Check In</span>
              </button>
            )}
            
            {/* Report Button (teachers only) */}
            {role === 'teacher' && (
              <button
                onClick={onReportClick}
                className="px-4 py-2 rounded-2xl text-sm font-medium text-white bg-white/10 border border-white/10 hover:bg-white/15 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 flex items-center gap-2"
                aria-label="View progress report"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Report</span>
              </button>
            )}
            
            {/* User Menu */}
            <div className="relative group">
              <button 
                className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#22d3ee] flex items-center justify-center text-white font-semibold shadow-[0_10px_35px_rgba(124,58,237,0.35)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="User menu"
                aria-haspopup="true"
              >
                {profile.name.charAt(0).toUpperCase()}
              </button>
              
              {/* Dropdown Menu */}
              <div 
                className="absolute right-0 mt-3 w-60 glass-card rounded-2xl shadow-[0_25px_60px_rgba(2,6,23,0.7)] border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden"
                role="menu"
                aria-label="User menu options"
              >
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <p className="text-sm font-medium text-white truncate">{authUser.name || authUser.email}</p>
                  <p className="text-xs text-white/60 truncate">{authUser.email}</p>
                </div>
                
                <button
                  onClick={onEditProfile}
                  className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors focus:outline-none focus:bg-white/10 flex items-center gap-3"
                  role="menuitem"
                >
                  <span className="text-lg">🧑‍🎓</span>
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={onEditGoals}
                  className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors focus:outline-none focus:bg-white/10 flex items-center gap-3"
                  role="menuitem"
                >
                  <span className="text-lg">🎯</span>
                  <span>Edit Goals</span>
                </button>
                
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-sm text-[#fb7185] hover:bg-[#fb7185]/10 hover:text-[#fecdd3] transition-colors focus:outline-none focus:bg-[#fb7185]/15 flex items-center gap-3"
                  role="menuitem"
                >
                  <span className="text-lg">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

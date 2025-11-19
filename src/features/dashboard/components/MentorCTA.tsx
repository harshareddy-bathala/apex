/**
 * MentorCTA Component
 * 
 * Companion card to encourage AI mentor interaction:
 * - Friendly avatar
 * - Inviting copy
 * - Single primary CTA button
 * 
 * Opens chat drawer when clicked
 * 
 * Updated: Uses new design system colors
 */

import React from 'react';

interface MentorCTAProps {
  onOpenChat: () => void;
  studentName: string;
}

export const MentorCTA: React.FC<MentorCTAProps> = ({ onOpenChat, studentName }) => {
  return (
    <div className="rounded-3xl p-6 glass-card border border-white/10 shadow-[0_25px_60px_rgba(5,8,20,0.55)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.35),transparent_55%)]"></div>
      <div className="relative z-10">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#22d3ee] via-[#7c3aed] to-[#f472b6] flex items-center justify-center shadow-[0_15px_45px_rgba(124,58,237,0.45)]">
            <span className="text-3xl">🤖</span>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-5">
          <h3 className="text-lg font-semibold text-white mb-2 font-display">
            Need help planning today?
          </h3>
          <p className="text-sm text-white/70">
            Your AI mentor is ready whenever you are, {studentName}. Ask for strategies, plans, or a quick motivation boost.
          </p>
        </div>

        {/* CTA button */}
        <button
          onClick={onOpenChat}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#7c3aed] to-[#22d3ee] shadow-[0_20px_55px_rgba(124,58,237,0.45)] hover:translate-y-[-2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 flex items-center justify-center gap-2"
          aria-label={`Chat with your AI Mentor as ${studentName}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat with Mentor
        </button>

        {/* Quick tips */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/60 text-center">
            💡 Try: “Draft a 3-day exam sprint” or “How do I stay consistent this week?”
          </p>
        </div>
      </div>
    </div>
  );
};

// Note: ChatDrawer now lives at '@/features/chat/components/ChatDrawer'.

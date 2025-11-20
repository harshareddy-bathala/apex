/**
 * ActionBar Component
 * 
 * Row of primary CTAs for quick actions:
 * - Ask Mentor (primary gradient button)
 * - Add New Goal (secondary)
 * - Today's Tasks (ghost)
 * 
 * Updated: Uses new premium design system colors
 * 
 * Responsive: full-width on mobile, inline on desktop
 * Accessibility: Clear focus states, aria-labels
 */

import React from 'react';

interface ActionBarProps {
  onAskMentor: () => void;
  onAddGoal?: () => void;
  onViewTasks?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  onAskMentor,
  onAddGoal,
  onViewTasks
}) => {
  const addGoalDisabled = !onAddGoal;
  const viewTasksDisabled = !onViewTasks;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Primary: Ask Mentor */}
      <button
        onClick={onAskMentor}
        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white font-medium shadow-[0_20px_45px_rgba(8,145,178,0.35)] bg-gradient-to-r from-[#22d3ee] via-[#2dd4bf] to-[#14b8a6] hover:translate-y-[-2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/70"
        aria-label="Ask your AI Mentor"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Ask Mentor
      </button>
    </div>
  );
};

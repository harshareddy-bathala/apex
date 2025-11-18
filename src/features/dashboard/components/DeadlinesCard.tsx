/**
 * DeadlinesCard Component
 * 
 * Shows upcoming deadlines with:
 * - Subject tags
 * - Due dates
 * - Urgency badges (low/medium/high)
 * - Days remaining
 * 
 * Updated: Uses new premium design system colors
 * 
 * Accessibility: Clear hierarchy, semantic time elements
 */

import React from 'react';

interface Deadline {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  daysLeft: number;
  priority: 'low' | 'medium' | 'high';
}

interface DeadlinesCardProps {
  deadlines: Deadline[];
  onDeadlineClick?: (deadlineId: string) => void;
  onAddDeadline?: () => void;
}

export const DeadlinesCard: React.FC<DeadlinesCardProps> = ({
  deadlines,
  onDeadlineClick,
  onAddDeadline
}) => {
  const priorityConfig = {
    high: {
      bg: 'bg-[#fb7185]/10',
      border: 'border-[#fb7185]/30',
      text: 'text-[#fb7185]',
      badge: 'bg-[#fb7185]/15 text-[#fecdd3]',
      label: 'Urgent'
    },
    medium: {
      bg: 'bg-[#fbbf24]/10',
      border: 'border-[#fbbf24]/30',
      text: 'text-[#fbbf24]',
      badge: 'bg-[#fbbf24]/15 text-[#fef3c7]',
      label: 'Soon'
    },
    low: {
      bg: 'bg-[#22d3ee]/10',
      border: 'border-[#22d3ee]/30',
      text: 'text-[#22d3ee]',
      badge: 'bg-[#22d3ee]/15 text-[#cffafe]',
      label: 'Upcoming'
    }
  };

  const formatDaysLeft = (days: number): string => {
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };

  return (
    <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-[0_25px_60px_rgba(5,8,20,0.55)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white flex items-center gap-2 text-lg font-semibold">
          <span className="text-2xl">📅</span>
          Upcoming Deadlines
        </h2>
        {deadlines.length > 0 && (
          <span className="text-[11px] uppercase tracking-[0.35em] text-white/60 bg-white/5 px-3 py-1 rounded-full">
            {deadlines.length} deadline{deadlines.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {deadlines.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-8">
            No upcoming deadlines. You're all caught up! ✨
          </p>
        ) : (
          deadlines.map((deadline) => {
            const config = priorityConfig[deadline.priority];
            const dueDate = new Date(deadline.dueDate);

            return (
              <button
                key={deadline.id}
                onClick={() => onDeadlineClick?.(deadline.id)}
                className={`w-full text-left border ${config.border} ${config.bg} rounded-2xl p-4 hover:border-white/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30`}
                aria-label={`View deadline: ${deadline.title}, ${formatDaysLeft(deadline.daysLeft)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white mb-1 truncate">
                      {deadline.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 text-micro mb-2">
                      <span className="px-2 py-0.5 bg-white/5 text-white/70 rounded">
                        {deadline.subject}
                      </span>
                      <span className={`px-2 py-0.5 ${config.badge} rounded font-medium`}>
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/60">
                      <time dateTime={deadline.dueDate} className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </time>
                      <span className={config.text}>•</span>
                      <span className={config.text}>
                        {formatDaysLeft(deadline.daysLeft)}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg className="w-4 h-4 text-white/40 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Quick add button */}
      <button
        type="button"
        onClick={onAddDeadline}
        disabled={!onAddDeadline}
        title={!onAddDeadline ? 'Coming soon' : undefined}
        className={`w-full mt-4 py-2 text-sm text-white/60 border border-dashed border-white/15 rounded-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
          onAddDeadline ? 'hover:text-white hover:border-white/35' : 'opacity-50 cursor-not-allowed'
        }`}
        aria-label="Add new deadline"
        aria-disabled={!onAddDeadline}
      >
        + Add deadline
      </button>
    </div>
  );
};

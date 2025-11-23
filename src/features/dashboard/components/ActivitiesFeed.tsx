/**
 * ActivitiesFeed Component
 * 
 * Compact feed of recent student activities with:
 * - Category chips (academic, wellness, sports)
 * - Timestamps
 * - Icons
 * - Filter options
 * 
 * Updated: Uses new premium design system colors
 * 
 * Accessibility: Semantic list markup, filterable with keyboard
 */

import React, { useState } from 'react';

interface Activity {
  id: string;
  category: 'academic' | 'wellness' | 'sports';
  text: string;
  time: string;
  icon: string;
}

interface ActivitiesFeedProps {
  activities: Activity[];
  maxItems?: number;
}

export const ActivitiesFeed: React.FC<ActivitiesFeedProps> = ({
  activities,
  maxItems = 10
}) => {
  const [filter, setFilter] = useState<'all' | 'academic' | 'wellness' | 'sports'>('all');

  const categoryConfig = {
    academic: {
      bg: 'bg-[var(--accent-primary)]/15',
      text: 'text-[var(--accent-primary)]',
      label: 'Academic'
    },
    wellness: {
      bg: 'bg-green-400/15',
      text: 'text-green-400',
      label: 'Wellness'
    },
    sports: {
      bg: 'bg-orange-400/15',
      text: 'text-orange-400',
      label: 'Sports'
    }
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.category === filter);

  const displayActivities = filteredActivities.slice(0, maxItems);

  return (
    <div className="rounded-3xl p-5 border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[0_25px_60px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[var(--text-primary)] flex items-center gap-2 text-lg font-semibold">
          <span className="text-2xl">🎯</span>
          Recent Activities
        </h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
        {(['all', 'academic', 'wellness', 'sports'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-color)] ${
              filter === tab
                ? 'bg-[var(--accent-primary)] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]'
                : 'bg-[var(--bg-secondary)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            aria-label={`Filter by ${tab} activities`}
            aria-pressed={filter === tab}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Activities list */}
      <div className="space-y-3">
        {displayActivities.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm text-center py-8">
            No activities to show
          </p>
        ) : (
          <ul className="space-y-3" role="list">
            {displayActivities.map((activity) => {
              const config = categoryConfig[activity.category];

              return (
                <li
                  key={activity.id}
                  className="flex items-start gap-3 rounded-2xl p-4 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20 hover:border-[var(--border-color)] transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)]/60 rounded-2xl text-lg">
                    {activity.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] mb-1">
                      {activity.text}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-micro rounded bg-[var(--bg-secondary)]/60 ${config.text}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* View all button */}
      {filteredActivities.length > maxItems && (
        <button
          className="w-full mt-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)]/60 hover:bg-[var(--bg-secondary)] rounded-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-color)]"
          aria-label="View all activities"
        >
          View all {filteredActivities.length} activities
        </button>
      )}
    </div>
  );
};

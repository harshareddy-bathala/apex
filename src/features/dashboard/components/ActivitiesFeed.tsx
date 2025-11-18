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
      bg: 'bg-[#22d3ee]/15',
      text: 'text-[#67e8f9]',
      label: 'Academic'
    },
    wellness: {
      bg: 'bg-[#34d399]/15',
      text: 'text-[#34d399]',
      label: 'Wellness'
    },
    sports: {
      bg: 'bg-[#fb923c]/15',
      text: 'text-[#fb923c]',
      label: 'Sports'
    }
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.category === filter);

  const displayActivities = filteredActivities.slice(0, maxItems);

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-[0_25px_60px_rgba(5,8,20,0.55)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white flex items-center gap-2 text-lg font-semibold">
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
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              filter === tab
                ? 'bg-gradient-to-r from-[#7c3aed] to-[#22d3ee] text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)]'
                : 'premium-chip text-white/70 hover:text-white'
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
          <p className="text-white/50 text-sm text-center py-8">
            No activities to show
          </p>
        ) : (
          <ul className="space-y-3" role="list">
            {displayActivities.map((activity) => {
              const config = categoryConfig[activity.category];

              return (
                <li
                  key={activity.id}
                  className="flex items-start gap-3 glass-panel rounded-2xl p-4 border border-white/5 hover:border-white/25 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl text-lg">
                    {activity.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white mb-1">
                      {activity.text}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`premium-chip px-2 py-0.5 text-micro ${config.text}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-white/50">
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
          className="w-full mt-4 py-2 text-sm text-white/60 hover:text-white premium-chip rounded-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          aria-label="View all activities"
        >
          View all {filteredActivities.length} activities
        </button>
      )}
    </div>
  );
};

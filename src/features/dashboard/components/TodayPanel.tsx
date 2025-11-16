/**
 * TodayPanel Component
 * 
 * Displays today's focus items with:
 * - Checkboxes for completion
 * - Subject tags
 * - Time estimates
 * - Quick action buttons (snooze/reschedule)
 * 
 * Updated: Uses new premium design system colors
 * 
 * Accessibility: Checkboxes with labels, keyboard navigation
 */

import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  subject: string;
  timeEstimate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface TodayPanelProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onSnoozeTask?: (taskId: string) => void;
  onRescheduleTask?: (taskId: string) => void;
}

export const TodayPanel: React.FC<TodayPanelProps> = ({
  tasks,
  onToggleTask,
  onSnoozeTask,
  onRescheduleTask
}) => {
  const priorityColors = {
    high: 'border-[#fb7185]/40 bg-[#fb7185]/10',
    medium: 'border-[#fbbf24]/40 bg-[#fbbf24]/10',
    low: 'border-[#22d3ee]/40 bg-[#22d3ee]/10'
  };

  const priorityDots = {
    high: 'bg-[#fb7185]',
    medium: 'bg-[#fbbf24]',
    low: 'bg-[#22d3ee]'
  };

  return (
    <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-[0_25px_60px_rgba(5,8,20,0.55)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white flex items-center gap-2 text-lg font-semibold">
          <span className="text-2xl">📋</span>
          Today's Focus
        </h2>
        <span className="text-[11px] uppercase tracking-[0.35em] text-white/60 bg-white/5 px-3 py-1 rounded-full">
          {tasks.filter(t => !t.completed).length} pending
        </span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-muted-ink text-body-sm text-center py-8">
            No tasks for today. Great job! 🎉
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`relative border rounded-2xl p-4 transition-all duration-200 hover:border-white/30 ${
                task.completed
                  ? 'border-white/5 bg-white/5/20 opacity-60'
                  : priorityColors[task.priority]
              }`}
            >
              {/* Priority dot */}
              <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${priorityDots[task.priority]}`}></div>

              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <label className="relative flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                    className="sr-only peer"
                    aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  />
                  <div className="w-5 h-5 rounded border-2 border-white/20 peer-checked:bg-[#22d3ee] peer-checked:border-[#22d3ee] flex items-center justify-center transition-all group-hover:border-[#22d3ee]">
                    {task.completed && (
                      <svg className="w-3 h-3 text-bg-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold mb-1 ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>
                    {task.title}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-2 text-micro">
                    <span className="px-2 py-0.5 bg-white/5 text-white/70 rounded">
                      {task.subject}
                    </span>
                    <span className="text-white/60 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {task.timeEstimate}
                    </span>
                  </div>

                  {/* Quick actions */}
                  {!task.completed && (onSnoozeTask || onRescheduleTask) && (
                    <div className="flex gap-2 mt-2">
                      {onSnoozeTask && (
                        <button
                          onClick={() => onSnoozeTask(task.id)}
                          className="text-xs text-white/60 hover:text-white transition-colors"
                          aria-label={`Snooze task: ${task.title}`}
                        >
                          Snooze
                        </button>
                      )}
                      {onRescheduleTask && (
                        <button
                          onClick={() => onRescheduleTask(task.id)}
                          className="text-xs text-white/60 hover:text-white transition-colors"
                          aria-label={`Reschedule task: ${task.title}`}
                        >
                          Reschedule
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Progress indicator */}
      {tasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Progress</span>
            <span>{Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#22d3ee] via-[#2dd4bf] to-[#7c3aed] rounded-full transition-all duration-500"
              style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

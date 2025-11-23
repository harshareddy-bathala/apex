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

import React from 'react';
import type { Homework } from '@/types';

interface Task {
  id: string;
  homeworkId?: string;
  title: string;
  subject: string;
  timeEstimate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  status?: Homework['status'];
}

interface TodayPanelProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => Promise<void> | void;
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
    high: 'border-red-400/40 bg-red-400/10',
    medium: 'border-yellow-400/40 bg-yellow-400/10',
    low: 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10'
  };

  const priorityDots = {
    high: 'bg-red-400',
    medium: 'bg-yellow-400',
    low: 'bg-[var(--accent-primary)]'
  };

  return (
    <div className="rounded-3xl p-5 border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[0_25px_60px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[var(--text-primary)] flex items-center gap-2 text-lg font-semibold">
          <span className="text-2xl">📋</span>
          Today's Focus
        </h2>
        <span className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)] bg-[var(--bg-secondary)]/60 px-3 py-1 rounded-full">
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
              className={`relative border rounded-2xl p-4 transition-all duration-200 hover:border-[var(--border-strong)] ${
                task.completed
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20 opacity-60'
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
                  <div className="w-5 h-5 rounded border-2 border-[var(--border-subtle)] peer-checked:bg-[var(--accent-primary)] peer-checked:border-[var(--accent-primary)] flex items-center justify-center transition-all group-hover:border-[var(--accent-primary)]">
                    {task.completed && (
                      <svg className="w-3 h-3 text-bg-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold mb-1 ${task.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                    {task.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-micro">
                    <span className="px-2 py-0.5 bg-[var(--bg-secondary)]/60 text-[var(--text-secondary)] rounded">
                      {task.subject}
                    </span>
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
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
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          aria-label={`Snooze task: ${task.title}`}
                        >
                          Snooze
                        </button>
                      )}
                      {onRescheduleTask && (
                        <button
                          onClick={() => onRescheduleTask(task.id)}
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span>Progress</span>
            <span>{Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--bg-secondary)]/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500"
              style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

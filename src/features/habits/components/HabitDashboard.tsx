import React, { useState, useCallback } from 'react';
import { CheckCircle2, Circle, Plus, Target, TrendingUp, Calendar } from 'lucide-react';
import { getHabits, createHabit, checkinHabit, type Habit } from '@/api/client';

interface HabitDashboardProps {
  habits: Habit[];
  onHabitToggle: (habitId: string, completed: boolean) => void;
  onHabitCreate: (name: string, timeOfDay: Habit['timeOfDay']) => void;
}

const timeBadges: Record<Habit['timeOfDay'], string> = {
  morning: 'bg-amber-100/50 text-amber-700 border-amber-200/60',
  afternoon: 'bg-sky-100/40 text-sky-700 border-sky-200/60',
  evening: 'bg-violet-100/40 text-violet-700 border-violet-200/60',
};

const HabitDashboard: React.FC<HabitDashboardProps> = ({ habits, onHabitToggle, onHabitCreate }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitTimeOfDay, setNewHabitTimeOfDay] = useState<Habit['timeOfDay']>('morning');

  const completedToday = habits.filter(h => h.completedToday).length;
  const completionRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

  // Calculate streak (simplified - just count consecutive days)
  const currentStreak = habits.length > 0 ? Math.min(...habits.map(h => {
    // This is a simplified streak calculation - in a real app you'd track historical data
    const completedDates = h.completedDates || [];
    const today = new Date().toISOString().split('T')[0];
    return completedDates.includes(today) ? 1 : 0;
  })) : 0;

  const handleCreateHabit = useCallback(() => {
    if (newHabitName.trim()) {
      onHabitCreate(newHabitName.trim(), newHabitTimeOfDay);
      setNewHabitName('');
      setNewHabitTimeOfDay('morning');
      setShowCreateForm(false);
    }
  }, [newHabitName, newHabitTimeOfDay, onHabitCreate]);

  const groupedHabits = habits.reduce((acc, habit) => {
    if (!acc[habit.timeOfDay]) {
      acc[habit.timeOfDay] = [];
    }
    acc[habit.timeOfDay].push(habit);
    return acc;
  }, {} as Record<Habit['timeOfDay'], Habit[]>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-display">My Micro-Habits</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Build consistency with small, daily wins</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-primary-dark)] transition-colors"
        >
          <Plus size={18} />
          Create New Habit
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-panel rounded-2xl p-6 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-success)]/10 text-[var(--accent-success)]">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Today's Progress</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {completedToday}/{habits.length}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Completion Rate</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Current Streak</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{currentStreak} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Habits by Time of Day */}
      {(['morning', 'afternoon', 'evening'] as const).map((timeOfDay) => {
        const timeHabits = groupedHabits[timeOfDay] || [];

        if (timeHabits.length === 0) return null;

        return (
          <div key={timeOfDay} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] capitalize">{timeOfDay}</h2>
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${timeBadges[timeOfDay]}`}>
                {timeOfDay}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {timeHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="glass-panel rounded-2xl p-6 border border-[var(--border-subtle)] hover:border-[var(--border-color)] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onHabitToggle(habit.id, !habit.completedToday)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 transition-all ${
                          habit.completedToday
                            ? 'border-[var(--accent-success)] bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
                            : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                        }`}
                      >
                        {habit.completedToday ? <CheckCircle2 size={32} /> : <Circle size={30} />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{habit.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Tap to check off</p>
                      </div>
                    </div>
                  </button>

                  {habit.lastCompletedAt && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                      <p className="text-xs text-[var(--text-muted)]">
                        Last completed: {new Date(habit.lastCompletedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {habits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] mb-6">
            <Target size={32} className="text-[var(--text-muted)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No habits yet</h3>
          <p className="text-[var(--text-secondary)] mb-6 max-w-md">
            Start building consistency with small, achievable habits. Create your first micro-habit to get started!
          </p>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-primary-dark)] transition-colors"
          >
            <Plus size={18} />
            Create Your First Habit
          </button>
        </div>
      )}

      {/* Create Habit Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-[var(--border-subtle)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create New Habit</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Add a small, achievable daily habit</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g., Drink a glass of water"
                  className="w-full px-3 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateHabit()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                  When to do it
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['morning', 'afternoon', 'evening'] as const).map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setNewHabitTimeOfDay(time)}
                      className={`py-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                        newHabitTimeOfDay === time
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewHabitName('');
                    setNewHabitTimeOfDay('morning');
                  }}
                  className="flex-1 py-2 px-4 border border-[var(--border-color)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-app)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateHabit}
                  disabled={!newHabitName.trim()}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-dark)] disabled:opacity-50 transition-colors"
                >
                  Create Habit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitDashboard;

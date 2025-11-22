import React, { useState } from 'react';
import { postCheckIn } from '@/api/client';
import { DailyCheckIn as DailyCheckInType, StudentProfile } from '@/types';

interface DailyCheckInProps {
  profile: StudentProfile;
  idToken: string;
  onComplete: (checkIn: DailyCheckInType) => void;
  onClose: () => void;
}

const DailyCheckIn: React.FC<DailyCheckInProps> = ({ profile, idToken, onComplete, onClose }) => {
  const [mood, setMood] = useState(5);
  const [win, setWin] = useState('');
  const [blocker, setBlocker] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const payload: Omit<DailyCheckInType, 'id'> = {
      studentId: profile.id,
      date: new Date().toISOString().split('T')[0],
      mood: getMoodLabel(mood),
      stressLevel: mood <= 3 ? 8 : mood <= 5 ? 5 : mood <= 7 ? 3 : 1,
      sleepHours: 7, // Default value
      energyLevel: mood <= 3 ? 3 : mood <= 5 ? 5 : mood <= 7 ? 7 : 9,
      studyHours: 0, // Default value
      subjectsStudied: [],
      homeworkCompleted: false, // Default value
      classesAttended: 0, // Default value
      physicalActivityMinutes: 0, // Default value
      socialInteractions: 'some', // Default value
      emotionalState: '',
      achievements: [],
      win: win.trim() || undefined,
      blocker: blocker.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const saved = await postCheckIn(idToken, payload);
      onComplete(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit your check-in right now.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodLabel = (value: number): 'excellent' | 'good' | 'okay' | 'stressed' | 'struggling' => {
    if (value >= 9) return 'excellent';
    if (value >= 7) return 'good';
    if (value >= 5) return 'okay';
    if (value >= 3) return 'stressed';
    return 'struggling';
  };

  const getMoodEmoji = (value: number): string => {
    if (value >= 9) return '😄';
    if (value >= 7) return '😊';
    if (value >= 5) return '😐';
    if (value >= 3) return '😰';
    return '😔';
  };

        return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-elevated)]/95 backdrop-blur-xl rounded-2xl border border-[var(--border-subtle)] shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] font-display">Daily Check-In</h2>
                  <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
                  >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
                  </button>
              </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">How are you feeling today?</p>
            </div>

        <div className="p-6 space-y-6">
          {/* Mood Slider */}
              <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              Mood: {getMoodEmoji(mood)} {mood}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full h-2 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer slider-mood"
                />
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
              <span>Struggling</span>
              <span>Excellent</span>
                </div>
              </div>

          {/* Top Win */}
                <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Today's Top Win
                </label>
                <textarea
                  value={win}
                  onChange={(e) => setWin(e.target.value)}
              placeholder="What went well today?"
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg placeholder-[var(--text-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] resize-none transition-colors"
            />
              </div>

          {/* Blocker */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Any Blockers?
                </label>
                <textarea
                  value={blocker}
                  onChange={(e) => setBlocker(e.target.value)}
              placeholder="What's slowing you down?"
                rows={2}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg placeholder-[var(--text-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] resize-none transition-colors"
              />
            </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/50 dark:border-red-800/50">
              <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
                </div>
              )}

          <div className="flex gap-3">
          <button
            onClick={onClose}
              className="flex-1 py-2 px-4 border border-[var(--border-color)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
              Cancel
          </button>
              <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-dark)] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Check-In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckIn;

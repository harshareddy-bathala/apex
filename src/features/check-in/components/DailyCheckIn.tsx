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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-beige-200/30 shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-beige-200/20">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 font-display">Daily Check-In</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">How are you feeling today?</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Mood Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mood: {getMoodEmoji(mood)} {mood}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full h-2 bg-beige-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #f97316 30%, #eab308 50%, #22c55e 70%, #15803d 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Struggling</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Top Win */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Today's Top Win
            </label>
            <textarea
              value={win}
              onChange={(e) => setWin(e.target.value)}
              placeholder="What went well today?"
              rows={2}
              className="w-full px-3 py-2 bg-white border border-beige-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </div>

          {/* Blocker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any Blockers?
            </label>
            <textarea
              value={blocker}
              onChange={(e) => setBlocker(e.target.value)}
              placeholder="What's slowing you down?"
              rows={2}
              className="w-full px-3 py-2 bg-white border border-beige-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-accent-primary hover:bg-accent-primary-dark disabled:opacity-50 transition-colors"
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

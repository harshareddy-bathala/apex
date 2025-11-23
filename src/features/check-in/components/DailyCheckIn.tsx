import React, { useState } from 'react';
import { postCheckIn, CheckInResponse } from '@/api/client';
import { DailyCheckIn as DailyCheckInType, StudentProfile } from '@/types';

interface DailyCheckInProps {
  profile: StudentProfile;
  idToken: string;
  onComplete: (checkIn: DailyCheckInType) => void;
  onClose: () => void;
}

const DailyCheckIn: React.FC<DailyCheckInProps> = ({ profile, idToken, onComplete, onClose }) => {
  const [mood, setMood] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [studyHours, setStudyHours] = useState(0);
  const [classesAttended, setClassesAttended] = useState(0);
  const [win, setWin] = useState('');
  const [blocker, setBlocker] = useState('');
  const [mainMistake, setMainMistake] = useState('');
  const [criticalObservation, setCriticalObservation] = useState('');
  const [mainAchievement, setMainAchievement] = useState('');
  const [planForTomorrow, setPlanForTomorrow] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CheckInResponse['analysis'] | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleSubmit = async () => {
    const payload: Omit<DailyCheckInType, 'id'> = {
      studentId: profile.id,
      date: new Date().toISOString().split('T')[0],
      mood: getMoodLabel(mood),
      stressLevel: mood <= 3 ? 8 : mood <= 5 ? 5 : mood <= 7 ? 3 : 1,
      sleepHours: sleepHours,
      energyLevel: mood <= 3 ? 3 : mood <= 5 ? 5 : mood <= 7 ? 7 : 9,
      studyHours: studyHours,
      subjectsStudied: [],
      homeworkCompleted: false, // Default value
      classesAttended: classesAttended,
      physicalActivityMinutes: 0, // Default value
      socialInteractions: 'some', // Default value
      emotionalState: '',
      achievements: mainAchievement ? [mainAchievement] : [],
      win: win.trim() || undefined,
      blocker: blocker.trim() || undefined,
      mainMistake: mainMistake.trim() || undefined,
      criticalObservation: criticalObservation.trim() || undefined,
      mainAchievement: mainAchievement.trim() || undefined,
      planForTomorrow: planForTomorrow.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await postCheckIn(idToken, payload);
      setAnalysis(response.analysis);
      setShowAnalysis(true);

      // Create a check-in object for the onComplete callback
      const checkInData: DailyCheckInType = {
        id: response.checkinId,
        studentId: profile.id,
        date: payload.date,
        mood: payload.mood as DailyCheckInType['mood'],
        stressLevel: payload.stressLevel,
        sleepHours: payload.sleepHours,
        energyLevel: 7, // Default
        studyHours: payload.studyHours || 0,
        subjectsStudied: [],
        homeworkCompleted: false,
        classesAttended: payload.classesAttended || 0,
        physicalActivityMinutes: 0,
        socialInteractions: 'some',
        emotionalState: '',
        achievements: payload.mainAchievement ? [payload.mainAchievement] : [],
        win: payload.win,
        blocker: payload.blocker,
        mainMistake: payload.mainMistake,
        criticalObservation: payload.criticalObservation,
        mainAchievement: payload.mainAchievement,
        planForTomorrow: payload.planForTomorrow,
        timestamp: payload.timestamp,
      };

      onComplete(checkInData);
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
        {showAnalysis && analysis ? (
          /* Analysis Screen */
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-display">AI Analysis</h2>
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

            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">✅ Your Check-in is Complete!</h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Here's what our AI mentor observed from your daily reflections:
                </p>
              </div>

              {analysis.insights.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Key Insights</h3>
                  <ul className="space-y-2">
                    {analysis.insights.map((insight, index) => (
                      <li key={index} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Personalized Recommendations</h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                        <span className="text-purple-500 mt-1">💡</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <div className="flex justify-center">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-dark)] transition-colors font-medium"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <>
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

          {/* Hours Slept */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Hours Slept Last Night
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-colors"
              placeholder="e.g., 7.5"
            />
          </div>

          {/* Hours Studied */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Hours Studied Today
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={studyHours}
              onChange={(e) => setStudyHours(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-colors"
              placeholder="e.g., 2.5"
            />
          </div>

          {/* Classes Attended */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Classes Attended Today
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={classesAttended}
              onChange={(e) => setClassesAttended(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-colors"
              placeholder="e.g., 5"
            />
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

          {/* Main Achievement */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Main Achievement Today
            </label>
            <textarea
              value={mainAchievement}
              onChange={(e) => setMainAchievement(e.target.value)}
              placeholder="What was your biggest accomplishment today?"
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg placeholder-[var(--text-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] resize-none transition-colors"
            />
          </div>

          {/* Blockers */}
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

          {/* Main Mistake */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Main Mistake Today
            </label>
            <textarea
              value={mainMistake}
              onChange={(e) => setMainMistake(e.target.value)}
              placeholder="What was your biggest mistake or area for improvement today?"
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg placeholder-[var(--text-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] resize-none transition-colors"
            />
          </div>

          {/* Critical Observation */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Critical Observation
            </label>
            <textarea
              value={criticalObservation}
              onChange={(e) => setCriticalObservation(e.target.value)}
              placeholder="What important insight or pattern did you notice today?"
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg placeholder-[var(--text-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] resize-none transition-colors"
            />
          </div>

          {/* Plan for Tomorrow */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Plan for Tomorrow
            </label>
            <textarea
              value={planForTomorrow}
              onChange={(e) => setPlanForTomorrow(e.target.value)}
              placeholder="What do you plan to focus on and improve tomorrow?"
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
          </>
        )}
      </div>
    </div>
  );
};

export default DailyCheckIn;

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
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Mood & Mental State
  type MoodValue = 'excellent' | 'good' | 'okay' | 'stressed' | 'struggling';
  const [mood, setMood] = useState<MoodValue>('good');
  const [moodNotes, setMoodNotes] = useState('');
  const [stressLevel, setStressLevel] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [energyLevel, setEnergyLevel] = useState(5);

  // Step 2: Academic Activities
  const [studyHours, setStudyHours] = useState(0);
  const [subjectsStudied, setSubjectsStudied] = useState<string[]>([]);
  const [homeworkCompleted, setHomeworkCompleted] = useState(true);
  const [classesAttended, setClassesAttended] = useState(6);
  const [academicChallengesFaced, setAcademicChallengesFaced] = useState('');

  // Step 3: Physical & Social
  const [physicalActivityMinutes, setPhysicalActivityMinutes] = useState(0);
  const [sportsParticipation, setSportsParticipation] = useState('');
  const [socialInteractions, setSocialInteractions] = useState<'many' | 'some' | 'few' | 'none'>('some');
  const subjectOptions = (profile.subjects?.length ? profile.subjects : ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Languages']).slice(0, 8);

  // Step 4: Achievements & Reflection
  const [emotionalState, setEmotionalState] = useState('');
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementInput, setAchievementInput] = useState('');
  const [win, setWin] = useState('');
  const [blocker, setBlocker] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const moodOptions: ReadonlyArray<{ value: MoodValue; label: string; emoji: string; color: string }> = [
    { value: 'excellent', label: 'Excellent', emoji: '😄', color: 'bg-green-600' },
    { value: 'good', label: 'Good', emoji: '😊', color: 'bg-sky-600' },
    { value: 'okay', label: 'Okay', emoji: '😐', color: 'bg-yellow-600' },
    { value: 'stressed', label: 'Stressed', emoji: '😰', color: 'bg-orange-600' },
    { value: 'struggling', label: 'Struggling', emoji: '😔', color: 'bg-red-600' },
  ];

  const handleSubjectToggle = (subject: string) => {
    setSubjectsStudied(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const addAchievement = () => {
    if (achievementInput.trim()) {
      setAchievements(prev => [...prev, achievementInput.trim()]);
      setAchievementInput('');
    }
  };

  const removeAchievement = (index: number) => {
    setAchievements(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    const payload: Omit<DailyCheckInType, 'id'> = {
      studentId: profile.id,
      date: new Date().toISOString().split('T')[0],
      mood,
      moodNotes: moodNotes.trim() || undefined,
      stressLevel,
      sleepHours,
      energyLevel,
      studyHours,
      subjectsStudied,
      homeworkCompleted,
      classesAttended,
      academicChallengesFaced: academicChallengesFaced.trim() || undefined,
      physicalActivityMinutes,
      sportsParticipation: sportsParticipation.trim() || undefined,
      socialInteractions,
      emotionalState: emotionalState.trim(),
      achievements: achievements.length > 0 ? achievements : undefined,
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Step 1 · Mood Pulse</p>
              <h2 className="text-2xl font-semibold text-white mt-1">How are you feeling today? 🌟</h2>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-white/80 mb-3">Your mood</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMood(option.value)}
                    className={`p-4 rounded-2xl border transition-all text-left ${
                      mood === option.value
                        ? 'bg-gradient-to-br from-[#22d3ee] via-[#38bdf8] to-[#a855f7] border-transparent text-white shadow-[0_12px_35px_rgba(56,189,248,0.35)]'
                        : 'bg-white/5 border-white/10 text-white/80 hover:border-white/40'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
              <label className="block text-sm font-medium text-white/80">
                Any notes about your mood? (optional)
              </label>
              <textarea
                value={moodNotes}
                onChange={(e) => setMoodNotes(e.target.value)}
                placeholder="What's influencing your mood today?"
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
              />
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Stress Level: {stressLevel}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                />
                <div className="flex justify-between text-xs text-white/50 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Hours of sleep last night
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Energy Level: {energyLevel}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Step 2 · Learning Lab</p>
              <h2 className="text-2xl font-semibold text-white">Your Academic Day 📚</h2>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Hours studied today
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Classes attended
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={classesAttended}
                  onChange={(e) => setClassesAttended(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Physical activity minutes today
              </label>
              <input
                type="number"
                min="0"
                max="1440"
                value={physicalActivityMinutes}
                onChange={(e) => setPhysicalActivityMinutes(Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <p className="text-xs text-white/60 mt-1">Recommended: at least 30 minutes</p>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-white/80 mb-3">
                Which subjects did you focus on today?
              </label>
              <p className="text-xs text-white/60">Tap all that apply so your mentor can tailor study nudges.</p>
              <div className="flex flex-wrap gap-3 mt-4">
                {subjectOptions.map((subject) => {
                  const isActive = subjectsStudied.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => handleSubjectToggle(subject)}
                      className={`px-4 py-2 rounded-2xl border text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#818cf8] to-[#a855f7] text-white border-transparent shadow-[0_12px_30px_rgba(129,140,248,0.35)]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                      }`}
                    >
                      {subject}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-white/80 mb-3">
                Did you complete your homework?
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setHomeworkCompleted(true)}
                  className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                    homeworkCompleted
                      ? 'bg-gradient-to-r from-[#34d399] to-[#10b981] text-white shadow-[0_12px_35px_rgba(16,185,129,0.35)]'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:text-white'
                  }`}
                >
                  Yes ✓
                </button>
                <button
                  type="button"
                  onClick={() => setHomeworkCompleted(false)}
                  className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                    !homeworkCompleted
                      ? 'bg-gradient-to-r from-[#facc15] to-[#f97316] text-white shadow-[0_12px_35px_rgba(249,115,22,0.35)]'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:text-white'
                  }`}
                >
                  No ✗
                </button>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Any academic challenges today? (optional)
              </label>
              <textarea
                value={academicChallengesFaced}
                onChange={(e) => setAcademicChallengesFaced(e.target.value)}
                placeholder="e.g., Difficult math problem, time management issue..."
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Step 3 · Body & Crew</p>
              <h2 className="text-2xl font-semibold text-white">Physical & Social Activity 🏃</h2>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Physical activity minutes today
              </label>
              <input
                type="number"
                min="0"
                max="1440"
                value={physicalActivityMinutes}
                onChange={(e) => setPhysicalActivityMinutes(Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <p className="text-xs text-white/60 mt-1">Recommended: at least 30 minutes</p>
            </div>

            {profile.sportsActivities.length > 0 && (
              <div className="glass-card rounded-2xl p-4 border border-white/10">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Any sports participation today? (optional)
                </label>
                <input
                  type="text"
                  value={sportsParticipation}
                  onChange={(e) => setSportsParticipation(e.target.value)}
                  placeholder="e.g., Basketball practice, Swimming"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            )}

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Social interactions today
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['many', 'some', 'few', 'none'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSocialInteractions(level)}
                    className={`py-3 rounded-2xl font-semibold capitalize transition-all ${
                      socialInteractions === level
                        ? 'bg-gradient-to-r from-[#f472b6] to-[#c084fc] text-white shadow-[0_12px_35px_rgba(192,132,252,0.35)]'
                        : 'bg-white/5 text-white/70 border border-white/10 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Reflection & Celebrations 🌟</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="glass-card rounded-2xl p-4 border border-white/10">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Spotlight one win today
                </label>
                <textarea
                  value={win}
                  onChange={(e) => setWin(e.target.value)}
                  placeholder="e.g., Completed my math revision, stayed calm before the quiz..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
                <p className="text-xs text-white/60 mt-2">Stored as your daily win so the mentor can celebrate with you.</p>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-white/10">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Any blockers or worries?
                </label>
                <textarea
                  value={blocker}
                  onChange={(e) => setBlocker(e.target.value)}
                  placeholder="Share anything that slowed you down or needs attention."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                />
                <p className="text-xs text-white/60 mt-2">Mentioning blockers helps your mentor prioritize support.</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-white/80 mb-2">
                How would you describe your emotional state today?
              </label>
              <textarea
                value={emotionalState}
                onChange={(e) => setEmotionalState(e.target.value)}
                placeholder="Confident, anxious, motivated, overwhelmed, happy..."
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
              />
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Any achievements or shoutouts? (optional)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                  placeholder="e.g., Solved a tough problem, helped a friend"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  type="button"
                  onClick={addAchievement}
                  className="px-4 py-3 rounded-xl premium-button text-sm font-semibold"
                >
                  Add
                </button>
              </div>
              {achievements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {achievements.map((achievement, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-sm flex items-center gap-2 premium-chip"
                    >
                      ⭐ {achievement}
                      <button onClick={() => removeAchievement(idx)} className="hover:text-rose-300">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-highlight rounded-2xl p-4 border border-white/10">
              <p className="text-sm text-white">
                💡 Great job checking in today! Your mentor now has the right context to cheer you on and step in when needed.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#01030a]/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 z-50">
      <div className="relative w-full max-w-3xl glass-panel rounded-[32px] border border-white/10 shadow-[0_45px_120px_rgba(1,5,18,0.85)] max-h-[90vh] overflow-y-auto">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 -right-8 w-56 h-56 bg-[#22d3ee]/20 blur-[120px]"></div>
          <div className="absolute bottom-0 -left-10 w-64 h-64 bg-[#a855f7]/20 blur-[140px]"></div>
        </div>

        <div className="relative sticky top-0 backdrop-blur-2xl bg-[#050b20]/80 border-b border-white/10 p-6 flex justify-between items-center rounded-t-[32px]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Daily Ritual</p>
            <h1 className="text-2xl font-bold text-white mt-1">Check-In</h1>
            <p className="text-sm text-white/60">Step {step} of {totalSteps}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors rounded-full border border-white/10 p-2"
            aria-label="Close check-in"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative p-6">
          <div className="flex gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  idx + 1 === step
                    ? 'bg-gradient-to-r from-[#22d3ee] via-[#34d399] to-[#f97316] shadow-[0_0_18px_rgba(14,165,233,0.6)]'
                    : idx + 1 < step
                    ? 'bg-white/50'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {renderStep()}

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 border border-white/15 rounded-2xl text-sm font-medium text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#22d3ee] via-[#0ea5e9] to-[#8b5cf6] hover:translate-y-[-1px] transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : step === totalSteps ? 'Complete Check-In' : 'Next'}
            </button>
          </div>

          {submitError && <p className="text-sm text-red-300 mt-4">{submitError}</p>}
        </div>
      </div>
    </div>
  );
};

export default DailyCheckIn;

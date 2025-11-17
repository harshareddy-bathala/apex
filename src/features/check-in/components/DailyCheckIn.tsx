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

  // Step 4: Achievements & Reflection
  const [emotionalState, setEmotionalState] = useState('');
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementInput, setAchievementInput] = useState('');
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
            <h2 className="text-2xl font-semibold text-sky-300">How are you feeling today? 🌟</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Your mood</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMood(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      mood === option.value
                        ? `${option.color} border-white`
                        : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-sm font-medium text-white">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Any notes about your mood? (optional)
              </label>
              <textarea
                value={moodNotes}
                onChange={(e) => setMoodNotes(e.target.value)}
                placeholder="What's influencing your mood today?"
                rows={2}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stress Level: {stressLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={(e) => setStressLevel(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hours of sleep last night
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Energy Level: {energyLevel}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-sky-300">Your Academic Day 📚</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hours studied today
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Classes attended
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={classesAttended}
                  onChange={(e) => setClassesAttended(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Which subjects did you study?
              </label>
              <div className="flex flex-wrap gap-2">
                {profile.subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => handleSubjectToggle(subject)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      subjectsStudied.includes(subject)
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Did you complete your homework?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setHomeworkCompleted(true)}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    homeworkCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Yes ✓
                </button>
                <button
                  type="button"
                  onClick={() => setHomeworkCompleted(false)}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    !homeworkCompleted
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  No ✗
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Any academic challenges today? (optional)
              </label>
              <textarea
                value={academicChallengesFaced}
                onChange={(e) => setAcademicChallengesFaced(e.target.value)}
                placeholder="e.g., Difficult math problem, time management issue..."
                rows={2}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-sky-300">Physical & Social Activity 🏃</h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Physical activity minutes today
              </label>
              <input
                type="number"
                min="0"
                max="1440"
                value={physicalActivityMinutes}
                onChange={(e) => setPhysicalActivityMinutes(Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-xs text-slate-500 mt-1">Recommended: at least 30 minutes</p>
            </div>

            {profile.sportsActivities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Any sports participation today? (optional)
                </label>
                <input
                  type="text"
                  value={sportsParticipation}
                  onChange={(e) => setSportsParticipation(e.target.value)}
                  placeholder="e.g., Basketball practice, Swimming"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Social interactions today
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['many', 'some', 'few', 'none'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSocialInteractions(level)}
                    className={`py-3 rounded-lg font-medium capitalize transition-all ${
                      socialInteractions === level
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
            <h2 className="text-2xl font-semibold text-sky-300">Reflection & Achievements 🌟</h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                How would you describe your emotional state today?
              </label>
              <textarea
                value={emotionalState}
                onChange={(e) => setEmotionalState(e.target.value)}
                placeholder="Confident, anxious, motivated, overwhelmed, happy..."
                rows={2}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Any achievements or wins today? (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                  placeholder="e.g., Solved a tough problem, helped a friend"
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={addAchievement}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-medium"
                >
                  Add
                </button>
              </div>
              {achievements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {achievements.map((achievement, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-yellow-600/30 text-yellow-200 rounded-full text-sm flex items-center gap-2"
                    >
                      ⭐ {achievement}
                      <button onClick={() => removeAchievement(idx)} className="hover:text-red-400">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-sky-900/30 border border-sky-700 rounded-lg p-4">
              <p className="text-sm text-sky-300">
                💡 Great job checking in today! Your mentor will use this information to provide better guidance.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-sky-400">Daily Check-In</h1>
            <p className="text-sm text-slate-400">Step {step} of {totalSteps}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  idx + 1 === step ? 'bg-sky-400' : idx + 1 < step ? 'bg-sky-600' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {renderStep()}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 border border-slate-600 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
              >
                Back
              </button>
            )}
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : step === totalSteps ? 'Complete Check-In' : 'Next'}
              </button>
          </div>

            {submitError && <p className="text-sm text-red-400 mt-4">{submitError}</p>}
        </div>
      </div>
    </div>
  );
};

export default DailyCheckIn;

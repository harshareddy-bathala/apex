import React, { useState } from 'react';

interface DailyCheckInProps {
  profile: {
    id: string;
    name?: string;
  };
  idToken: string;
  onComplete: (checkIn: any) => void;
  onClose: () => void;
}

const DailyCheckIn: React.FC<DailyCheckInProps> = ({
  profile,
  onComplete,
  onClose
}) => {
  const [formData, setFormData] = useState({
    mood: 5,
    sleepHours: 7,
    studyHours: 0,
    classesAttended: 0,
    win: '',
    mainAchievement: '',
    blocker: '',
    mainMistake: '',
    criticalObservation: '',
    planForTomorrow: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const checkInData = {
        id: `checkin-${Date.now()}`,
        studentId: profile.id,
        date: new Date().toISOString().split('T')[0],
        mood: getMoodLabel(formData.mood),
        stressLevel: formData.mood <= 3 ? 8 : formData.mood <= 5 ? 5 : formData.mood <= 7 ? 3 : 1,
        sleepHours: formData.sleepHours,
        energyLevel: formData.mood <= 3 ? 3 : formData.mood <= 5 ? 5 : formData.mood <= 7 ? 7 : 9,
        studyHours: formData.studyHours,
        subjectsStudied: [],
        homeworkCompleted: false,
        classesAttended: formData.classesAttended,
        physicalActivityMinutes: 0,
        socialInteractions: 'some' as const,
        emotionalState: '',
        achievements: formData.mainAchievement ? [formData.mainAchievement] : [],
        win: formData.win.trim() || undefined,
        blocker: formData.blocker.trim() || undefined,
        mainMistake: formData.mainMistake.trim() || undefined,
        criticalObservation: formData.criticalObservation.trim() || undefined,
        mainAchievement: formData.mainAchievement.trim() || undefined,
        planForTomorrow: formData.planForTomorrow.trim() || undefined,
        timestamp: new Date().toISOString(),
      };

      onComplete(checkInData);
    } catch (err) {
      setSubmitError('Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Daily Check-In</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-6">
            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How are you feeling today? {getMoodEmoji(formData.mood)} {formData.mood}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.mood}
                onChange={(e) => handleInputChange('mood', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Struggling</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Sleep Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours slept last night
              </label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.sleepHours}
                onChange={(e) => handleInputChange('sleepHours', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="7.5"
              />
            </div>

            {/* Study Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours studied today
              </label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.studyHours}
                onChange={(e) => handleInputChange('studyHours', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2.5"
              />
            </div>

            {/* Classes Attended */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classes attended today
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.classesAttended}
                onChange={(e) => handleInputChange('classesAttended', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
              />
            </div>

            {/* Today's Win */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Today's top win
              </label>
              <textarea
                value={formData.win}
                onChange={(e) => handleInputChange('win', e.target.value)}
                placeholder="What went well today?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Main Achievement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main achievement today
              </label>
              <textarea
                value={formData.mainAchievement}
                onChange={(e) => handleInputChange('mainAchievement', e.target.value)}
                placeholder="What was your biggest accomplishment?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Blockers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any blockers?
              </label>
              <textarea
                value={formData.blocker}
                onChange={(e) => handleInputChange('blocker', e.target.value)}
                placeholder="What's slowing you down?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Main Mistake */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main mistake today
              </label>
              <textarea
                value={formData.mainMistake}
                onChange={(e) => handleInputChange('mainMistake', e.target.value)}
                placeholder="What was your biggest mistake or area for improvement?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Critical Observation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Critical observation
              </label>
              <textarea
                value={formData.criticalObservation}
                onChange={(e) => handleInputChange('criticalObservation', e.target.value)}
                placeholder="What important insight or pattern did you notice?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Plan for Tomorrow */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan for tomorrow
              </label>
              <textarea
                value={formData.planForTomorrow}
                onChange={(e) => handleInputChange('planForTomorrow', e.target.value)}
                placeholder="What do you plan to focus on and improve?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Complete Check-In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckIn;

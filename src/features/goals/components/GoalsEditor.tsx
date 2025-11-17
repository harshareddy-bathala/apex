import React, { useEffect, useState } from 'react';
import { getGoals, updateGoals, type StudentGoalsPayload } from '@/api/client';
import { StudentProfile } from '@/types';

interface GoalsEditorProps {
  profile: StudentProfile;
  idToken: string;
  onUpdate: (updates: Partial<StudentProfile>) => void;
  onClose: () => void;
}

export default function GoalsEditor({ profile, idToken, onUpdate, onClose }: GoalsEditorProps) {
  const [currentGoals, setCurrentGoals] = useState<string[]>(profile.currentGoals || []);
  const [shortTermGoals, setShortTermGoals] = useState<string[]>(profile.shortTermGoals || []);
  const [longTermGoals, setLongTermGoals] = useState<string[]>(profile.longTermGoals || []);
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [careerAspirations, setCareerAspirations] = useState(profile.careerAspirations || '');
  const [dreamJob, setDreamJob] = useState(profile.dreamJob || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'short' | 'long' | 'career' | 'interests'>('current');

  const tabConfig: Array<{ id: 'current' | 'short' | 'long' | 'career' | 'interests'; label: string; helper: string }> = [
    { id: 'current', label: '📌 Current Goals', helper: 'Daily or weekly focus' },
    { id: 'short', label: '⏳ Short-term', helper: '3-6 month plans' },
    { id: 'long', label: '🎯 Long-term', helper: '1+ year horizon' },
    { id: 'career', label: '💼 Career', helper: 'Future pathways' },
    { id: 'interests', label: '❤️ Interests', helper: 'Clubs & hobbies' },
  ];

  const inputBase = 'w-full rounded-2xl border border-white/10 bg-panel-elevated/80 text-white placeholder:text-muted-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-discrete-highlight transition-colors';

  const applyGoals = (source?: StudentGoalsPayload | Partial<StudentProfile> | null) => {
    setCurrentGoals(source?.currentGoals ?? []);
    setShortTermGoals(source?.shortTermGoals ?? []);
    setLongTermGoals(source?.longTermGoals ?? []);
    setInterests(source?.interests ?? []);
    setCareerAspirations(source?.careerAspirations ?? '');
    setDreamJob(source?.dreamJob ?? '');
  };

  useEffect(() => {
    let isMounted = true;
    const fetchGoals = async () => {
      setLoading(true);
      setError(null);
      try {
        const { goals } = await getGoals(idToken);
        if (!isMounted) return;
        if (goals) {
          applyGoals(goals);
        } else {
          applyGoals(profile);
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Unable to load goals. Showing saved profile data instead.';
        setError(message);
        applyGoals(profile);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchGoals();
    return () => {
      isMounted = false;
    };
  }, [idToken, profile]);

  const addGoal = (type: 'current' | 'short' | 'long') => {
    if (!newGoal.trim()) return;
    
    if (type === 'current') {
      setCurrentGoals([...currentGoals, newGoal.trim()]);
    } else if (type === 'short') {
      setShortTermGoals([...shortTermGoals, newGoal.trim()]);
    } else if (type === 'long') {
      setLongTermGoals([...longTermGoals, newGoal.trim()]);
    }
    setNewGoal('');
  };

  const removeGoal = (type: 'current' | 'short' | 'long', index: number) => {
    if (type === 'current') {
      setCurrentGoals(currentGoals.filter((_, i) => i !== index));
    } else if (type === 'short') {
      setShortTermGoals(shortTermGoals.filter((_, i) => i !== index));
    } else if (type === 'long') {
      setLongTermGoals(longTermGoals.filter((_, i) => i !== index));
    }
  };

  const addInterest = () => {
    if (!newGoal.trim()) return;
    setInterests([...interests, newGoal.trim()]);
    setNewGoal('');
  };

  const removeInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const payload: StudentGoalsPayload = {
      currentGoals,
      shortTermGoals,
      longTermGoals,
      interests,
      careerAspirations,
      dreamJob,
    };

    setSaving(true);
    setError(null);
    try {
      await updateGoals(idToken, payload);
      onUpdate({
        ...payload,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save your goals. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col rounded-3xl border border-white/10 bg-panel text-white shadow-card">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-from to-primary-to p-6 text-white">
          <p className="text-micro uppercase tracking-[0.2em] text-white/70">Task 06</p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">Edit Your Goals & Aspirations</h2>
          <p className="text-white/80">Fine tune what you are working toward—short sprints to dream careers.</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-3 overflow-x-auto border-b border-white/5 bg-panel-elevated/40 px-6 py-3">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-max rounded-2xl px-4 py-2 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-discrete-highlight ${
                activeTab === tab.id
                  ? 'bg-white text-bg-dark shadow-card'
                  : 'bg-transparent text-muted-ink hover:text-white'
              }`}
            >
              <span className="block font-medium">{tab.label}</span>
              <span className="text-body-xs text-muted-ink/80">{tab.helper}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-panel/60 backdrop-blur">
          {loading && <p className="text-center text-muted-ink py-4">Loading your goals...</p>}
          {error && !loading && <p className="text-red-400 text-sm mb-4">{error}</p>}
          {/* Current Goals */}
          {activeTab === 'current' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Current Focus Areas</h3>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGoal('current')}
                  placeholder="Add a current goal..."
                  className={`${inputBase}`}
                />
                <button
                  onClick={() => addGoal('current')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-from to-primary-to font-medium shadow-card hover:opacity-90"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {currentGoals.map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-panel-elevated/50">
                    <span className="flex-1 text-body text-white">{goal}</span>
                    <button
                      onClick={() => removeGoal('current', idx)}
                      className="text-muted-ink hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {currentGoals.length === 0 && (
                  <p className="text-muted-ink text-center py-8">No current goals set</p>
                )}
              </div>
            </div>
          )}

          {/* Short-term Goals */}
          {activeTab === 'short' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Short-term Goals (3-6 months)</h3>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGoal('short')}
                  placeholder="Add a short-term goal..."
                  className={inputBase}
                />
                <button
                  onClick={() => addGoal('short')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-from to-primary-to font-medium shadow-card hover:opacity-90"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {shortTermGoals.map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-panel-elevated/50">
                    <span className="flex-1 text-body text-white">{goal}</span>
                    <button
                      onClick={() => removeGoal('short', idx)}
                      className="text-muted-ink hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {shortTermGoals.length === 0 && (
                  <p className="text-muted-ink text-center py-8">No short-term goals set</p>
                )}
              </div>
            </div>
          )}

          {/* Long-term Goals */}
          {activeTab === 'long' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Long-term Goals (1+ years)</h3>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGoal('long')}
                  placeholder="Add a long-term goal..."
                  className={inputBase}
                />
                <button
                  onClick={() => addGoal('long')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-from to-primary-to font-medium shadow-card hover:opacity-90"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {longTermGoals.map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-panel-elevated/50">
                    <span className="flex-1 text-body text-white">{goal}</span>
                    <button
                      onClick={() => removeGoal('long', idx)}
                      className="text-muted-ink hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {longTermGoals.length === 0 && (
                  <p className="text-muted-ink text-center py-8">No long-term goals set</p>
                )}
              </div>
            </div>
          )}

          {/* Career Aspirations */}
          {activeTab === 'career' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-ink mb-2">
                  Career Aspirations
                </label>
                <textarea
                  value={careerAspirations}
                  onChange={(e) => setCareerAspirations(e.target.value)}
                  rows={3}
                  className={`${inputBase} min-h-[120px]`}
                  placeholder="What career path interests you?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-ink mb-2">
                  Dream Job
                </label>
                <input
                  type="text"
                  value={dreamJob}
                  onChange={(e) => setDreamJob(e.target.value)}
                  className={inputBase}
                  placeholder="What's your dream job?"
                />
              </div>
            </div>
          )}

          {/* Interests */}
          {activeTab === 'interests' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Your Interests & Hobbies</h3>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  placeholder="Add an interest..."
                  className={inputBase}
                />
                <button
                  onClick={addInterest}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-from to-primary-to font-medium shadow-card hover:opacity-90"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-panel-elevated/60 text-white"
                  >
                    {interest}
                    <button
                      onClick={() => removeInterest(idx)}
                      className="text-muted-ink hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {interests.length === 0 && (
                  <p className="text-muted-ink text-center py-8 w-full">No interests added yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6 bg-panel-elevated/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-white/20 text-white/80 hover:bg-white/10 transition-colors disabled:opacity-60"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-from to-primary-to font-semibold shadow-card hover:opacity-90 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

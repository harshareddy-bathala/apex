import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, FileText, RefreshCw, TimerReset } from 'lucide-react';

import HomeworkList from '@/features/homework/components/HomeworkList';
import TestsList from '@/features/tests/components/TestsList';
import { useAuth } from '@/common/hooks/useAuth';
import { useProfile } from '@/common/context/ProfileContext';
import { getHomework, getTests, updateHomework } from '@/api/client';
import type { Homework, Test } from '@/types';

const AssignmentsPage: React.FC = () => {
  const { idToken } = useAuth();
  const { refetchProfile } = useProfile();
  const [activeTab, setActiveTab] = useState<'homework' | 'tests'>('homework');
  const [homework, setHomework] = useState<Homework[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    if (!idToken) return;
    setLoading(true);
    setError(null);

    try {
      // Load homework and tests in parallel
      const [homeworkResult, testsResult] = await Promise.all([
        getHomework(idToken),
        getTests(idToken)
      ]);

      setHomework(homeworkResult.homework);
      setTests(testsResult.tests);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError('Unable to load assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const handleHomeworkStatusChange = useCallback(async (homeworkId: string, status: Homework['status']) => {
    if (!idToken) return;

    try {
      await updateHomework(idToken, homeworkId, { status });

      // Update local state
      setHomework(prev =>
        prev.map(hw =>
          hw.id === homeworkId ? { ...hw, status } : hw
        )
      );

      // Refresh profile data to reflect changes
      void refetchProfile();
    } catch (err) {
      console.error('Failed to update homework status:', err);
      throw err; // Let HomeworkList handle the error
    }
  }, [idToken, refetchProfile]);

  const tabs = [
    {
      id: 'homework' as const,
      label: 'Homework',
      icon: BookOpen,
      count: homework.length,
      description: 'Assignments and tasks from teachers'
    },
    {
      id: 'tests' as const,
      label: 'Tests',
      icon: FileText,
      count: tests.length,
      description: 'Exams and assessments schedule'
    }
  ];

  if (!idToken) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sign in to view assignments</p>
          <p className="text-[var(--text-secondary)]">Connect with your account to access homework and tests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Academic Hub</p>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Assignments</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Stay on top of homework, tests, and assessments updated by your teachers
          </p>
        </div>
        <button
          onClick={() => void loadAssignments()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors disabled:opacity-50"
        >
          {loading ? <TimerReset className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-[var(--border-subtle)]">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">Loading assignments...</p>
              <p className="text-[var(--text-secondary)]">Fetching the latest homework and tests</p>
            </div>
          </div>
        ) : activeTab === 'homework' ? (
          <HomeworkList
            homework={homework}
            onStatusChange={handleHomeworkStatusChange}
            onRefresh={loadAssignments}
            loadingExternal={loading}
            errorMessage={error}
          />
        ) : (
          <TestsList idToken={idToken!} />
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-[var(--border-subtle)] pt-6 mt-12">
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Assignments are automatically synced from your teachers •
            <button
              onClick={() => void loadAssignments()}
              className="text-[var(--accent-primary)] hover:underline ml-1"
              disabled={loading}
            >
              Refresh to get latest updates
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import Dashboard from '@/features/dashboard/components/Dashboard';
import Chat from '@/features/chat/components/Chat';
import DailyCheckIn from '@/features/check-in/components/DailyCheckIn';
import GoalsEditor from '@/features/goals/components/GoalsEditor';
import EditProfilePage from '@/features/profile/EditProfilePage';
import ProfilePage from '@/features/profile/ProfilePage';
import SettingsPage from '@/features/profile/SettingsPage';
import TeacherAlerts from '@/features/reports/components/TeacherAlerts';
import AppShell, { type AppShellView } from '@/features/app-shell/AppShell';
import CommunityFeed from '@/features/community/components/CommunityFeed';
import ResourceGrid from '@/features/resources/components/ResourceGrid';
import HabitDashboard from '@/features/habits/components/HabitDashboard';
import FullScreenLoader from '@/router/components/FullScreenLoader';
import { useAuth } from '@/common/hooks/useAuth';
import { useProfile } from '@/common/context/ProfileContext';
import { subscribeToAssignmentBroadcast } from '@/common/utils/liveUpdates';
import { auth } from '@/firebase';
import { checkinHabit, createHabit, getCommunityFeed, getHabits, getHomework, getTests, updateHomework } from '@/api/client';
import type { StudentProfileRecord } from '@/api/client';
import type {
  ActivityLog,
  CommunityPost,
  DailyCheckIn as DailyCheckInType,
  Habit,
  Homework,
  StudentProfile,
  TeacherAlert,
  Test,
} from '@/types';

const ProtectedApp: React.FC = () => {
  const { user, idToken } = useAuth();
  const { profile: profileRecord, refetchProfile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileState, setProfileState] = useState<StudentProfile | null>(() =>
    profileRecord ? normalizeProfile(profileRecord) : null,
  );
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckInType[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [teacherAlerts, setTeacherAlerts] = useState<TeacherAlert[]>([]);
  const [communityDigest, setCommunityDigest] = useState<CommunityPost[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [homeworkError, setHomeworkError] = useState<string | null>(null);

  useEffect(() => {
    if (profileRecord) {
      setProfileState(normalizeProfile(profileRecord));
    }
  }, [profileRecord]);

  const loadTests = useCallback(async () => {
    if (!idToken) {
      return;
    }

    try {
      const { tests: serverTests } = await getTests(idToken);
      setTests(serverTests);
    } catch {
      setTests([]);
    }
  }, [idToken]);

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  const loadHomework = useCallback(async () => {
    if (!idToken) {
      return;
    }

    try {
      const { homework: assignments } = await getHomework(idToken);
      setHomework(assignments);
      setHomeworkError(null);
    } catch {
      setHomework([]);
      setHomeworkError('Unable to load homework.');
    }
  }, [idToken]);

  useEffect(() => {
    void loadHomework();
  }, [loadHomework]);

  const loadHabits = useCallback(async () => {
    if (!idToken) {
      return;
    }
    try {
      const { habits: rows } = await getHabits(idToken);
      setHabits(rows);
    } catch {
      setHabits([]);
    }
  }, [idToken]);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  useEffect(() => {
    const unsubscribe = subscribeToAssignmentBroadcast((event) => {
      if (event.type === 'assignment-created') {
        if ((event.assignment.type ?? 'homework') === 'test') {
          void loadTests();
        } else {
          void loadHomework();
        }
      }
      if (event.type === 'assignment-deleted') {
        void loadHomework();
        void loadTests();
      }
    });
    return unsubscribe;
  }, [loadHomework, loadTests]);

  const loadCommunityDigest = useCallback(async () => {
    if (!idToken) {
      return;
    }
    try {
      const { posts } = await getCommunityFeed(idToken, { limit: 5 });
      setCommunityDigest(posts);
    } catch {
      setCommunityDigest([]);
    }
  }, [idToken]);

  useEffect(() => {
    void loadCommunityDigest();
  }, [loadCommunityDigest]);

  const handleHomeworkStatusChange = useCallback(
    async (homeworkId: string, status: Homework['status']) => {
      if (!idToken) {
        return;
      }

      setHomeworkError(null);
      setHomework((prev) =>
        prev.map((hw) =>
          hw.id === homeworkId
            ? {
              ...hw,
              status,
              completedAt:
                status === 'completed' || status === 'submitted'
                  ? new Date().toISOString()
                  : undefined,
            }
            : hw,
        ),
      );

      try {
        const updated = await updateHomework(idToken, homeworkId, { status });
        setHomework((prev) => prev.map((hw) => (hw.id === homeworkId ? { ...hw, ...updated } : hw)));
      } catch {
        setHomeworkError('Unable to update homework status. Please retry.');
        await loadHomework();
      }
    },
    [idToken, loadHomework],
  );

  const handleHabitToggle = useCallback(
    async (habitId: string, completed: boolean) => {
      if (!idToken) {
        return;
      }
      setHabits((prev) =>
        prev.map((habit) => (habit.id === habitId ? { ...habit, completedToday: completed } : habit)),
      );
      try {
        await checkinHabit(idToken, { habitId, completed });
      } catch {
        await loadHabits();
      }
    },
    [idToken, loadHabits],
  );

  const handleHabitCreate = useCallback(
    async (name: string, timeOfDay: Habit['timeOfDay']) => {
      if (!idToken || !name.trim()) {
        return;
      }
      await createHabit(idToken, { name: name.trim(), timeOfDay });
      await loadHabits();
    },
    [idToken, loadHabits],
  );

  const addActivity = (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleCheckInComplete = (checkIn: DailyCheckInType) => {
    setCheckIns((prev) => [checkIn, ...prev]);
    setShowCheckIn(false);
    addActivity({
      studentId: checkIn.studentId,
      type: 'mental-health',
      category: 'check-in',
      description: `Completed daily check-in: ${checkIn.mood} mood, ${checkIn.studyHours}h study`,
      sentiment:
        checkIn.mood === 'excellent' || checkIn.mood === 'good'
          ? 'positive'
          : checkIn.mood === 'okay'
            ? 'neutral'
            : 'negative',
    });
  };

  const handleDismissAlert = (alertId: string) => {
    setTeacherAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const handleTriggerAlert = (alert: Omit<TeacherAlert, 'id' | 'createdAt'>) => {
    if (!profileState) {
      return;
    }

    const newAlert: TeacherAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
    };
    setTeacherAlerts((prev) => [newAlert, ...prev]);
    addActivity({
      studentId: profileState.id,
      type: 'challenge',
      category: 'teacher-alert',
      description: `AI triggered teacher alert: ${alert.title}`,
      sentiment: 'negative',
    });
  };

  const handleProfileUpdate = (updates: Partial<StudentProfile>) => {
    setProfileState((prev) => (prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev));
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }
    await signOut(auth);
  };

  if (!idToken || !profileRecord || !profileState) {
    return <FullScreenLoader message="Preparing your dashboard..." />;
  }

  const todayCheckIn = checkIns.find((c) => c.date === new Date().toISOString().split('T')[0]);

  const currentView = useMemo<AppShellView>(() => {
    const path = location.pathname || '';
    if (path.startsWith('/community')) {
      return 'community';
    }
    if (path.startsWith('/resources')) {
      return 'resources';
    }
    if (path.startsWith('/chat')) {
      return 'chat';
    }
    if (path.startsWith('/profile')) {
      return 'profile';
    }
    if (path.startsWith('/settings')) {
      return 'settings';
    }
    if (path.startsWith('/habits')) {
      return 'habits';
    }
    return 'dashboard';
  }, [location.pathname]);

  const handleNavigate = useCallback(
    (view: AppShellView) => {
      const targetPath = view === 'dashboard' ? '/dashboard' : `/${view}`;
      if (location.pathname === targetPath) {
        return;
      }
      navigate(targetPath);
    },
    [location.pathname, navigate],
  );

  const quickActions = useMemo(
    () => [
      {
        label: 'Daily Check-in',
        icon: CalendarCheck2,
        onClick: () => setShowCheckIn(true),
      },
    ],
    [setShowCheckIn],
  );

  return (
    <>
      <AppShell
        activeView={currentView}
        onNavigate={handleNavigate}
        userName={profileState.name}
        userRole={profileRecord.role === 'teacher' ? 'teacher' : 'student'}
        onLogout={handleLogout}
        quickActions={quickActions}
        subHeader={
          homeworkError ? (
            <p className="text-sm text-[var(--warning-foreground)]">
              {homeworkError}{' '}
              <button type="button" onClick={() => void loadHomework()} className="underline">
                Retry
              </button>
            </p>
          ) : null
        }
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <>
                  {teacherAlerts.length > 0 && (
                    <div className="mb-6">
                      <TeacherAlerts alerts={teacherAlerts} onDismiss={handleDismissAlert} />
                    </div>
                  )}
                  <Dashboard
                    profile={profileState}
                    checkIns={checkIns}
                    activities={activities}
                    homework={homework}
                    tests={tests}
                    communityPosts={communityDigest}
                    onHomeworkStatusChange={handleHomeworkStatusChange}
                    habits={habits}
                    onHabitToggle={handleHabitToggle}
                    onHabitCreate={handleHabitCreate}
                  />
                </>
              }
            />
            <Route
              path="/habits"
              element={
                <HabitDashboard
                  habits={habits}
                  onHabitToggle={handleHabitToggle}
                  onHabitCreate={handleHabitCreate}
                />
              }
            />
            <Route path="/community" element={<CommunityFeed />} />
            <Route path="/resources" element={<ResourceGrid />} />
            <Route
              path="/chat"
              element={
                <Chat
                  profile={profileState}
                  checkIns={checkIns}
                  activities={activities}
                  onAddActivity={addActivity}
                  onTriggerAlert={handleTriggerAlert}
                  idToken={idToken}
                />
              }
            />
            <Route
              path="/profile"
              element={<ProfilePage profile={profileState} onEditProfile={() => setShowEditProfile(true)} onEditGoals={() => setShowGoalsEditor(true)} />}
            />
            <Route
              path="/settings"
              element={<SettingsPage profile={profileState} onEditProfile={() => setShowEditProfile(true)} onEditGoals={() => setShowGoalsEditor(true)} onLogout={handleLogout} />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AppShell>

      {showCheckIn && (
        <DailyCheckIn
          profile={profileState}
          idToken={idToken}
          onComplete={handleCheckInComplete}
          onClose={() => setShowCheckIn(false)}
        />
      )}

      {showGoalsEditor && (
        <GoalsEditor
          profile={profileState}
          idToken={idToken}
          onUpdate={handleProfileUpdate}
          onClose={() => setShowGoalsEditor(false)}
        />
      )}

      {showEditProfile && (
        <EditProfilePage
          profile={profileState}
          idToken={idToken}
          onClose={() => setShowEditProfile(false)}
          onProfileUpdated={(updates) => {
            handleProfileUpdate(updates);
            void refetchProfile();
          }}
        />
      )}

      {!todayCheckIn && checkIns.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)]/90 px-5 py-4 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur">
          <p className="font-semibold text-[var(--text-primary)]">Daily check-in pending</p>
          <p className="mt-1 text-[var(--text-secondary)]">Log today&apos;s mood to keep the AI mentor calibrated.</p>
          <button
            type="button"
            onClick={() => setShowCheckIn(true)}
            className="mt-3 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Launch Check-in
          </button>
        </div>
      )}
    </>
  );
};

export default ProtectedApp;

function normalizeProfile(record: StudentProfileRecord): StudentProfile {
  const now = new Date().toISOString();
  return {
    id: record.id,
    name: record.name ?? 'Student',
    dateOfBirth: record.dateOfBirth,
    age: record.age ?? 15,
    grade: record.grade ?? 'Grade 10',
    gender: record.gender,
    bio: record.bio ?? '',
    followers: typeof record.followers === 'number' ? record.followers : 0,
    notesShared: typeof record.notesShared === 'number' ? record.notesShared : 0,
    subjects: record.subjects ?? [],
    academicGoals: record.academicGoals ?? 'Grow every day',
    learningStyle: record.learningStyle,
    careerAspirations: record.careerAspirations ?? 'Explore possibilities',
    dreamJob: record.dreamJob ?? 'Future leader',
    roleModels: record.roleModels,
    interests: record.interests ?? [],
    hobbies: record.hobbies ?? [],
    currentGoals: record.currentGoals,
    shortTermGoals: record.shortTermGoals,
    longTermGoals: record.longTermGoals,
    sportsActivities: record.sportsActivities ?? [],
    fitnessGoals: record.fitnessGoals,
    academicChallenges: record.academicChallenges ?? [],
    personalChallenges: record.personalChallenges ?? [],
    mentalHealthConcerns: record.mentalHealthConcerns,
    personalityTraits: record.personalityTraits,
    communicationPreference: record.communicationPreference,
    createdAt: record.createdAt ?? now,
    updatedAt: record.updatedAt ?? now,
  };
}

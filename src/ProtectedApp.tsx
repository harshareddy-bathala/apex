import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';

import Dashboard from '@/features/dashboard/components/Dashboard';
import Chat from '@/features/chat/components/Chat';
import DailyCheckIn from '@/features/check-in/components/DailyCheckIn';
import TeacherReport from '@/features/reports/components/TeacherReport';
import GoalsEditor from '@/features/goals/components/GoalsEditor';
import EditProfilePage from '@/features/profile/EditProfilePage';
import HomeworkList from '@/features/homework/components/HomeworkList';
import TestsList from '@/features/tests/components/TestsList';
import PeerChat from '@/features/peer-chat/components/PeerChat';
import TeacherAlerts from '@/features/reports/components/TeacherAlerts';
import Sidebar from '@/features/navigation/Sidebar';
import ProfilePage from '@/features/profile/ProfilePage';
import FullScreenLoader from '@/router/components/FullScreenLoader';
import { useAuth } from '@/common/hooks/useAuth';
import { useProfile } from '@/common/context/ProfileContext';
import { auth } from '@/firebase';
import { mapFirebaseUser } from '@/utils/mapFirebaseUser';
import { getDashboardData, getHomework, getTests, updateHomework } from '@/api/client';
import type { StudentProfileRecord } from '@/api/client';
import type {
  ActivityLog,
  DailyCheckIn as DailyCheckInType,
  Homework,
  StudentProfile,
  TeacherAlert,
  Test,
} from '@/types';

type View = 'dashboard' | 'chat' | 'checkin' | 'report' | 'homework' | 'tests' | 'peer-chat' | 'profile';

const ProtectedApp: React.FC = () => {
  const { user, idToken } = useAuth();
  const { profile: profileRecord, refetchProfile } = useProfile();
  const authUser = useMemo(() => mapFirebaseUser(user), [user]);

  const [profileState, setProfileState] = useState<StudentProfile | null>(() =>
    profileRecord ? normalizeProfile(profileRecord) : null,
  );
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckInType[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [teacherAlerts, setTeacherAlerts] = useState<TeacherAlert[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [homeworkLoading, setHomeworkLoading] = useState(false);
  const [homeworkError, setHomeworkError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!idToken) return;
    try {
      const data = await getDashboardData(idToken);
      setCheckIns(data.checkIns);
      // If backend returns activities, set them here. 
      // For now, we might want to derive some activities from checkIns if the backend list is empty
      if (data.activities && data.activities.length > 0) {
        setActivities(data.activities);
      } else {
        // Optional: Reconstruct basic activities from check-ins
        const derivedActivities = data.checkIns.map(c => ({
          id: `activity-checkin-${c.id}`,
          studentId: c.studentId,
          type: 'mental-health' as const,
          category: 'check-in',
          description: `Completed daily check-in: ${c.mood} mood`,
          sentiment: (c.mood === 'excellent' || c.mood === 'good' ? 'positive' : c.mood === 'okay' ? 'neutral' : 'negative') as 'positive' | 'neutral' | 'negative',
          timestamp: c.timestamp || new Date().toISOString()
        }));
        setActivities(prev => [...derivedActivities, ...prev].slice(0, 50)); // Keep recent
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    }
  }, [idToken]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

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

    setHomeworkLoading(true);
    try {
      const { homework: assignments } = await getHomework(idToken);
      setHomework(assignments);
      setHomeworkError(null);
    } catch {
      setHomework([]);
      setHomeworkError('Unable to load homework.');
    } finally {
      setHomeworkLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    void loadHomework();
  }, [loadHomework]);

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
    // Refresh data from server to ensure consistency
    void loadDashboardData();
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

  if (!idToken || !profileRecord || !authUser || !profileState) {
    return <FullScreenLoader message="Preparing your dashboard..." />;
  }

  const todayCheckIn = checkIns.find((c) => c.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-bg-dark font-sans">
      <Sidebar
        authUser={authUser}
        profile={profileState}
        role={profileRecord.role === 'teacher' ? 'teacher' : 'student'}
        currentView={currentView}
        hasTodayCheckIn={!!todayCheckIn}
        onViewChange={setCurrentView}
        onCheckInClick={() => setShowCheckIn(true)}
        onReportClick={() => setShowReport(true)}
        onLogout={handleLogout}
      />

      <main className="md:pl-64 h-screen overflow-auto transition-all duration-200">
        <div className="max-w-7xl mx-auto p-6 pb-24 md:pb-6">
          {teacherAlerts.length > 0 && currentView === 'dashboard' && (
            <div className="mb-6">
              <TeacherAlerts alerts={teacherAlerts} onDismiss={handleDismissAlert} />
            </div>
          )}

          {currentView === 'dashboard' && (
            <Dashboard
              profile={profileState}
              checkIns={checkIns}
              activities={activities}
              homework={homework}
              tests={tests}
              onHomeworkStatusChange={handleHomeworkStatusChange}
            />
          )}

          {currentView === 'homework' && (
            <HomeworkList
              homework={homework}
              onStatusChange={handleHomeworkStatusChange}
              onRefresh={loadHomework}
              loadingExternal={homeworkLoading}
              errorMessage={homeworkError}
            />
          )}

          {currentView === 'tests' && <TestsList idToken={idToken} />}

          {currentView === 'peer-chat' && (
            <PeerChat currentUserId={profileState.id} currentUserName={profileState.name} idToken={idToken} />
          )}

          {currentView === 'chat' && (
            <Chat
              profile={profileState}
              checkIns={checkIns}
              activities={activities}
              onAddActivity={addActivity}
              onTriggerAlert={handleTriggerAlert}
            />
          )}

          {currentView === 'profile' && (
            <ProfilePage
              profile={profileState}
              onEdit={() => setShowEditProfile(true)}
            />
          )}
        </div>
      </main>

      {showCheckIn && (
        <DailyCheckIn
          profile={profileState}
          idToken={idToken}
          onComplete={handleCheckInComplete}
          onClose={() => setShowCheckIn(false)}
        />
      )}

      {showReport && (
        <TeacherReport profile={profileState} checkIns={checkIns} activities={activities} onClose={() => setShowReport(false)} />
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

      {!todayCheckIn && checkIns.length > 0 && currentView !== 'dashboard' && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce">
          <span>📅</span>
          <span>Don't forget your daily check-in!</span>
          <button
            onClick={() => setShowCheckIn(true)}
            className="ml-2 bg-white text-green-600 px-3 py-1 rounded font-medium hover:bg-green-50 transition-colors"
          >
            Check In Now
          </button>
        </div>
      )}
    </div>
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

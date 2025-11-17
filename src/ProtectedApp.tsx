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
import Navigation from '@/features/navigation/components/Navigation';
import {
  type StudentProfile,
  type DailyCheckIn as DailyCheckInType,
  type ActivityLog,
  type Homework,
  type Test,
  type ChatContact,
  type PeerMessage,
  type Conversation,
  type TeacherAlert,
} from '@/types';
import { type User } from '@/features/auth/types';
import { auth } from '@/firebase';
import { useAuth } from '@/common/hooks/useAuth';
import { useProfile } from '@/common/context/ProfileContext';
import { getHomework, updateHomework, type StudentProfileRecord } from '@/api/client';
import FullScreenLoader from '@/router/components/FullScreenLoader';
import { mapFirebaseUser } from '@/utils/mapFirebaseUser';

type View = 'dashboard' | 'chat' | 'checkin' | 'report' | 'homework' | 'tests' | 'peer-chat';

const ProtectedApp: React.FC = () => {
  const { user, idToken } = useAuth();
  const { profile: profileRecord, refetchProfile } = useProfile();

  const normalizedProfile = useMemo(() => (profileRecord ? normalizeProfile(profileRecord) : null), [profileRecord]);
  const [profileState, setProfileState] = useState<StudentProfile | null>(normalizedProfile);
  const profileId = profileState?.id;

  useEffect(() => {
    if (normalizedProfile) {
      setProfileState(normalizedProfile);
    }
  }, [normalizedProfile]);

  const authUser = useMemo<User | null>(() => mapFirebaseUser(user), [user]);

  const [checkIns, setCheckIns] = useState<DailyCheckInType[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [peerMessages, setPeerMessages] = useState<PeerMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [teacherAlerts, setTeacherAlerts] = useState<TeacherAlert[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [homeworkLoading, setHomeworkLoading] = useState(false);
  const [homeworkError, setHomeworkError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) {
      return;
    }
    setTests(seedTests(profileId));
    setContacts(seedContacts());
  }, [profileId]);

  const loadHomework = useCallback(async () => {
    if (!idToken) {
      return;
    }
    setHomeworkLoading(true);
    try {
      const { homework: assignments } = await getHomework(idToken);
      setHomework(assignments);
      setHomeworkError(null);
    } catch (err) {
      console.error('Failed to load homework', err);
      setHomeworkError('Unable to load homework.');
    } finally {
      setHomeworkLoading(false);
    }
  }, [idToken]);
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
      } catch (err) {
        console.error('Failed to persist homework status', err);
        setHomeworkError('Unable to update homework status. Please retry.');
        await loadHomework();
        throw err;
      }
    },
    [idToken, loadHomework],
  );


  useEffect(() => {
    void loadHomework();
  }, [loadHomework]);

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

  const handleSendPeerMessage = (receiverId: string, message: string) => {
    if (!profileState) return;
    const newMessage: PeerMessage = {
      id: `msg-${Date.now()}`,
      conversationId: `conv-${[profileState.id, receiverId].sort().join('-')}`,
      senderId: profileState.id,
      senderName: profileState.name,
      receiverId,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text',
    };
    setPeerMessages((prev) => [...prev, newMessage]);

    setConversations((prev) => {
      const existing = prev.find((c) => c.id === newMessage.conversationId);
      if (existing) {
        return prev.map((c) =>
          c.id === newMessage.conversationId ? { ...c, lastMessage: message, lastMessageTime: newMessage.timestamp } : c,
        );
      }
      return [
        ...prev,
        {
          id: newMessage.conversationId,
          participants: [profileState.id, receiverId],
          lastMessage: message,
          lastMessageTime: newMessage.timestamp,
          unreadCount: 0,
          type: 'peer',
        },
      ];
    });
  };

  const handleDismissAlert = (alertId: string) => {
    setTeacherAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleProfileUpdate = (updates: Partial<StudentProfile>) => {
    setProfileState((prev) => (prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev));
  };

  const handleTriggerAlert = (alert: Omit<TeacherAlert, 'id' | 'createdAt'>) => {
    if (!profileState) return;
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

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }
    await signOut(auth);
  };

  if (!idToken) {
    return <FullScreenLoader message="Securing your session..." />;
  }

  if (!profileRecord || !authUser) {
    return <FullScreenLoader message="Preparing your dashboard..." />;
  }

  if (!profileState) {
    return <FullScreenLoader message="Preparing your dashboard..." />;
  }

  const todayCheckIn = checkIns.find((c) => c.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-bg-dark font-sans">
      <Navigation
        authUser={authUser}
        profile={profileState}
        currentView={currentView}
        hasTodayCheckIn={!!todayCheckIn}
        onViewChange={setCurrentView}
        onCheckInClick={() => setShowCheckIn(true)}
        onReportClick={() => setShowReport(true)}
        onEditProfile={() => setShowEditProfile(true)}
        onEditGoals={() => setShowGoalsEditor(true)}
        onLogout={handleLogout}
      />

      <main className="h-[calc(100vh-4rem)] overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
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
          {currentView === 'tests' && <TestsList studentId={profileState.id} tests={tests} onUpdate={setTests} />}
          {currentView === 'peer-chat' && (
            <PeerChat
              currentUserId={profileState.id}
              currentUserName={profileState.name}
              contacts={contacts}
              conversations={conversations}
              messages={peerMessages}
              onSendMessage={handleSendPeerMessage}
            />
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

function seedTests(studentId: string): Test[] {
  return [
    {
      id: 'test-1',
      studentId,
      teacherId: 't1',
      teacherName: 'Mr. Smith',
      subject: 'Mathematics',
      title: 'Algebra Mid-term Exam',
      description: 'Covers chapters 1-5',
      testDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 90,
      syllabus: ['Linear Equations', 'Quadratic Equations', 'Functions', 'Graphs'],
      importance: 'midterm',
      preparationStatus: 'in-progress',
      createdAt: new Date().toISOString(),
    },
  ];
}

function seedContacts(): ChatContact[] {
  return [
    {
      id: 'c1',
      name: 'Sarah Chen',
      role: 'student',
      class: '10th Grade',
      isOnline: true,
    },
    {
      id: 't1',
      name: 'Mr. Smith',
      role: 'teacher',
      subject: 'Mathematics',
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

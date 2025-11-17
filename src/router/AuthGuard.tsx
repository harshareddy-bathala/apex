import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';

import { useAuth } from '@/common/hooks/useAuth';
import { getStudentProfile, type StudentProfileRecord } from '@/api/client';
import OnboardingPage from '@/features/auth/OnboardingPage';
import FullScreenLoader from '@/router/components/FullScreenLoader';
import { ProfileProvider } from '@/common/context/ProfileContext';
import TeacherApp from '@/features/teacher/components/TeacherApp';
import ProtectedApp from '@/ProtectedApp';
import { auth } from '@/firebase';
import { mapFirebaseUser } from '@/utils/mapFirebaseUser';

const AuthGuard: React.FC = () => {
  const { user, idToken } = useAuth();
  const [profile, setProfile] = useState<StudentProfileRecord | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!idToken) {
      setProfile(null);
      return;
    }

    setIsProfileLoading(true);
    setError(null);
    try {
      const record = await getStudentProfile(idToken);
      setProfile(record);
    } catch (err) {
      console.error('Failed to load user profile', err);
      setProfile(null);
      setError('Unable to load your profile. Please try again.');
    } finally {
      setIsProfileLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (!idToken) {
      setProfile(null);
      return;
    }
    void fetchProfile();
  }, [fetchProfile, idToken]);

  const profileRole = profile?.role ?? 'student';
  const requiresOnboarding = profileRole !== 'teacher' && (!profile || profile.onboardingComplete === false);
  const providerValue = useMemo(() => ({ profile, refetchProfile: fetchProfile }), [profile, fetchProfile]);
  const authUser = useMemo(() => mapFirebaseUser(user), [user]);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }
    await signOut(auth);
  };

  if (!user || !idToken) {
    return <FullScreenLoader message="Securing your session..." />;
  }

  if (isProfileLoading) {
    return <FullScreenLoader message="Loading your profile..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-semibold">{error}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => fetchProfile()}
            className="px-5 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-400"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2 rounded-lg border border-white/30 text-white font-medium hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (profileRole === 'teacher') {
    if (!profile || !authUser) {
      return <FullScreenLoader message="Preparing your dashboard..." />;
    }

    return (
      <ProfileProvider value={providerValue}>
        <TeacherApp profile={profile} idToken={idToken} authUser={authUser} onLogout={handleLogout} />
      </ProfileProvider>
    );
  }

  return (
    <ProfileProvider value={providerValue}>
      {requiresOnboarding ? <OnboardingPage idToken={idToken} /> : <ProtectedApp />}
    </ProfileProvider>
  );
};

export default AuthGuard;

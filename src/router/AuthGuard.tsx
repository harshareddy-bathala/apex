import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfileRecord | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceOnboarding, setForceOnboarding] = useState(() =>
    Boolean((location.state as { forceOnboarding?: boolean } | null)?.forceOnboarding),
  );

  useEffect(() => {
    const locationState = location.state as { forceOnboarding?: boolean } | null;
    if (locationState?.forceOnboarding) {
      setForceOnboarding(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (forceOnboarding && profile?.onboardingComplete) {
      setForceOnboarding(false);
    }
  }, [forceOnboarding, profile?.onboardingComplete]);

  const fetchProfile = useCallback(async () => {
    if (!idToken) {
      setProfile(null);
      return;
    }

    // Prevent duplicate requests
    if (isProfileLoading) {
      return;
    }

    setIsProfileLoading(true);
    setError(null);
    try {
      const record = await getStudentProfile(idToken);
      setProfile(record);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setProfile(null);
      setError('Unable to load your profile. Please try again.');
    } finally {
      setIsProfileLoading(false);
    }
  }, [idToken, isProfileLoading]);

  useEffect(() => {
    if (!idToken) {
      setProfile(null);
      return;
    }
    void fetchProfile();
  }, [idToken]); // Remove fetchProfile from dependencies to prevent unnecessary re-fetches

  // Get role from profile (which now includes role from backend), fallback to student
  const profileRole = profile?.role ?? 'student';
  const needsProfileCompletion = profile?.onboardingComplete !== true;
  const requiresOnboarding = profileRole !== 'teacher' && (forceOnboarding || needsProfileCompletion);
  const providerValue = useMemo(() => ({ profile, refetchProfile: fetchProfile }), [profile, fetchProfile]);
  const authUser = useMemo(() => mapFirebaseUser(user), [user]);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }
    await signOut(auth);
  };

  useEffect(() => {
    if (profileRole === 'teacher' && location.pathname !== '/teacher') {
      navigate('/teacher', { replace: true });
    }
  }, [profileRole, location.pathname, navigate]);

  if (!user || !idToken) {
    return <FullScreenLoader message="Securing your session..." />;
  }

  if (isProfileLoading) {
    return <FullScreenLoader message="Loading your profile..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col items-center justify-center gap-4 px-6 text-center font-display">
        <p className="text-xl font-semibold">{error}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => fetchProfile()}
            className="px-5 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-primary-dark)] transition-colors"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors"
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

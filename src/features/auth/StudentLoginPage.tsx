import { Mail, Lock, UserRound, EyeOff, Eye } from 'lucide-react';
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';

import { createStudentUserDoc } from '@/api/client';
import { auth } from '@/firebase';
import { useAuth } from '@/common/hooks/useAuth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

type AuthMode = 'signin' | 'signup';

const StudentLoginPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [shouldForceOnboarding, setShouldForceOnboarding] = useState(false);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const mapAuthError = (code: string, currentMode: AuthMode): string => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account already exists for this email. Try signing in instead.';
      case 'auth/weak-password':
        return 'Passwords must be at least 6 characters. Try a longer passphrase.';
      case 'auth/invalid-email':
        return 'That email address looks invalid. Please double-check it.';
      case 'auth/user-not-found':
        return currentMode === 'signin'
          ? 'No account found for this email. Try signing up first.'
          : 'Unable to find the account after creation. Please retry.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect password. Re-enter it or tap “Forgot password”.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a minute before trying again.';
      default:
        return 'Unable to authenticate right now. Please double-check your credentials.';
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setInfoMessage(null);
  };

  const seedStudentDoc = async (uid: string, emailAddress?: string | null) => {
    const normalized = (emailAddress ?? '').trim().toLowerCase();
    if (!normalized) {
      return;
    }
    try {
      await createStudentUserDoc(uid, normalized);
    } catch (_seedError) {
      /* no-op */
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        if (credential.user && fullName.trim()) {
          await updateProfile(credential.user, { displayName: fullName.trim() });
        }
        if (credential.user) {
          await seedStudentDoc(credential.user.uid, credential.user.email ?? normalizedEmail);
          await credential.user.getIdToken(true);
        }
        setShouldForceOnboarding(true);
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        setShouldForceOnboarding(false);
      }
    } catch (authError) {
      const code = (authError as { code?: string })?.code;
      setError(code ? mapAuthError(code, mode) : 'Unable to authenticate. Please double-check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Enter your email address first so we know where to send the reset link.');
      return;
    }

    setError(null);
    setInfoMessage(null);
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, normalizeEmail(email));
      setInfoMessage('Password reset email sent. Check your inbox (and spam).');
    } catch (resetError) {
      const code = (resetError as { code?: string })?.code;
      const message = code === 'auth/user-not-found'
        ? 'No account exists for that email yet. Try signing up first.'
        : code === 'auth/invalid-email'
        ? 'That email looks invalid. Please double-check it.'
        : 'Unable to send reset email right now. Please try again later.';
      setError(message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const tokenResponse = (credential as { _tokenResponse?: { isNewUser?: boolean } })._tokenResponse;
      const additionalInfo = (credential as { additionalUserInfo?: { isNewUser?: boolean } }).additionalUserInfo;
      const isNewUser = tokenResponse?.isNewUser ?? additionalInfo?.isNewUser ?? false;
      if (isNewUser && credential.user) {
        await seedStudentDoc(credential.user.uid, credential.user.email);
        await credential.user.getIdToken(true);
      }
      setShouldForceOnboarding(isNewUser);
    } catch (authError) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-primary)] font-display">
        Checking your session…
      </div>
    );
  }

  if (user) {
    // Let the AppRouter's ProtectedRoutes handle authenticated users
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-card">
            <Lock className="h-6 w-6" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--text-muted)]">Student Mentor AI</p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)]">Secure access to your learning cockpit</p>
        </div>

        <div className="glass-panel space-y-6 rounded-3xl">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-[var(--border-color)] bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:shadow-md disabled:opacity-60"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-4 text-[var(--text-muted)] text-sm">
            <span className="flex-1 border-t border-[var(--border-subtle)]" />
            or
            <span className="flex-1 border-t border-[var(--border-subtle)]" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Full name</span>
                <div className="mt-1 flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-3">
                  <UserRound className="h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                    placeholder="Jordan Patel"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Email</span>
              <div className="mt-1 flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-3">
                <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Password</span>
              <div className="mt-1 flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-3">
                <Lock className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {infoMessage && (
              <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {infoMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[var(--accent-primary)] py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'signin' && (
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResetting}
              className="w-full text-center text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              {isResetting ? 'Sending reset email…' : 'Forgot password?'}
            </button>
          )}

          <button
            type="button"
            onClick={toggleMode}
            className="w-full text-center text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)]">
          By continuing you agree to the Student Mentor AI Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default StudentLoginPage;

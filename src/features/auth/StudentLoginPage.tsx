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
      console.warn('Unable to seed user doc: missing email');
      return;
    }
    try {
      await createStudentUserDoc(uid, normalized);
    } catch (seedError) {
      console.error('Failed to create user document', seedError);
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
        }
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      }
    } catch (authError) {
      console.error(authError);
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
      console.error(resetError);
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
      }
    } catch (authError) {
      console.error(authError);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Checking your session…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-purple-500 text-3xl">
            🎓
          </div>
          <h1 className="text-3xl font-semibold text-white">Student Mentor AI</h1>
          <p className="text-slate-400">Sign in to meet your personal mentor</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur p-6 space-y-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white py-3 font-medium text-slate-900 hover:bg-slate-100 transition disabled:opacity-60"
          >
            <span className="text-lg">🔐</span> Continue with Google
          </button>

          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <span className="flex-1 border-t border-white/10" />
            or
            <span className="flex-1 border-t border-white/10" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Alex Rivera"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-3 text-slate-400 hover:text-white text-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'View'}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            {infoMessage && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {infoMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-purple-500 py-3 font-semibold text-white hover:from-sky-400 hover:to-purple-400 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'signin' && (
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResetting}
              className="w-full text-center text-sm text-slate-400 hover:text-white"
            >
              {isResetting ? 'Sending reset email…' : 'Forgot password?'}
            </button>
          )}

          <button type="button" onClick={toggleMode} className="w-full text-center text-sm text-slate-400 hover:text-white">
            {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500">By continuing you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
};

export default StudentLoginPage;

import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

import { auth } from '@/firebase';
import { useAuth } from '@/common/hooks/useAuth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const TeacherLoginPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const mapAuthError = (code?: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'That email address looks invalid. Please check it.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect password. Try again or reset it below.';
      case 'auth/user-not-found':
        return 'No teacher account exists for this email. Contact an admin to invite you.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Wait a minute and retry.';
      default:
        return 'Unable to sign in right now. Please confirm your credentials.';
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (authError) {
      const code = (authError as { code?: string })?.code;
      setError(mapAuthError(code));
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (authError) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Enter the email first so we can send the reset link.');
      return;
    }

    setError(null);
    setInfoMessage(null);
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, normalizeEmail(email));
      setInfoMessage('Reset email sent. Check your inbox or spam folder.');
    } catch (resetError) {
      const code = (resetError as { code?: string })?.code;
      const message = code === 'auth/user-not-found'
        ? 'No teacher account exists for that email. Contact an admin to get access.'
        : code === 'auth/invalid-email'
        ? 'That email looks invalid. Please double-check it.'
        : 'Unable to send the reset email right now. Please try again later.';
      setError(message);
    } finally {
      setIsResetting(false);
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
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/80 text-3xl">🏫</div>
          <h1 className="text-3xl font-semibold text-white">Teacher Access</h1>
          <p className="text-slate-400">Secure sign-in for verified educators</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur p-6 space-y-6">
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

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="teacher@school.edu"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-semibold text-white hover:from-amber-400 hover:to-orange-400 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Need access? Please contact your administrator to get invited.
          </p>

          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={isResetting}
            className="w-full text-center text-sm text-slate-400 hover:text-white"
          >
            {isResetting ? 'Sending reset email…' : 'Forgot password?'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherLoginPage;

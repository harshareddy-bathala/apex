import React, { useState } from 'react';
import { User } from '@/features/auth/types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    // Simulate Google OAuth - In production, use Firebase or Auth0
    setTimeout(() => {
      const user: User = {
        id: `google-${Date.now()}`,
        email: 'user@gmail.com',
        name: 'Google User',
        photoURL: 'https://via.placeholder.com/150',
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('authUser', JSON.stringify(user));
      onLoginSuccess(user);
      setIsLoading(false);
    }, 1500);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && !name) {
      setError('Please enter your name');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    // Simulate authentication - In production, use real backend
    setTimeout(() => {
      if (isSignUp) {
        // Sign up
        const user: User = {
          id: `email-${Date.now()}`,
          email: email,
          name: name,
          provider: 'email',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('authUser', JSON.stringify(user));
        onLoginSuccess(user);
      } else {
        // Login - check if user exists
        const existingUser = localStorage.getItem('authUser');
        if (existingUser) {
          const user = JSON.parse(existingUser);
          if (user.email === email) {
            onLoginSuccess(user);
          } else {
            setError('Invalid credentials. Please sign up first.');
            setIsLoading(false);
            return;
          }
        } else {
          setError('No account found. Please sign up first.');
          setIsLoading(false);
          return;
        }
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-400 to-purple-500 rounded-2xl mb-4 shadow-2xl">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">APEX</h1>
          <p className="text-slate-400">Your personal guide to academic excellence</p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800 text-slate-400">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Sign Up/Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-slate-500 text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Powered by Gemini AI • Cloud Run Hackathon 2025
        </p>
      </div>
    </div>
  );
};

export default Login;

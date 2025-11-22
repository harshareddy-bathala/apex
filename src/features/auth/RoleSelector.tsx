import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, BookOpen } from 'lucide-react';

const RoleSelector: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-primary)] text-white">
              <BookOpen size={32} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] font-display">Student Mentor</h1>
            <p className="mt-2 text-[var(--text-secondary)]">Choose your role to get started</p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/login/student')}
            className="w-full p-6 rounded-2xl bg-white border border-beige-200 hover:border-[var(--accent-primary)] hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">I'm a Student</h3>
                <p className="text-sm text-gray-600">Access my dashboard, habits, and learning tools</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/login/teacher')}
            className="w-full p-6 rounded-2xl bg-white border border-beige-200 hover:border-[var(--accent-primary)] hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">I'm a Teacher</h3>
                <p className="text-sm text-gray-600">Manage classes, assignments, and student progress</p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-[var(--text-muted)]">
            New to Student Mentor? <a href="#" className="text-[var(--accent-primary)] hover:underline">Learn more</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;

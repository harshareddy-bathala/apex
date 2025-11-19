import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { updateProfile } from '@/api/client';
import { useProfile } from '@/common/context/ProfileContext';

interface OnboardingPageProps {
  idToken: string | null;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ idToken }) => {
  const navigate = useNavigate();
  const { refetchProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    grade: '',
    tokenNumber: '',
    dateOfBirth: '',
    phoneNumber: '',
    hobbies: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;

    setLoading(true);
    setError(null);

    try {
      const hobbiesList = formData.hobbies.split(',').map((h) => h.trim()).filter(Boolean);
      
      await updateProfile(idToken, {
        name: formData.fullName,
        grade: formData.grade,
        studentId: formData.tokenNumber,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        interests: hobbiesList,
        onboardingComplete: true,
      });

      await refetchProfile();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects are handled by global CSS, but we can add a local touch */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20 mb-6">
            🎓
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white text-glow">Welcome Student</h2>
          <p className="mt-3 text-slate-400 text-lg">Let's set up your personalized profile.</p>
        </div>

        <form className="glass-panel rounded-3xl p-8 space-y-6 border border-white/10 shadow-2xl" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Class / Grade
                </label>
                <input
                  id="grade"
                  name="grade"
                  type="text"
                  required
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none"
                  placeholder="10th"
                />
              </div>
              <div>
                <label htmlFor="tokenNumber" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Student ID
                </label>
                <input
                  id="tokenNumber"
                  name="tokenNumber"
                  type="text"
                  required
                  value={formData.tokenNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none"
                  placeholder="STU-123"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-300 mb-1.5">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-300 mb-1.5">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label htmlFor="hobbies" className="block text-sm font-medium text-slate-300 mb-1.5">
                Hobbies / Interests
              </label>
              <input
                id="hobbies"
                name="hobbies"
                type="text"
                value={formData.hobbies}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-950/50 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none"
                placeholder="Coding, Reading, Football..."
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-200 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full premium-button py-4 px-6 rounded-xl text-base font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Profile...
              </span>
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;

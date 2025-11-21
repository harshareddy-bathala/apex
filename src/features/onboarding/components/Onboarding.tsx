import React, { useState } from 'react';
import { type StudentProfile } from '@/types';

type GenderValue = 'male' | 'female' | 'other' | 'prefer-not-to-say';
type LearningStyleValue = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';

interface OnboardingProps {
  onComplete: (profile: StudentProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState<GenderValue>('prefer-not-to-say');

  // Step 2: Academic
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [academicGoals, setAcademicGoals] = useState('');
  const [learningStyle, setLearningStyle] = useState<LearningStyleValue>('visual');

  // Step 3: Aspirations
  const [careerAspirations, setCareerAspirations] = useState('');
  const [dreamJob, setDreamJob] = useState('');
  const [roleModels, setRoleModels] = useState('');

  // Step 4: Interests & Hobbies
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState('');

  // Step 5: Sports & Physical
  const [sportsActivities, setSportsActivities] = useState<string[]>([]);
  const [sportInput, setSportInput] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState('');

  // Step 6: Challenges
  const [academicChallenges, setAcademicChallenges] = useState<string[]>([]);
  const [academicChallengeInput, setAcademicChallengeInput] = useState('');
  const [personalChallenges, setPersonalChallenges] = useState<string[]>([]);
  const [personalChallengeInput, setPersonalChallengeInput] = useState('');
  const [mentalHealthConcerns, setMentalHealthConcerns] = useState('');

  const totalSteps = 6;

  const addItem = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (value.trim()) {
      setter((prev) => [...prev, value.trim()]);
      inputSetter('');
    }
  };

  const removeItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (currentStep: number): boolean => {
    setError('');
    switch (currentStep) {
      case 1: {
        if (!name.trim()) {
          setError('Please enter your name.');
          return false;
        }
        const ageNum = parseInt(age, 10);
        if (Number.isNaN(ageNum) || ageNum < 5 || ageNum > 25) {
          setError('Please enter a valid age between 5 and 25.');
          return false;
        }
        if (!grade.trim()) {
          setError('Please enter your grade/class.');
          return false;
        }
        return true;
      }
      case 2:
        if (subjects.length === 0) {
          setError('Please add at least one subject you study.');
          return false;
        }
        if (!academicGoals.trim()) {
          setError('Please share your academic goals.');
          return false;
        }
        return true;
      case 3:
        if (!careerAspirations.trim() || !dreamJob.trim()) {
          setError('Please tell us about your career aspirations and dream job.');
          return false;
        }
        return true;
      case 4:
        if (interests.length === 0 && hobbies.length === 0) {
          setError('Please add at least one interest or hobby.');
          return false;
        }
        return true;
      case 5:
        // Sports is optional
        return true;
      case 6:
        if (academicChallenges.length === 0 && personalChallenges.length === 0) {
          setError('Please share at least one challenge you face (academic or personal).');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleSubmit = () => {
    const profile: StudentProfile = {
      id: `student-${Date.now()}`,
      name: name.trim(),
      age: parseInt(age, 10),
      grade: grade.trim(),
      gender,
      subjects,
      academicGoals: academicGoals.trim(),
      learningStyle,
      careerAspirations: careerAspirations.trim(),
      dreamJob: dreamJob.trim(),
      roleModels: roleModels.trim() || undefined,
      interests,
      hobbies,
      sportsActivities,
      fitnessGoals: fitnessGoals.trim() || undefined,
      academicChallenges,
      personalChallenges,
      mentalHealthConcerns: mentalHealthConcerns.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onComplete(profile);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--accent-primary)]">Let's start with the basics</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">What's your name?</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Alex"
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">How old are you?</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 15"
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">What grade/class are you in?</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g., 10th Grade"
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Gender (optional)</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as GenderValue)}
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
              >
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--accent-primary)]">Your Academic Journey</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">What subjects are you studying?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addItem(subjectInput, setSubjects, setSubjectInput))
                  }
                  placeholder="e.g., Mathematics"
                  className="flex-1 px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => addItem(subjectInput, setSubjects, setSubjectInput)}
                  className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg text-white font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {subjects.map((subject, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full text-sm flex items-center gap-2 border border-[var(--accent-primary)]/20">
                    {subject}
                    <button onClick={() => removeItem(idx, setSubjects)} className="hover:text-[var(--error)]">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">What are your academic goals?</label>
              <textarea
                value={academicGoals}
                onChange={(e) => setAcademicGoals(e.target.value)}
                placeholder="e.g., Score above 90% in finals, improve in Science"
                rows={3}
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Your learning style</label>
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value as LearningStyleValue)}
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
              >
                <option value="visual">Visual (diagrams, images)</option>
                <option value="auditory">Auditory (listening, discussion)</option>
                <option value="kinesthetic">Kinesthetic (hands-on, practice)</option>
                <option value="reading-writing">Reading-Writing (notes, reading)</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--accent-primary)]">Your Future Aspirations</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">What do you aspire to become?</label>
              <textarea
                value={careerAspirations}
                onChange={(e) => setCareerAspirations(e.target.value)}
                placeholder="e.g., I want to work in technology and create innovative solutions"
                rows={3}
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">What's your dream job?</label>
              <input
                type="text"
                value={dreamJob}
                onChange={(e) => setDreamJob(e.target.value)}
                placeholder="e.g., Software Engineer, Doctor, Teacher"
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Who are your role models? (optional)</label>
              <input
                type="text"
                value={roleModels}
                onChange={(e) => setRoleModels(e.target.value)}
                placeholder="e.g., Elon Musk, Marie Curie"
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--accent-primary)]">Interests & Hobbies</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">What are your interests?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addItem(interestInput, setInterests, setInterestInput))
                  }
                  placeholder="e.g., Coding, Reading, Music"
                  className="flex-1 px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => addItem(interestInput, setInterests, setInterestInput)}
                  className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg text-white font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {interests.map((interest, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] rounded-full text-sm flex items-center gap-2 border border-[var(--accent-secondary)]/20">
                    {interest}
                    <button onClick={() => removeItem(idx, setInterests)} className="hover:text-[var(--error)]">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">What are your hobbies?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hobbyInput}
                  onChange={(e) => setHobbyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(hobbyInput, setHobbies, setHobbyInput))}
                  placeholder="e.g., Photography, Gaming"
                  className="flex-1 px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => addItem(hobbyInput, setHobbies, setHobbyInput)}
                  className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg text-white font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {hobbies.map((hobby, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] rounded-full text-sm flex items-center gap-2 border border-[var(--accent-secondary)]/20">
                    {hobby}
                    <button onClick={() => removeItem(idx, setHobbies)} className="hover:text-[var(--error)]">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--accent-primary)]">Sports & Physical Activities</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">What sports or physical activities do you do?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sportInput}
                  onChange={(e) => setSportInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(sportInput, setSportsActivities, setSportInput))}
                  placeholder="e.g., Basketball, Yoga, Swimming"
                  className="flex-1 px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => addItem(sportInput, setSportsActivities, setSportInput)}
                  className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg text-white font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {sportsActivities.map((sport, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[var(--accent-success)]/10 text-[var(--accent-success)] rounded-full text-sm flex items-center gap-2 border border-[var(--accent-success)]/20">
                    {sport}
                    <button onClick={() => removeItem(idx, setSportsActivities)} className="hover:text-[var(--error)]">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Fitness goals (optional)</label>
              <textarea
                value={fitnessGoals}
                onChange={(e) => setFitnessGoals(e.target.value)}
                placeholder="e.g., Get stronger, improve stamina, lose weight"
                rows={2}
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] resize-none"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--accent-primary)]">Understanding Your Challenges</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Academic challenges</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={academicChallengeInput}
                  onChange={(e) => setAcademicChallengeInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), addItem(academicChallengeInput, setAcademicChallenges, setAcademicChallengeInput))
                  }
                  placeholder="e.g., Difficulty in Math, Time management"
                  className="flex-1 px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => addItem(academicChallengeInput, setAcademicChallenges, setAcademicChallengeInput)}
                  className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg text-white font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {academicChallenges.map((challenge, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] rounded-full text-sm flex items-center gap-2 border border-[var(--accent-warning)]/20">
                    {challenge}
                    <button onClick={() => removeItem(idx, setAcademicChallenges)} className="hover:text-[var(--error)]">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Personal challenges</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={personalChallengeInput}
                  onChange={(e) => setPersonalChallengeInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), addItem(personalChallengeInput, setPersonalChallenges, setPersonalChallengeInput))
                  }
                  placeholder="e.g., Anxiety, Peer pressure"
                  className="flex-1 px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => addItem(personalChallengeInput, setPersonalChallenges, setPersonalChallengeInput)}
                  className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg text-white font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {personalChallenges.map((challenge, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] rounded-full text-sm flex items-center gap-2 border border-[var(--accent-warning)]/20">
                    {challenge}
                    <button onClick={() => removeItem(idx, setPersonalChallenges)} className="hover:text-[var(--error)]">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Any mental health concerns? (optional, confidential)
              </label>
              <textarea
                value={mentalHealthConcerns}
                onChange={(e) => setMentalHealthConcerns(e.target.value)}
                placeholder="Feel free to share if comfortable..."
                rows={2}
                className="w-full px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[var(--bg-app)]">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border-color)]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--accent-primary)]">Welcome to Your AI Mentor! 🎓</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Let's personalize your learning journey together</p>
          <div className="mt-4 flex justify-center">
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-8 rounded-full transition-colors ${idx + 1 === step ? 'bg-[var(--accent-primary)]' : idx + 1 < step ? 'bg-[var(--accent-primary)]/50' : 'bg-[var(--bg-secondary)]'
                    }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Step {step} of {totalSteps}
          </p>
        </div>

        <div className="min-h-[400px]">{renderStep()}</div>

        {error && (
          <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-4 border border-[var(--border-color)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] focus:ring-[var(--accent-primary)] transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] focus:ring-[var(--accent-primary)] transition-colors"
          >
            {step === totalSteps ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

import { describe, it, expect } from 'vitest';
import { 
  generateMentorSystemInstruction,
  generateInsights
} from '@/common/utils/aiHelpers';
import { StudentProfile, DailyCheckIn, ActivityLog } from '@/types';

describe('AI Helpers', () => {
  const mockProfile: StudentProfile = {
    id: 'test-123',
    name: 'John Doe',
    age: 16,
    grade: '10',
    subjects: ['Math', 'Science'],
    learningStyle: 'visual',
    academicGoals: 'Get A grades',
    dreamJob: 'Software Engineer',
    careerAspirations: 'Work at a tech company',
    interests: ['Coding', 'Gaming'],
    hobbies: ['Reading', 'Sports'],
    sportsActivities: ['Basketball'],
    academicChallenges: ['Time management'],
    personalChallenges: [],
    currentGoals: ['Improve Math grade'],
    shortTermGoals: ['Pass exams'],
    longTermGoals: ['Get into good college'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('generateMentorSystemInstruction', () => {
    it('generates system instruction for student profile', () => {
      const instruction = generateMentorSystemInstruction(mockProfile);
      
      expect(instruction).toContain('John Doe');
      expect(instruction).toContain('16');
      expect(instruction).toContain('Software Engineer');
      expect(typeof instruction).toBe('string');
      expect(instruction.length).toBeGreaterThan(0);
    });

    it('includes student interests and goals', () => {
      const instruction = generateMentorSystemInstruction(mockProfile);
      
      expect(instruction).toContain('Coding');
      expect(instruction.toLowerCase()).toContain('basketball');
    });
  });

  describe('generateInsights', () => {
    it('returns insight structure for check-in data', () => {
      const mockCheckIns: DailyCheckIn[] = [
        {
          id: 'check-1',
          studentId: 'test-123',
          date: new Date().toISOString(),
          mood: 'good',
          stressLevel: 3,
          sleepHours: 7,
          energyLevel: 8,
          studyHours: 3,
          subjectsStudied: ['Math'],
          homeworkCompleted: true,
          classesAttended: 5,
          physicalActivityMinutes: 60,
          sportsParticipation: 'Basketball practice',
          socialInteractions: 'some',
          emotionalState: 'positive',
          achievements: ['Completed homework'],
          timestamp: new Date().toISOString(),
        },
      ];

      const mockActivities: ActivityLog[] = [];
      const insights = generateInsights(mockProfile, mockCheckIns, mockActivities);
      
      expect(insights).toHaveProperty('strengths');
      expect(insights).toHaveProperty('growthAreas');
      expect(insights).toHaveProperty('recommendations');
      expect(Array.isArray(insights.strengths)).toBe(true);
      expect(Array.isArray(insights.growthAreas)).toBe(true);
      expect(Array.isArray(insights.recommendations)).toBe(true);
    });
  });
});

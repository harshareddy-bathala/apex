// Core Student Profile
export interface StudentProfile {
  id: string;
  name: string;
  dateOfBirth?: string;
  age: number;
  grade: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  
  // Academic Information
  subjects: string[];
  academicGoals: string;
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
  
  // Career & Aspirations (Editable - not shown in dashboard)
  careerAspirations: string;
  dreamJob: string;
  roleModels?: string;
  
  // Interests & Hobbies (Editable by student)
  interests: string[];
  hobbies: string[];
  
  // Goals (Dynamic - student can update anytime)
  currentGoals?: string[];
  shortTermGoals?: string[];
  longTermGoals?: string[];
  
  // Sports & Physical Activities
  sportsActivities: string[];
  fitnessGoals?: string;
  
  // Challenges & Support Needs
  academicChallenges: string[];
  personalChallenges: string[];
  mentalHealthConcerns?: string;
  
  // Personality & Communication
  personalityTraits?: string[];
  communicationPreference?: 'direct' | 'gentle' | 'motivational' | 'analytical';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Daily Activity & Mood Tracking
export interface DailyCheckIn {
  id: string;
  studentId: string;
  date: string;
  
  // Mood & Mental Health
  mood: 'excellent' | 'good' | 'okay' | 'stressed' | 'struggling';
  moodNotes?: string;
  stressLevel: number; // 1-10
  sleepHours: number;
  energyLevel: number; // 1-10
  
  // Academic Activities
  studyHours: number;
  subjectsStudied: string[];
  homeworkCompleted: boolean;
  classesAttended: number;
  academicChallengesFaced?: string;
  
  // Physical & Sports
  physicalActivityMinutes: number;
  sportsParticipation?: string;
  
  // Social & Emotional
  socialInteractions: 'many' | 'some' | 'few' | 'none';
  emotionalState: string;
  
  // Achievements
  achievements?: string[];
  
  timestamp: string;
}

// Activity Log for continuous monitoring
export interface ActivityLog {
  id: string;
  studentId: string;
  type: 'academic' | 'sports' | 'social' | 'mental-health' | 'achievement' | 'challenge';
  category: string;
  description: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  timestamp: string;
}

// AI Conversation Messages
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  context?: {
    emotion?: string;
    topic?: string;
    actionItems?: string[];
  };
}

// Teacher Report
export interface TeacherReport {
  id: string;
  studentId: string;
  studentName: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  
  // Academic Summary
  academic: {
    overallProgress: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement';
    subjectPerformance: Record<string, string>;
    studyHoursAverage: number;
    homeworkCompletionRate: number;
    areasOfStrength: string[];
    areasNeedingAttention: string[];
  };
  
  // Mental & Emotional Well-being
  wellbeing: {
    averageMood: string;
    averageStressLevel: number;
    concerningPatterns?: string[];
    positiveIndicators: string[];
    recommendations: string[];
  };
  
  // Sports & Physical Health
  physical: {
    activityLevel: 'high' | 'moderate' | 'low';
    regularParticipation: boolean;
    achievements?: string[];
  };
  
  // Social & Behavioral
  social: {
    interactionLevel: string;
    behavioralNotes?: string;
  };
  
  // AI-Generated Insights
  insights: {
    strengths: string[];
    growthAreas: string[];
    recommendedInterventions: string[];
    parentGuardianNotes?: string;
  };
  
  generatedAt: string;
}

// App State & Settings
export interface AppSettings {
  checkInReminder: boolean;
  reminderTime?: string;
  parentalAccessEnabled: boolean;
  dataRetentionDays: number;
}

// Session Context for AI
export interface SessionContext {
  recentActivities: ActivityLog[];
  recentCheckIns: DailyCheckIn[];
  currentMood?: string;
  currentGoals?: string[];
  recentChallenges?: string[];
  pendingHomework?: Array<{
    subject: string;
    title: string;
    dueDate: string;
    priority: string;
  }>;
  upcomingTests?: Array<{
    subject: string;
    title: string;
    testDate: string;
    importance: string;
  }>;
}

// Homework/ToDo assigned by teacher
export interface Homework {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime?: number; // in minutes
  status: 'pending' | 'in-progress' | 'completed' | 'submitted' | 'overdue';
  completedAt?: string;
  notes?: string;
  attachments?: string[];
}

// Upcoming Tests
export interface Test {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  title: string;
  description?: string;
  testDate: string;
  duration?: number; // in minutes
  syllabus: string[];
  importance: 'quiz' | 'unit-test' | 'midterm' | 'final' | 'board-exam';
  preparationStatus: 'not-started' | 'in-progress' | 'well-prepared';
  studyMaterials?: string[];
  notes?: string;
  createdAt: string;
}

// Chat Contacts (Classmates & Teachers)
export interface ChatContact {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  subject?: string; // for teachers
  class?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: string;
}

// Chat Messages between students/teachers
export interface PeerMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}

export interface AcademicMetrics {
  totalStudyHours: number;
  averageStudyHours: number;
  homeworkCompletionRate: number;
  attendanceRate: number;
  mostStudiedSubjects: string[];
}

// Conversation Thread
export interface Conversation {
  id: string;
  participants: string[]; // user IDs
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: 'peer' | 'teacher' | 'group';
}

// Teacher Alert (AI-triggered)
export interface TeacherAlert {
  id: string;
  studentId: string;
  studentName: string;
  teacherId?: string; // can be null for general alert
  alertType: 'academic-struggle' | 'mental-health' | 'behavior' | 'attendance' | 'general';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  aiInsight: string;
  suggestedActions: string[];
  relatedData: {
    recentCheckIns?: DailyCheckIn[];
    recentActivities?: ActivityLog[];
    academicMetrics?: AcademicMetrics;
  };
  status: 'new' | 'acknowledged' | 'in-progress' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  teacherNotes?: string;
}

import React, { useMemo } from 'react';
import { StudentProfile, DailyCheckIn, ActivityLog, Homework, Test } from '@/types';
import { calculateAcademicMetrics } from '@/common/utils/aiHelpers';
import DashboardContent from './DashboardContent';

interface DashboardProps {
  profile: StudentProfile;
  checkIns: DailyCheckIn[];
  activities: ActivityLog[];
  homework?: Homework[];
  tests?: Test[];
  onHomeworkStatusChange?: (homeworkId: string, status: Homework['status']) => Promise<void> | void;
}

const Dashboard: React.FC<DashboardProps> = ({
  profile,
  checkIns = [],
  activities = [],
  homework = [],
  tests = [],
  onHomeworkStatusChange,
}) => {
  const academicMetrics = useMemo(() => calculateAcademicMetrics(checkIns), [checkIns]);

  // Convert data to Premium Dashboard format
  const dashboardData = useMemo(() => {
    return {
      id: profile.id,
      name: profile.name,
      firstName: profile.name.split(' ')[0],
      grade: profile.grade,
      subjects: profile.subjects.map((subject, idx) => ({
        id: `subj-${idx}`,
        name: subject
      })),

      // Metrics
      avgStudyHours: academicMetrics.averageStudyHours,
      weeklyStudy: checkIns.slice(0, 7).reverse().map(c => c.studyHours),
      homeworkCompletionPercent: academicMetrics.homeworkCompletionRate,
      attendancePercent: academicMetrics.attendanceRate,

      energyLevel: checkIns.length > 0
        ? (checkIns[0].energyLevel >= 7 ? 'high' : checkIns[0].energyLevel >= 4 ? 'balanced' : 'low')
        : 'balanced',

      overallProgressPercent: Math.min(
        100,
        Math.max(
          0,
          Math.round(
            academicMetrics.homeworkCompletionRate * 0.4 +
            academicMetrics.attendanceRate * 0.3 +
            (academicMetrics.averageStudyHours / 3) * 100 * 0.3
          )
        ),
      ),

      energyTrend: checkIns.slice(0, 7).reverse().map(c => c.energyLevel),
      attendanceTrend: checkIns.slice(0, 7).reverse().map(c => c.classesAttended),

      // Today's focus from pending homework
      todaysFocus: homework
        .filter(h => h.status === 'pending' || h.status === 'in-progress')
        .slice(0, 3)
        .map(h => ({
          id: h.id,
          homeworkId: h.id,
          title: h.title,
          subject: h.subject,
          timeEstimate: h.estimatedTime ? `${h.estimatedTime} min` : '30 min',
          completed: h.status === 'completed' || h.status === 'submitted',
          priority: (h.priority === 'urgent' ? 'high' : h.priority) as 'low' | 'medium' | 'high',
          status: h.status,
        })),

      // Upcoming deadlines
      upcomingDeadlines: [
        ...homework
          .filter(h => h.status !== 'completed' && h.status !== 'submitted')
          .map(h => ({
            id: h.id,
            title: h.title,
            subject: h.subject,
            dueDate: h.dueDate,
            daysLeft: Math.ceil((new Date(h.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            priority: h.priority as 'low' | 'medium' | 'high'
          })),
        ...tests.map(t => ({
          id: t.id,
          title: t.title,
          subject: t.subject,
          dueDate: t.testDate,
          daysLeft: Math.ceil((new Date(t.testDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          priority: (t.importance === 'board-exam' || t.importance === 'final' ? 'high' : 'medium') as 'low' | 'medium' | 'high'
        }))
      ]
        .filter(d => d.daysLeft >= 0)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5),

      // Recent activities
      recentActivities: activities.slice(0, 10).map(a => ({
        id: a.id,
        category: (a.type === 'academic' ? 'academic' : a.type === 'sports' ? 'sports' : 'wellness') as 'academic' | 'wellness' | 'sports',
        text: a.description,
        time: getRelativeTime(a.timestamp),
        icon: getActivityIcon(a.type)
      })),

      goals: [
        {
          id: 'goal-1',
          title: profile.dreamJob,
          category: 'career' as const,
          progress: 85
        },
        {
          id: 'goal-2',
          title: profile.academicGoals,
          category: 'academic' as const,
          progress: Math.round(academicMetrics.homeworkCompletionRate * 0.7 + academicMetrics.attendanceRate * 0.3)
        }
      ]
    };
  }, [profile, checkIns, academicMetrics, homework, tests, activities]);

  return (
    <DashboardContent
      studentData={dashboardData}
      onTaskStatusChange={onHomeworkStatusChange}
    />
  );
};

// Helper functions
function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    academic: '📚',
    sports: '⚽',
    'mental-health': '💚',
    social: '👥',
    achievement: '🏆',
    challenge: '⚠️'
  };
  return icons[type] || '📝';
}

export default Dashboard;

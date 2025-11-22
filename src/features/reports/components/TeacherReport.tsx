import React from 'react';
import { TeacherReport as TeacherReportType, StudentProfile, DailyCheckIn, ActivityLog } from '@/types';
import { analyzeMoodPatterns, calculateAcademicMetrics, generateInsights } from '@/common/utils/aiHelpers';

interface TeacherReportProps {
  profile: StudentProfile;
  checkIns: DailyCheckIn[];
  activities: ActivityLog[];
  onClose: () => void;
}

const TeacherReport: React.FC<TeacherReportProps> = ({ profile, checkIns, activities, onClose }) => {
  // Generate report data
  const reportPeriod = {
    startDate: checkIns.length > 0 ? checkIns[checkIns.length - 1].date : new Date().toISOString().split('T')[0],
    endDate: checkIns.length > 0 ? checkIns[0].date : new Date().toISOString().split('T')[0],
  };

  const academicMetrics = calculateAcademicMetrics(checkIns);
  const moodAnalysis = analyzeMoodPatterns(checkIns);
  const insights = generateInsights(profile, checkIns, activities);

  const physicalActivity = checkIns.reduce((sum, c) => sum + c.physicalActivityMinutes, 0) / (checkIns.length || 1);
  const avgPhysicalActivity = Math.round(physicalActivity);

  // Build academic performance summary
  const subjectPerformance: Record<string, string> = {};
  profile.subjects.forEach(subject => {
    const timesStudied = checkIns.filter(c => c.subjectsStudied.includes(subject)).length;
    const percentage = (timesStudied / checkIns.length) * 100;
    if (percentage > 70) subjectPerformance[subject] = 'Strong engagement';
    else if (percentage > 40) subjectPerformance[subject] = 'Moderate engagement';
    else subjectPerformance[subject] = 'Needs attention';
  });

  const getOverallProgress = (): 'excellent' | 'good' | 'satisfactory' | 'needs-improvement' => {
    if (academicMetrics.homeworkCompletionRate > 85 && academicMetrics.averageStudyHours > 2.5) {
      return 'excellent';
    } else if (academicMetrics.homeworkCompletionRate > 70 && academicMetrics.averageStudyHours > 1.5) {
      return 'good';
    } else if (academicMetrics.homeworkCompletionRate > 50) {
      return 'satisfactory';
    }
    return 'needs-improvement';
  };

  const report: TeacherReportType = {
    id: `report-${Date.now()}`,
    studentId: profile.id,
    studentName: profile.name,
    reportPeriod,
    academic: {
      overallProgress: getOverallProgress(),
      subjectPerformance,
      studyHoursAverage: academicMetrics.averageStudyHours,
      homeworkCompletionRate: academicMetrics.homeworkCompletionRate,
      areasOfStrength: insights.strengths.filter(s => s.toLowerCase().includes('study') || s.toLowerCase().includes('homework') || s.toLowerCase().includes('academic')),
      areasNeedingAttention: profile.academicChallenges,
    },
    wellbeing: {
      averageMood: moodAnalysis.averageMood,
      averageStressLevel: moodAnalysis.averageStress,
      concerningPatterns: moodAnalysis.concerns,
      positiveIndicators: moodAnalysis.trend === 'improving' ? ['Mood trend is improving', 'Showing resilience'] : ['Engaged with tracking', 'Self-aware'],
      recommendations: insights.recommendations,
    },
    physical: {
      activityLevel: avgPhysicalActivity > 60 ? 'high' : avgPhysicalActivity > 30 ? 'moderate' : 'low',
      regularParticipation: profile.sportsActivities.length > 0,
      achievements: activities.filter(a => a.type === 'achievement' && a.category === 'sports').map(a => a.description),
    },
    social: {
      interactionLevel: 'Varies day-to-day',
      behavioralNotes: activities.filter(a => a.type === 'social').length > 0 ? 'Socially engaged' : undefined,
    },
    insights: {
      ...insights,
      recommendedInterventions: insights.recommendations,
    },
    generatedAt: new Date().toISOString(),
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-400';
    if (trend === 'declining') return 'text-red-400';
    return 'text-yellow-400';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const reportText = `
STUDENT REPORT
Generated: ${new Date(report.generatedAt).toLocaleDateString()}
Report Period: ${new Date(report.reportPeriod.startDate).toLocaleDateString()} - ${new Date(report.reportPeriod.endDate).toLocaleDateString()}

STUDENT: ${report.studentName}
Grade: ${profile.grade}
Age: ${profile.age}

=== ACADEMIC PERFORMANCE ===
Overall Progress: ${report.academic.overallProgress.toUpperCase()}
Average Study Hours: ${report.academic.studyHoursAverage} hrs/day
Homework Completion: ${report.academic.homeworkCompletionRate}%
Attendance Rate: ${academicMetrics.attendanceRate}%

Subject Performance:
${Object.entries(report.academic.subjectPerformance).map(([subject, performance]) => `  - ${subject}: ${performance}`).join('\n')}

Areas of Strength:
${report.academic.areasOfStrength.map(s => `  - ${s}`).join('\n')}

Areas Needing Attention:
${report.academic.areasNeedingAttention.map(a => `  - ${a}`).join('\n')}

=== WELL-BEING ===
Average Mood: ${report.wellbeing.averageMood}
Average Stress Level: ${report.wellbeing.averageStressLevel}/10
Mood Trend: ${moodAnalysis.trend}

${report.wellbeing.concerningPatterns && report.wellbeing.concerningPatterns.length > 0 ? `Concerning Patterns:\n${report.wellbeing.concerningPatterns.map(p => `  - ${p}`).join('\n')}` : ''}

Positive Indicators:
${report.wellbeing.positiveIndicators.map(p => `  - ${p}`).join('\n')}

=== PHYSICAL HEALTH ===
Activity Level: ${report.physical.activityLevel.toUpperCase()}
Regular Sports Participation: ${report.physical.regularParticipation ? 'Yes' : 'No'}
Sports Activities: ${profile.sportsActivities.join(', ') || 'None'}

=== RECOMMENDATIONS ===
${report.wellbeing.recommendations.map(r => `  - ${r}`).join('\n')}

=== KEY INSIGHTS ===
Strengths:
${report.insights.strengths.map(s => `  - ${s}`).join('\n')}

Growth Areas:
${report.insights.growthAreas.map(g => `  - ${g}`).join('\n')}

---
This report was generated by the Student-Mentor AI system.
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name}_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getProgressColor = (progress: string) => {
    if (progress === 'excellent') return 'text-green-400';
    if (progress === 'good') return 'text-sky-400';
    if (progress === 'satisfactory') return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-purple-600 p-6 rounded-t-2xl flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">Student Progress Report</h1>
            <p className="text-sky-100 mt-1">
              {new Date(report.reportPeriod.startDate).toLocaleDateString()} - {new Date(report.reportPeriod.endDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Student Info */}
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Student Information</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[var(--text-muted)]">Name</p>
                <p className="text-[var(--text-primary)] font-medium">{report.studentName}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Grade</p>
                <p className="text-[var(--text-primary)] font-medium">{profile.grade}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Age</p>
                <p className="text-white font-medium">{profile.age} years</p>
              </div>
            </div>
          </div>

          {/* Academic Performance */}
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">📚 Academic Performance</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Overall Progress</p>
                  <p className={`text-xl font-bold capitalize ${getProgressColor(report.academic.overallProgress)}`}>
                    {report.academic.overallProgress}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Homework Completion</p>
                  <p className="text-xl font-bold text-[var(--text-primary)]">{report.academic.homeworkCompletionRate}%</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Average Study Hours</p>
                  <p className="text-xl font-bold text-[var(--text-primary)]">{report.academic.studyHoursAverage}h/day</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Attendance Rate</p>
                  <p className="text-xl font-bold text-[var(--text-primary)]">{academicMetrics.attendanceRate}%</p>
                </div>
              </div>

              <div>
                <p className="text-[var(--text-primary)] font-medium mb-2">Subject Performance</p>
                <div className="grid md:grid-cols-2 gap-2">
                  {Object.entries(report.academic.subjectPerformance).map(([subject, performance]) => (
                    <div key={subject} className="bg-[var(--bg-tertiary)] rounded p-2 flex justify-between items-center">
                      <span className="text-[var(--text-primary)] text-sm">{subject}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        performance.includes('Strong') ? 'bg-green-100 text-green-800' :
                        performance.includes('Moderate') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {performance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {report.academic.areasOfStrength.length > 0 && (
                <div>
                  <p className="text-green-700 font-medium mb-2">✓ Areas of Strength</p>
                  <ul className="space-y-1">
                    {report.academic.areasOfStrength.map((strength, idx) => (
                      <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.academic.areasNeedingAttention.length > 0 && (
                <div>
                  <p className="text-orange-700 font-medium mb-2">⚠ Areas Needing Attention</p>
                  <ul className="space-y-1">
                    {report.academic.areasNeedingAttention.map((area, idx) => (
                      <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                        <span className="text-orange-600">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Well-being */}
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">💚 Mental & Emotional Well-being</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Average Mood</p>
                  <p className="text-lg font-bold text-[var(--text-primary)] capitalize">{report.wellbeing.averageMood}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Stress Level</p>
                  <p className="text-lg font-bold text-orange-600">{report.wellbeing.averageStressLevel}/10</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Trend</p>
                  <p className={`text-lg font-bold capitalize ${getTrendColor(moodAnalysis.trend)}`}>
                    {moodAnalysis.trend}
                  </p>
                </div>
              </div>

              {report.wellbeing.concerningPatterns && report.wellbeing.concerningPatterns.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-700 font-medium mb-2">⚠️ Concerning Patterns</p>
                  <ul className="space-y-1">
                    {report.wellbeing.concerningPatterns.map((pattern, idx) => (
                      <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                        <span>•</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-green-700 font-medium mb-2">✓ Positive Indicators</p>
                <ul className="space-y-1">
                  {report.wellbeing.positiveIndicators.map((indicator, idx) => (
                    <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Physical Health */}
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">🏃 Physical Health & Sports</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-[var(--text-muted)] text-sm">Activity Level</p>
                <p className="text-lg font-bold text-[var(--text-primary)] capitalize">{report.physical.activityLevel}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-sm">Avg Daily Activity</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{avgPhysicalActivity} min</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-sm">Sports Participation</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{report.physical.regularParticipation ? 'Yes' : 'No'}</p>
              </div>
            </div>
            {profile.sportsActivities.length > 0 && (
              <div className="mt-3">
                <p className="text-[var(--text-muted)] text-sm">Activities</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.sportsActivities.map((sport, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {sport}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-sky-800 mb-3">💡 Recommendations for Support</h2>
            <ul className="space-y-2">
              {report.wellbeing.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-sky-600 font-bold">{idx + 1}.</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Insights */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-purple-800 mb-3">🎯 Key Insights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-green-700 font-medium mb-2">Strengths</p>
                <ul className="space-y-1">
                  {report.insights.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-orange-700 font-medium mb-2">Growth Areas</p>
                <ul className="space-y-1">
                  {report.insights.growthAreas.map((area, idx) => (
                    <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                      <span className="text-orange-600">→</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-xs text-[var(--text-muted)] text-center">
            Report generated on {new Date(report.generatedAt).toLocaleString()} by Student-Mentor AI System
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-700 p-4 rounded-b-2xl flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 py-2 px-4 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Report
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherReport;

import React, { useState } from 'react';
import { Test } from '@/types';

const FILTER_TABS = [
  { id: 'upcoming', label: 'Upcoming', icon: '🔜' },
  { id: 'today', label: 'Today', icon: '⚡' },
  { id: 'week', label: 'This Week', icon: '📅' },
  { id: 'all', label: 'All', icon: '📚' },
] as const;

type FilterValue = (typeof FILTER_TABS)[number]['id'];

interface TestsListProps {
  studentId: string;
  tests: Test[];
  onUpdate: (tests: Test[]) => void;
}

export default function TestsList({ studentId: _studentId, tests, onUpdate }: TestsListProps) {
  const [filter, setFilter] = useState<FilterValue>('upcoming');
  
  const updatePreparationStatus = (id: string, status: Test['preparationStatus']) => {
    const updated = tests.map(test => 
      test.id === id ? { ...test, preparationStatus: status } : test
    );
    onUpdate(updated);
  };

  const addNote = (id: string, note: string) => {
    const updated = tests.map(test => 
      test.id === id ? { ...test, notes: note } : test
    );
    onUpdate(updated);
  };

  const getFilteredTests = () => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return tests.filter(test => {
      const testDate = new Date(test.testDate);
      if (filter === 'all') return true;
      if (filter === 'upcoming') return testDate > now;
      if (filter === 'today') return testDate <= todayEnd && testDate >= now;
      if (filter === 'week') return testDate <= weekEnd && testDate >= now;
      return true;
    }).sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
  };

  const filteredTests = getFilteredTests();

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'board-exam': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'final': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'midterm': return 'bg-accent-amber/20 text-yellow-300 border-accent-amber/30';
      case 'unit-test': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'quiz': return 'bg-accent-green/20 text-accent-green border-accent-green/30';
      default: return 'bg-slate-600/20 text-slate-300 border-slate-600/30';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'board-exam': return '🎓';
      case 'final': return '📊';
      case 'midterm': return '📝';
      case 'unit-test': return '📄';
      case 'quiz': return '✏️';
      default: return '📋';
    }
  };

  const getPreparationColor = (status: string) => {
    switch (status) {
      case 'well-prepared': return 'bg-accent-green';
      case 'in-progress': return 'bg-accent-amber';
      case 'not-started': return 'bg-red-500';
      default: return 'bg-slate-600';
    }
  };

  const getDaysUntilTest = (testDate: string) => {
    const days = Math.ceil((new Date(testDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Completed';
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-hero-mobile md:text-section-title font-bold text-white">📝 Upcoming Tests & Exams</h2>
          <p className="text-body-sm text-muted-ink mt-1">Stay prepared for your assessments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-panel p-4 rounded-2xl shadow-card border border-card-border">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-body-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-discrete-highlight ${
              filter === tab.id 
                ? 'bg-gradient-to-r from-primary-from to-primary-to text-white shadow-card' 
                : 'bg-panel-elevated text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tests List */}
      <div className="grid gap-4">
        {filteredTests.length === 0 ? (
          <div className="bg-panel rounded-2xl p-12 text-center shadow-card border border-card-border">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-section-title font-semibold text-white mb-2">No tests {filter !== 'all' ? filter : 'scheduled'}</h3>
            <p className="text-body text-muted-ink">Enjoy your study time!</p>
          </div>
        ) : (
          filteredTests.map(test => {
            const daysUntil = getDaysUntilTest(test.testDate);
            const isUrgent = new Date(test.testDate).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
            
            return (
              <div
                key={test.id}
                className={`bg-panel rounded-2xl p-6 shadow-card border border-card-border border-l-4 transition-all duration-200 hover:shadow-card-hover ${
                  isUrgent ? 'border-l-red-500' : 'border-l-primary-to'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getImportanceIcon(test.importance)}</span>
                      <div>
                        <h3 className="text-body font-bold text-white">{test.title}</h3>
                        <p className="text-body-sm text-muted-ink">{test.subject} • {test.teacherName}</p>
                      </div>
                    </div>
                    {test.description && (
                      <p className="text-body-sm text-slate-300 mt-2">{test.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-micro font-semibold border ${getImportanceColor(test.importance)}`}>
                      {test.importance.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className={`px-4 py-2 rounded-xl text-body-sm font-bold ${
                      isUrgent ? 'bg-red-500/20 text-red-300' : 'bg-primary-to/20 text-primary-to'
                    }`}>
                      {daysUntil}
                    </span>
                  </div>
                </div>

                {/* Test Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-body-sm font-medium text-muted-ink mb-2">📅 Test Date & Time</p>
                    <p className="text-white text-body-sm">
                      {new Date(test.testDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {test.duration && (
                      <p className="text-body-sm text-muted-ink mt-1">Duration: {test.duration} minutes</p>
                    )}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-muted-ink mb-2">📚 Syllabus Coverage</p>
                    <div className="flex flex-wrap gap-1">
                      {test.syllabus.map((topic, idx) => (
                        <span key={idx} className="px-2 py-1 bg-primary-to/20 text-primary-to rounded text-micro">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preparation Status */}
                <div className="mb-4">
                  <p className="text-body-sm font-medium text-muted-ink mb-2">Preparation Status</p>
                  <div className="flex gap-2">
                    {(['not-started', 'in-progress', 'well-prepared'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => updatePreparationStatus(test.id, status)}
                        className={`flex-1 px-4 py-2 rounded-xl text-body-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-discrete-highlight ${
                          test.preparationStatus === status
                            ? 'bg-gradient-to-r from-primary-from to-primary-to text-white shadow-card'
                            : 'bg-panel-elevated text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full inline-block mr-2 ${getPreparationColor(status)}`}></div>
                        {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Study Materials */}
                {test.studyMaterials && test.studyMaterials.length > 0 && (
                  <div className="mb-4">
                    <p className="text-body-sm font-medium text-muted-ink mb-2">📖 Study Materials</p>
                    <ul className="list-disc list-inside space-y-1 text-body-sm text-slate-300">
                      {test.studyMaterials.map((material, idx) => (
                        <li key={idx}>{material}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <p className="text-body-sm font-medium text-muted-ink mb-2">📝 Your Notes</p>
                  <textarea
                    value={test.notes || ''}
                    onChange={(e) => addNote(test.id, e.target.value)}
                    placeholder="Add your preparation notes, questions, or reminders..."
                    rows={2}
                    className="w-full px-3 py-2 bg-panel-elevated border border-card-border text-white placeholder-muted-ink rounded-xl text-body-sm focus:outline-none focus:ring-2 focus:ring-discrete-highlight"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

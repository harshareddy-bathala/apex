import React, { useMemo, useState } from 'react';
import { HeroCard } from './HeroCard';
import { ActionBar } from './ActionBar';
import { TodayPanel } from './TodayPanel';
import { DeadlinesCard } from './DeadlinesCard';
import { ActivitiesFeed } from './ActivitiesFeed';
import { MentorCTA } from './MentorCTA';
import { ChatDrawer } from '@/features/chat/components/ChatDrawer';
import CommunityActivityCard from './CommunityActivityCard';
import HabitsCard from './HabitsCard';
import type { ChatMessage, Homework } from '@/types';

type FocusTask = {
	id: string;
	homeworkId?: string;
	title: string;
	subject: string;
	timeEstimate: string;
	completed: boolean;
	priority: 'low' | 'medium' | 'high';
	status?: Homework['status'];
};

type Deadline = {
	id: string;
	title: string;
	subject: string;
	dueDate: string;
	daysLeft: number;
	priority: 'low' | 'medium' | 'high';
};

type Activity = {
	id: string;
	category: 'academic' | 'wellness' | 'sports';
	text: string;
	time: string;
	icon: string;
};

interface StudentData {
	id: string;
	name: string;
	firstName: string;
	grade: string;
	subjects: Array<{ id: string; name: string }>;
	avgStudyHours: number;
	weeklyStudy: number[];
	homeworkCompletionPercent: number;
	attendancePercent: number;
	energyLevel: string;
	overallProgressPercent: number;
	energyTrend: number[];
	attendanceTrend: number[];
	todaysFocus: FocusTask[];
	upcomingDeadlines: Deadline[];
	recentActivities: Activity[];
	goals: Array<{ id: string; title: string }>;
	habits: Array<{
		id: string;
		name: string;
		timeOfDay: 'morning' | 'afternoon' | 'evening';
		completedToday: boolean;
	}>;
	communityActivity: Array<{
		id: string;
		authorName: string;
		subject?: string;
		content: string;
		createdAt: string;
		upvoteCount: number;
		replyCount: number;
	}>;
}

interface Props {
	studentData: StudentData;
	onOpenChat?: () => void;
	onAddGoal?: () => void;
	onViewTasks?: () => void;
	onExportReport?: () => void;
	onToggleTeacherMode?: () => void;
	onTaskStatusChange?: (homeworkId: string, status: Homework['status']) => Promise<void> | void;
	onHabitToggle?: (habitId: string, completed: boolean) => Promise<void> | void;
	onHabitCreate?: (name: string, timeOfDay: 'morning' | 'afternoon' | 'evening') => Promise<void> | void;
}

const DashboardContent: React.FC<Props> = ({
	studentData,
	onOpenChat,
	onAddGoal,
	onViewTasks,
	onToggleTeacherMode,
	onExportReport,
	onTaskStatusChange,
	onHabitToggle,
	onHabitCreate,
}) => {
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const [isChatLoading, setIsChatLoading] = useState(false);
	const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
	const [habitName, setHabitName] = useState('');
	const [habitTimeOfDay, setHabitTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
	const [habitSaving, setHabitSaving] = useState(false);

	const contextBullets = useMemo(() => {
		const pendingTasks = studentData.todaysFocus.filter((task) => !task.completed).length;
		const completedHabits = studentData.habits.filter((habit) => habit.completedToday).length;
		return [
			`${pendingTasks} focus tasks remaining today`,
			`${completedHabits}/${studentData.habits.length || 0} habits completed`,
			`Energy level: ${studentData.energyLevel}`,
			`Attendance: ${studentData.attendancePercent}%`,
		];
	}, [studentData.attendancePercent, studentData.energyLevel, studentData.todaysFocus, studentData.habits]);

	const suggestedPrompts = useMemo(
		() => [
			`Give ${studentData.firstName} a pep talk for ${studentData.subjects?.[0]?.name ?? 'today'}.`,
			'Summarize my progress this week.',
			'What should I focus on next?',
		],
		[studentData.firstName, studentData.subjects],
	);

	const handleOpenChat = () => {
		setIsChatOpen(true);
		onOpenChat?.();
	};

	const handleCloseChat = () => setIsChatOpen(false);

	const handleSendChatMessage = (message: string) => {
		const userMessage: ChatMessage = {
			id: `u-${Date.now()}`,
			role: 'user',
			content: message,
			timestamp: new Date().toISOString(),
		};
		setChatMessages((prev) => [...prev, userMessage]);
		setIsChatLoading(true);
		setTimeout(() => {
			setChatMessages((prev) => [
				...prev,
				{
					id: `ai-${Date.now()}`,
					role: 'model',
					content: `Demo reply to "${message}"`,
					timestamp: new Date().toISOString(),
				},
			]);
			setIsChatLoading(false);
		}, 800);
	};

	const handleToggleTask = (taskId: string) => {
		const task = studentData.todaysFocus.find((item) => item.id === taskId);
		if (!task || !task.homeworkId || !onTaskStatusChange) {
			return;
		}

		const nextStatus: Homework['status'] = task.completed ? 'in-progress' : 'completed';
		void onTaskStatusChange(task.homeworkId, nextStatus);
	};

	const handleDeadlineClick = (_deadlineId: string) => {
		onViewTasks?.();
	};

	const handleHabitToggleLocal = (habitId: string, completed: boolean) => {
		onHabitToggle?.(habitId, completed);
	};

	const handleHabitModalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!habitName.trim()) {
			return;
		}
		try {
			setHabitSaving(true);
			await onHabitCreate?.(habitName.trim(), habitTimeOfDay);
			setHabitName('');
			setHabitTimeOfDay('morning');
			setIsHabitModalOpen(false);
		} finally {
			setHabitSaving(false);
		}
	};



	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Dashboard</p>
					<h2 className="text-2xl font-semibold text-[var(--text-primary)]">Today’s premium overview</h2>
				</div>

			</div>

			<HeroCard
				studentName={studentData.firstName}
				grade={studentData.grade}
				subjects={studentData.subjects}
				overallProgress={studentData.overallProgressPercent}
				onProgressClick={onExportReport}
			/>

			<ActionBar
				onAskMentor={handleOpenChat}
				onAddGoal={onAddGoal}
				onViewTasks={onViewTasks}
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="space-y-4 lg:col-span-2">
					<TodayPanel tasks={studentData.todaysFocus} onToggleTask={handleToggleTask} />
					<DeadlinesCard deadlines={studentData.upcomingDeadlines} onDeadlineClick={handleDeadlineClick} />
				</div>
				<HabitsCard
					habits={studentData.habits}
					onToggleHabit={handleHabitToggleLocal}
					onAddHabit={() => setIsHabitModalOpen(true)}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2 space-y-4">
					<ActivitiesFeed activities={studentData.recentActivities} maxItems={5} />
				</div>
				<div className="space-y-4">
					<MentorCTA onOpenChat={handleOpenChat} studentName={studentData.firstName} />
					<CommunityActivityCard posts={studentData.communityActivity} />
				</div>
			</div>

			<ChatDrawer
				isOpen={isChatOpen}
				onClose={handleCloseChat}
				messages={chatMessages}
				isLoading={isChatLoading}
				onSendMessage={handleSendChatMessage}
				suggestedPrompts={suggestedPrompts}
				studentName={studentData.name}
				grade={studentData.grade}
				lastCheckIn={studentData.recentActivities?.[0]?.time}
				contextBullets={contextBullets}
			/>

			{isHabitModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
					<form
						onSubmit={handleHabitModalSubmit}
						className="w-full max-w-md space-y-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-2xl"
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Habit Creator</p>
								<h3 className="text-xl font-semibold text-[var(--text-primary)]">Add a micro-habit</h3>
							</div>
							<button
								type="button"
								onClick={() => setIsHabitModalOpen(false)}
								className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-lg leading-none text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
								aria-label="Close habit creator"
							>
								×
							</button>
						</div>
						<label className="text-sm font-medium text-[var(--text-secondary)]">
							Habit name
							<input
								type="text"
								value={habitName}
								onChange={(event) => setHabitName(event.target.value)}
								placeholder="e.g., Practice piano"
								className="mt-1 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
							/>
						</label>
						<label className="text-sm font-medium text-[var(--text-secondary)]">
							Time of day
							<select
								value={habitTimeOfDay}
								onChange={(event) => setHabitTimeOfDay(event.target.value as 'morning' | 'afternoon' | 'evening')}
								className="mt-1 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
							>
								<option value="morning">Morning</option>
								<option value="afternoon">Afternoon</option>
								<option value="evening">Evening</option>
							</select>
						</label>
						<div className="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setIsHabitModalOpen(false)}
								className="rounded-2xl border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
								disabled={habitSaving}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={habitSaving || !habitName.trim()}
								className="rounded-2xl bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
							>
								{habitSaving ? 'Saving…' : 'Add habit'}
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
};

export default DashboardContent;


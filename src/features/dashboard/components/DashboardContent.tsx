import React, { useMemo, useState } from 'react';
import { HeroCard } from './HeroCard';
import { ActionBar } from './ActionBar';
import { TodayPanel } from './TodayPanel';
import { DeadlinesCard } from './DeadlinesCard';
import { ActivitiesFeed } from './ActivitiesFeed';
import { MentorCTA } from './MentorCTA';
import { ChatDrawer } from '@/features/chat/components/ChatDrawer';
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
}

interface Props {
	studentData: StudentData;
	onOpenChat?: () => void;
	onAddGoal?: () => void;
	onViewTasks?: () => void;
	onExportReport?: () => void;
	onToggleTeacherMode?: () => void;
	onTaskStatusChange?: (homeworkId: string, status: Homework['status']) => Promise<void> | void;
}

const DashboardContent: React.FC<Props> = ({
	studentData,
	onOpenChat,
	onAddGoal,
	onViewTasks,
	onToggleTeacherMode,
	onExportReport,
	onTaskStatusChange,
}) => {
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const [isChatLoading, setIsChatLoading] = useState(false);

	const contextBullets = useMemo(() => {
		const pendingTasks = studentData.todaysFocus.filter((task) => !task.completed).length;
		return [
			`${pendingTasks} focus tasks remaining today`,
			`Energy level: ${studentData.energyLevel}`,
			`Attendance: ${studentData.attendancePercent}%`,
		];
	}, [studentData.attendancePercent, studentData.energyLevel, studentData.todaysFocus]);

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

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-white/50">Dashboard</p>
					<h2 className="text-2xl font-semibold text-white/90">Today’s premium overview</h2>
				</div>
				<button type="button" onClick={() => onToggleTeacherMode?.()} className="text-sm text-white/60 hover:text-white">
					Toggle teacher view
				</button>
			</div>

			<HeroCard
				studentName={studentData.firstName}
				grade={studentData.grade}
				subjects={studentData.subjects}
				overallProgress={studentData.overallProgressPercent}
				onProgressClick={onExportReport ?? (() => {})}
			/>

			<ActionBar
				onAskMentor={handleOpenChat}
				onAddGoal={onAddGoal ?? (() => {})}
				onViewTasks={onViewTasks ?? (() => {})}
			/>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TodayPanel tasks={studentData.todaysFocus} onToggleTask={handleToggleTask} />
				<DeadlinesCard deadlines={studentData.upcomingDeadlines} onDeadlineClick={handleDeadlineClick} />
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="md:col-span-2">
					<ActivitiesFeed activities={studentData.recentActivities} maxItems={5} />
				</div>
				<div>
					<MentorCTA onOpenChat={handleOpenChat} studentName={studentData.firstName} />
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
		</div>
	);
};

export default DashboardContent;


import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HabitSummary {
	id: string;
	name: string;
	timeOfDay: 'morning' | 'afternoon' | 'evening';
	completedToday: boolean;
}

interface HabitsCardProps {
	habits: HabitSummary[];
	onToggleHabit?: (habitId: string, completed: boolean) => void;
	onAddHabit: () => void;
}

const timeBadges: Record<HabitSummary['timeOfDay'], string> = {
	morning: 'bg-amber-100/50 text-amber-700 border-amber-200/60',
	afternoon: 'bg-sky-100/40 text-sky-700 border-sky-200/60',
	evening: 'bg-violet-100/40 text-violet-700 border-violet-200/60',
};

const HabitsCard: React.FC<HabitsCardProps> = ({ habits }) => {
	const completedToday = habits.filter(h => h.completedToday).length;
	const completionRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

	return (
		<Link to="/habits" className="block h-full">
			<article className="glass-panel flex h-full flex-col rounded-3xl border border-[var(--border-subtle)] hover:border-[var(--border-color)] transition-colors cursor-pointer">
				<header className="flex items-center justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Daily habits</p>
						<h3 className="text-lg font-semibold text-[var(--text-primary)]">Micro habits tracker</h3>
					</div>
					<ArrowRight size={18} className="text-[var(--text-muted)]" />
				</header>

				<div className="mt-4 flex-1 flex flex-col justify-center">
					{habits.length === 0 ? (
						<div className="text-center">
							<p className="text-sm text-[var(--text-secondary)] mb-3">No habits yet</p>
							<p className="text-xs text-[var(--text-muted)]">Build consistency with small daily wins</p>
						</div>
					) : (
						<div className="text-center">
							<div className="flex items-center justify-center gap-2 mb-2">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-success)]/10 text-[var(--accent-success)]">
									<CheckCircle2 size={24} />
								</div>
								<div>
									<p className="text-2xl font-bold text-[var(--text-primary)]">
										{completedToday}/{habits.length}
									</p>
									<p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
										Done today
									</p>
								</div>
							</div>
							<div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mb-2">
								<div
									className="bg-[var(--accent-success)] h-2 rounded-full transition-all duration-300"
									style={{ width: `${completionRate}%` }}
								></div>
							</div>
							<p className="text-sm text-[var(--text-secondary)]">
								{completionRate}% completion rate
							</p>
						</div>
					)}
				</div>

				<div className="mt-4 text-center">
					<p className="text-xs text-[var(--text-muted)]">
						{habits.length === 0 ? 'Create your first habit →' : 'Manage habits →'}
					</p>
				</div>
			</article>
		</Link>
	);
};

export default HabitsCard;


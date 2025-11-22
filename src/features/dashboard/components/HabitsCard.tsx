import React from 'react';
import { CheckCircle2, Circle, Plus } from 'lucide-react';

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

const HabitsCard: React.FC<HabitsCardProps> = ({ habits, onToggleHabit, onAddHabit }) => {
	return (
		<article className="glass-panel flex h-full flex-col rounded-3xl border border-[var(--border-subtle)]">
			<header className="flex items-center justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Daily habits</p>
					<h3 className="text-lg font-semibold text-[var(--text-primary)]">Micro habits tracker</h3>
				</div>
				<button
					type="button"
					onClick={onAddHabit}
					className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-color)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
				>
					<Plus size={16} />
					Add
				</button>
			</header>
			<div className="mt-4 space-y-3">
				{habits.length === 0 ? (
					<p className="text-sm text-[var(--text-secondary)]">No habits yet. Start with one micro commitment.</p>
				) : (
					habits.map((habit) => (
						<button
							type="button"
							key={habit.id}
							onClick={() => onToggleHabit?.(habit.id, !habit.completedToday)}
							className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-left transition hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/60"
						>
							<span
								className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
									habit.completedToday
										? 'bg-[var(--accent-success)]/15 text-[var(--accent-success)] border border-[var(--accent-success)]/40'
										: 'border border-[var(--border-color)] text-[var(--text-muted)]'
								}`}
							>
								{habit.completedToday ? <CheckCircle2 size={18} /> : <Circle size={16} />}
							</span>
							<div className="flex-1">
								<p className="text-sm font-semibold text-[var(--text-primary)]">{habit.name}</p>
								<span
									className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${timeBadges[habit.timeOfDay]}`}
								>
									{habit.timeOfDay}
								</span>
							</div>
						</button>
					))
				)}
			</div>
		</article>
	);
};

export default HabitsCard;


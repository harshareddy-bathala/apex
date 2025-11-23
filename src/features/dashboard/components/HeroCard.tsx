/**
 * HeroCard Component
 * 
 * Top banner with gradient background featuring:
 * - Personalized greeting
 * - Student info pills (grade, subjects)
 * - Overall progress ring (right side)
 * 
 * Updated: Uses new premium design system colors, refined spacing, and Framer Motion animations
 * 
 * Accessibility: Semantic heading structure, clickable progress ring with aria-label
 * Animation: Fade-in-up on mount (respects prefers-reduced-motion)
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ProgressRing } from './Sparkline';

interface HeroCardProps {
  studentName: string;
  grade: string;
  subjects: Array<{ id: string; name: string }>;
  overallProgress: number;
  onProgressClick?: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  studentName,
  grade,
  subjects,
  overallProgress,
  onProgressClick
}) => {
  const shouldReduceMotion = useReducedMotion();
  const safeProgress = Math.min(100, Math.max(0, overallProgress));
  const progressInteractive = typeof onProgressClick === 'function';

  return (
    <motion.div
      className="relative overflow-hidden rounded-[28px] bg-[var(--bg-card)] p-6 md:p-8 border border-[var(--border-color)] shadow-[0_25px_80px_rgba(0,0,0,0.1)]"
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Decorative gradient overlays for depth */}
      <div className="absolute top-[-40%] right-[-10%] w-72 h-72 bg-[var(--accent-primary)]/20 rounded-full blur-[140px]"></div>
      <div className="absolute bottom-[-20%] left-[-5%] w-64 h-64 bg-[var(--accent-secondary)]/15 rounded-full blur-[120px]"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left side: Greeting and info */}
        <div className="flex-1">
          <h1
            className="text-[1.75rem] leading-tight md:text-[2.2rem] text-[var(--text-primary)] mb-3 font-semibold"
            style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}
          >
            Welcome back, {studentName}! 👋
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base mb-5">
            Your personalized growth cockpit · stay consistent and celebrate small wins.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--bg-secondary)]/60 text-[var(--text-primary)] text-xs tracking-wide">
              {grade}
            </span>
            {subjects.slice(0, 3).map((subject) => (
              <span
                key={subject.id}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs"
              >
                {subject.name}
              </span>
            ))}
            {subjects.length > 3 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] text-micro">
                +{subjects.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Right side: Progress ring */}
        <div className="flex flex-col items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--bg-elevated)]/95 backdrop-blur-md border border-[var(--border-subtle)]">
          <ProgressRing
            percent={safeProgress}
            size={100}
            strokeWidth={8}
            color="var(--accent-primary)"
            label={`Overall weekly progress: ${safeProgress}%`}
            onClick={onProgressClick}
            interactive={progressInteractive}
            disabledTooltip="Coming soon"
          />
          <span className="text-xs uppercase tracking-[0.35em] text-[var(--text-secondary)]">
            Weekly Progress
          </span>
        </div>
      </div>
    </motion.div>
  );
};

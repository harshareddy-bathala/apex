/**
 * StatCard Component
 * 
 * Reusable card for displaying key metrics with:
 * - Icon/emoji
 * - Title and primary metric
 * - Micro-copy (subtitle)
 * - Optional sparkline or mini chart
 * - Chevron for expansion
 * 
 * Updated: Added Framer Motion stagger animations
 * 
 * Accessibility: Button role for interactive cards, aria-labels
 * Animation: Fade-in with stagger delay (respects prefers-reduced-motion)
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkline, MiniBarChart } from './Sparkline';

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: number[]; // Optional sparkline data
  barData?: number[]; // Optional bar chart data
  trendLabel?: string;
  statusColor?: 'green' | 'yellow' | 'red' | 'blue';
  onClick?: () => void;
  changePercent?: number; // e.g., +12 or -5
  delay?: number; // Animation delay for stagger effect
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  trend,
  barData,
  trendLabel,
  statusColor = 'blue',
  onClick,
  changePercent,
  delay = 0
}) => {
  const shouldReduceMotion = useReducedMotion();

  const bgColorClasses = {
    green: 'bg-[#34d399]/15 text-[#34d399] shadow-[0_0_20px_rgba(52,211,153,0.2)]',
    yellow: 'bg-[#facc15]/15 text-[#facc15] shadow-[0_0_20px_rgba(250,204,21,0.15)]',
    red: 'bg-[#fb7185]/15 text-[#fb7185] shadow-[0_0_20px_rgba(251,113,133,0.2)]',
    blue: 'bg-[#22d3ee]/15 text-[#22d3ee] shadow-[0_0_20px_rgba(34,211,238,0.2)]'
  };

  const MotionComponent = motion[onClick ? 'button' : 'div'] as any;

  return (
    <MotionComponent
      onClick={onClick}
      className={`relative glass-card rounded-3xl p-5 shadow-[0_15px_40px_rgba(5,8,20,0.5)] transition-all duration-300 border border-white/5 ${
        onClick ? 'cursor-pointer hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60' : ''
      }`}
      {...(onClick && { type: 'button', 'aria-label': `View details for ${title}` })}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
    >
      {/* Icon badge */}
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ${bgColorClasses[statusColor]} mb-4`}>
        <span className="text-xl">{icon}</span>
      </div>

      {/* Title and value */}
      <h3 className="text-xs uppercase tracking-[0.35em] text-white/50 mb-2">{title}</h3>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-3xl font-semibold text-white">{value}</p>
        {changePercent !== undefined && (
          <span
            className={`text-xs font-medium ${
              changePercent > 0 ? 'text-[#34d399]' : changePercent < 0 ? 'text-[#fb7185]' : 'text-white/50'
            }`}
          >
            {changePercent > 0 ? '↑' : changePercent < 0 ? '↓' : '→'} {Math.abs(changePercent)}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      <p className="text-sm text-white/50 mb-4">{subtitle}</p>

      {/* Trend visualization */}
      {trend && trend.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <Sparkline
            data={trend}
            width={80}
            height={24}
            color={statusColor === 'green' ? '#34d399' : statusColor === 'red' ? '#fb7185' : '#22d3ee'}
            label={trendLabel || `${title} trend over last 7 days`}
          />
          <span className="text-xs text-white/50">7 days</span>
        </div>
      )}

      {/* Bar chart */}
      {barData && barData.length > 0 && (
        <div className="flex items-end gap-1 mb-2">
          <MiniBarChart
            data={barData}
            maxHeight={32}
            barWidth={8}
            gap={3}
            color="#22d3ee"
            label={trendLabel || `${title} weekly distribution`}
          />
        </div>
      )}

      {/* Chevron for clickable cards */}
      {onClick && (
        <div className="absolute top-5 right-5 text-white/40">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </MotionComponent>
  );
};

/**
 * CircularStatCard Component
 * 
 * Card variant with circular progress indicator
 */

interface CircularStatCardProps {
  icon: string;
  title: string;
  percent: number;
  subtitle: string;
  statusColor?: 'green' | 'yellow' | 'red' | 'blue';
  onClick?: () => void;
}

export const CircularStatCard: React.FC<CircularStatCardProps> = ({
  icon,
  title,
  percent,
  subtitle,
  statusColor = 'green',
  onClick
}) => {
  const colorMap = {
    green: '#34d399',
    yellow: '#facc15',
    red: '#fb7185',
    blue: '#22d3ee'
  };

  const bgColorClasses = {
    green: 'bg-[#34d399]/15 text-[#34d399]',
    yellow: 'bg-[#facc15]/15 text-[#facc15]',
    red: 'bg-[#fb7185]/15 text-[#fb7185]',
    blue: 'bg-[#22d3ee]/15 text-[#22d3ee]'
  };

  return (
    <button
      onClick={onClick}
      className="relative glass-card rounded-3xl p-5 shadow-[0_15px_40px_rgba(5,8,20,0.5)] transition-all duration-300 cursor-pointer hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/40 text-left w-full border border-white/5"
      type="button"
      aria-label={`View details for ${title}`}
    >
      {/* Icon badge */}
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ${bgColorClasses[statusColor]} mb-4`}>
        <span className="text-xl">{icon}</span>
      </div>

      <h3 className="text-xs uppercase tracking-[0.35em] text-white/50 mb-3">{title}</h3>

      {/* Circular progress */}
      <div className="flex items-center gap-4 mb-3">
        <svg width="60" height="60" className="transform -rotate-90">
          <circle
            cx="30"
            cy="30"
            r="26"
            stroke="#2D3748"
            strokeWidth="5"
            fill="none"
          />
          <circle
            cx="30"
            cy="30"
            r="26"
            stroke={colorMap[statusColor]}
            strokeWidth="5"
            fill="none"
            strokeDasharray={`${(percent / 100) * 163.36} 163.36`}
            strokeLinecap="round"
          />
          <text
            x="30"
            y="30"
            textAnchor="middle"
            dy="7"
            className="text-sm font-bold fill-white transform rotate-90"
            style={{ transform: 'rotate(90deg)', transformOrigin: '30px 30px' }}
          >
            {percent}%
          </text>
        </svg>
        
        <div className="flex-1">
          <p className="text-sm text-white/60">{subtitle}</p>
        </div>
      </div>
    </button>
  );
};

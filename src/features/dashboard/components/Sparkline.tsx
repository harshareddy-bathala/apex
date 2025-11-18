/**
 * Sparkline Component
 * 
 * Lightweight SVG sparkline chart for showing trends.
 * Accessible with aria-label.
 * 
 * Props:
 * - data: number[] - Array of data points
 * - width: number - SVG width (default 60)
 * - height: number - SVG height (default 20)
 * - color: string - Line color (default currentColor)
 * - label: string - Accessible label
 */

import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  label: string;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 60,
  height = 20,
  color = 'currentColor',
  label,
  className = ''
}) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Create SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={label}
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * ProgressRing Component
 * 
 * Circular progress indicator with percentage.
 * 
 * Props:
 * - percent: number - Progress percentage (0-100)
 * - size: number - Ring size (default 80)
 * - strokeWidth: number - Ring thickness (default 6)
 * - color: string - Ring color
 * - label: string - Accessible label
 */

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  onClick?: () => void;
  interactive?: boolean;
  disabledTooltip?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 80,
  strokeWidth = 6,
  color = '#3DD6B8',
  label,
  onClick,
  interactive = true,
  disabledTooltip
}) => {
  const safePercent = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (safePercent / 100) * circumference;
  const isInteractive = interactive && Boolean(onClick);
  const title = !isInteractive ? disabledTooltip ?? 'Coming soon' : undefined;

  return (
    <button
      type="button"
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      aria-disabled={!isInteractive}
      title={title}
      className={`relative focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full transition-transform ${
        isInteractive ? 'hover:scale-105' : 'cursor-not-allowed opacity-80'
      }`}
      aria-label={label}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2D3748"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-white">{Math.round(safePercent)}%</span>
      </div>
    </button>
  );
};

/**
 * MiniBarChart Component
 * 
 * Small bar chart for weekly study hours.
 */

interface MiniBarChartProps {
  data: number[];
  maxHeight?: number;
  barWidth?: number;
  gap?: number;
  color?: string;
  label: string;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  maxHeight = 40,
  barWidth = 6,
  gap = 4,
  color = '#6C4AB6',
  label
}) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data, 1);
  const totalWidth = data.length * (barWidth + gap) - gap;

  return (
    <svg
      width={totalWidth}
      height={maxHeight}
      role="img"
      aria-label={label}
      className="opacity-80"
    >
      {data.map((value, index) => {
        const height = (value / max) * maxHeight;
        const x = index * (barWidth + gap);
        const y = maxHeight - height;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={height}
            fill={color}
            rx={2}
          />
        );
      })}
    </svg>
  );
};

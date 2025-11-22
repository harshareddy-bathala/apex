import React from 'react';

interface FullScreenLoaderProps {
  message?: string;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col items-center justify-center gap-4 font-display">
    <div className="w-14 h-14 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
    <p className="text-[var(--text-secondary)] text-sm">{message}</p>
  </div>
);

export default FullScreenLoader;

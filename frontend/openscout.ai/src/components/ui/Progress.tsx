import React from 'react';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  variant?: 'blue' | 'violet' | 'gradient';
  height?: 'sm' | 'md' | 'lg';
}

export function Progress({
  value,
  className = '',
  variant = 'gradient',
  height = 'md',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, value));

  let heightClass = 'h-2';
  if (height === 'sm') heightClass = 'h-1';
  if (height === 'lg') heightClass = 'h-3';

  let fillClass = '';
  if (variant === 'blue') {
    fillClass = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
  } else if (variant === 'violet') {
    fillClass = 'bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]';
  } else if (variant === 'gradient') {
    fillClass = 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.3)]';
  }

  return (
    <div className={`w-full bg-slate-950/70 border border-white/5 rounded-full overflow-hidden ${heightClass} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${fillClass}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

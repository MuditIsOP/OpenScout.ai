import React from 'react';
import { Progress } from '../ui/Progress';

interface ConfidenceBarProps {
  score: number;
}

export function ConfidenceBar({ score }: ConfidenceBarProps) {
  let colorClass = 'text-emerald-400';
  let label = 'Strong Profile Match';
  
  if (score < 50) {
    colorClass = 'text-rose-400';
    label = 'Limited Data / Low Match';
  } else if (score < 75) {
    colorClass = 'text-amber-400';
    label = 'Moderate Profile Match';
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400 font-medium">Profile Confidence</span>
        <span className={`font-mono font-bold ${colorClass}`}>{score}%</span>
      </div>
      <Progress value={score} variant="gradient" height="sm" />
      <span className="block text-[10px] text-slate-500 font-medium tracking-wide">
        {label}
      </span>
    </div>
  );
}

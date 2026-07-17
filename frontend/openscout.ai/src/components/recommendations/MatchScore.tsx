import React from 'react';
import { Sparkles } from 'lucide-react';

interface MatchScoreProps {
  score: number;
}

export function MatchScore({ score }: MatchScoreProps) {
  let textClass = 'text-blue-400 border-blue-500/20 bg-blue-500/5';
  let glowClass = 'shadow-[0_0_15px_rgba(59,130,246,0.25)]';
  
  if (score >= 90) {
    textClass = 'text-purple-400 border-purple-500/35 bg-purple-500/10';
    glowClass = 'shadow-[0_0_20px_rgba(139,92,246,0.35)]';
  } else if (score < 75) {
    textClass = 'text-slate-400 border-slate-700 bg-slate-800/20';
    glowClass = '';
  }

  return (
    <div className={`relative inline-flex items-center gap-1 px-3 py-1.5 border rounded-full font-mono text-xs font-bold uppercase tracking-wider select-none ${textClass} ${glowClass}`}>
      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
      <span>{score}% Match</span>
    </div>
  );
}

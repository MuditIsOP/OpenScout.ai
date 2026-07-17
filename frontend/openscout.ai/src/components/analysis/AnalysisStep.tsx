import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { ProfileAnalysisStep } from '../../types';

interface AnalysisStepProps {
  step: ProfileAnalysisStep;
  key?: React.Key;
}

export function AnalysisStep({ step }: AnalysisStepProps) {
  const { status, label, description } = step;

  let icon = <Circle className="w-5 h-5 text-slate-600" />;
  let cardClass = 'border-slate-800/40 bg-slate-950/20 text-slate-500';
  let labelClass = 'text-slate-400';

  if (status === 'active') {
    icon = <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    cardClass = 'border-blue-500/30 bg-blue-500/5 text-slate-200 shadow-[0_0_15px_rgba(59,130,246,0.05)]';
    labelClass = 'text-blue-100 font-semibold';
  } else if (status === 'completed') {
    icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    cardClass = 'border-emerald-500/20 bg-emerald-500/2 text-slate-300';
    labelClass = 'text-slate-200';
  } else if (status === 'failed') {
    icon = <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />;
    cardClass = 'border-rose-500/30 bg-rose-500/5 text-slate-200';
    labelClass = 'text-rose-200 font-semibold';
  }

  return (
    <div className={`p-4 border rounded-xl flex items-start gap-4 transition-all duration-300 ${cardClass}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm tracking-wide font-display ${labelClass}`}>{label}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

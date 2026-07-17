import React from 'react';
import { Check } from 'lucide-react';

interface RecommendationReasonsProps {
  reasons: string[];
}

export function RecommendationReasons({ reasons }: RecommendationReasonsProps) {
  return (
    <div className="bg-slate-950/50 border border-slate-900/60 rounded-xl p-4 space-y-3">
      <h5 className="text-xs font-semibold text-purple-400 font-display uppercase tracking-widest">
        Why this matches you:
      </h5>
      <ul className="space-y-2">
        {reasons.map((reason, index) => (
          <li key={index} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
            <div className="mt-0.5 shrink-0 bg-purple-500/10 border border-purple-500/20 rounded p-0.5">
              <Check className="w-3 h-3 text-purple-400" />
            </div>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import React from 'react';
import { ProfileAnalysisStep } from '../../types';
import { AnalysisStep } from './AnalysisStep';

interface AnalysisProgressProps {
  steps: ProfileAnalysisStep[];
}

export function AnalysisProgress({ steps }: AnalysisProgressProps) {
  return (
    <div className="relative flex flex-col gap-3">
      {/* Connector line behind steps */}
      <div className="absolute left-[25px] top-6 bottom-6 w-0.5 bg-slate-800/60 -z-10" />
      
      {steps.map((step) => (
        <AnalysisStep key={step.id} step={step} />
      ))}
    </div>
  );
}

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { HelpCircle, RefreshCw, Sliders } from 'lucide-react';

interface EmptyStateProps {
  onUpdatePreferences: () => void;
  onGenerateAgain: () => void;
  onReanalyze: () => void;
  isGenerating?: boolean;
}

export function EmptyState({
  onUpdatePreferences,
  onGenerateAgain,
  onReanalyze,
  isGenerating = false,
}: EmptyStateProps) {
  return (
    <Card variant="default" className="text-center p-12 border-slate-900 bg-slate-950/20 max-w-xl mx-auto my-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full" />
      
      <div className="relative z-10 space-y-6">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-purple-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold font-display text-white tracking-wide">
            We could not find strong repository matches yet.
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Try broadening your preferred languages or frameworks to receive a wider range of tailored open-source recommendations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
          <Button variant="primary" size="sm" className="flex gap-1.5" onClick={onUpdatePreferences}>
            <Sliders className="w-4 h-4" />
            <span>Update Preferences</span>
          </Button>

          <Button
            variant="glass"
            size="sm"
            className="flex gap-1.5"
            onClick={onGenerateAgain}
            isLoading={isGenerating}
          >
            {!isGenerating && <RefreshCw className="w-4 h-4 text-slate-400" />}
            <span>Generate Again</span>
          </Button>

          <Button variant="outline" size="sm" className="flex gap-1.5" onClick={onReanalyze}>
            <span>Re-analyze GitHub</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

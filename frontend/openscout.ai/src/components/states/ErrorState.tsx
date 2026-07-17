import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle, RefreshCw, Sliders } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
  onManualPreferences: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  message = 'We were unable to generate recommendations.',
  onRetry,
  onManualPreferences,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <Card variant="default" className="text-center p-12 border-rose-950 bg-rose-950/5 max-w-xl mx-auto my-6">
      <div className="space-y-6">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold font-display text-white tracking-wide">
            Something Went Wrong
          </h3>
          <p className="text-xs text-rose-300 max-w-sm mx-auto leading-relaxed">
            {message} Please verify your connection or choose manual setup below.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
          <Button
            variant="primary"
            size="sm"
            className="flex gap-1.5"
            onClick={onRetry}
            isLoading={isRetrying}
          >
            {!isRetrying && <RefreshCw className="w-4 h-4" />}
            <span>Retry Analysis</span>
          </Button>

          <Button variant="outline" size="sm" className="flex gap-1.5" onClick={onManualPreferences}>
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Enter Skills Manually</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

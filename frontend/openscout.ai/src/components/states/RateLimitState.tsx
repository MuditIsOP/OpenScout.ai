import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Clock, RefreshCw } from 'lucide-react';

interface RateLimitStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function RateLimitState({ onRetry, isRetrying = false }: RateLimitStateProps) {
  return (
    <Card variant="default" className="text-center p-12 border-amber-950 bg-amber-950/5 max-w-xl mx-auto my-6">
      <div className="space-y-6">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Clock className="w-6 h-6 text-amber-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold font-display text-white tracking-wide">
            GitHub Rate-Limit Reached
          </h3>
          <p className="text-xs text-amber-300 max-w-sm mx-auto leading-relaxed">
            GitHub temporarily limited profile requests. Please retry shortly. Private or unauthenticated requests are limited to 60 queries/hr.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Button
            variant="primary"
            size="sm"
            className="flex gap-1.5"
            onClick={onRetry}
            isLoading={isRetrying}
          >
            {!isRetrying && <RefreshCw className="w-4 h-4" />}
            <span>Retry Connection Now</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

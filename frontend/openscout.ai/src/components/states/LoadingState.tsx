import React from 'react';
import { Loader2 } from 'lucide-react';
import { RepositoryCardSkeleton } from '../recommendations/RepositoryCardSkeleton';

export function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Visual Header Block */}
      <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-200 font-display">
            Finding repositories matching your skills...
          </h4>
          <p className="text-xs text-slate-500">
            Scanning matches against active GitHub frameworks, licenses, and issue trackers.
          </p>
        </div>
      </div>

      {/* Grid of Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RepositoryCardSkeleton />
        <RepositoryCardSkeleton />
        <RepositoryCardSkeleton />
        <RepositoryCardSkeleton />
      </div>
    </div>
  );
}

import React from 'react';
import { Card } from '../ui/Card';

export function RepositoryCardSkeleton() {
  return (
    <Card variant="default" className="flex flex-col h-full bg-slate-950/20 border-slate-900/60 animate-pulse">
      {/* Top badges */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="h-7 w-24 bg-slate-800/60 rounded-full" />
        <div className="flex gap-1.5">
          <div className="h-6 w-16 bg-slate-800/40 rounded" />
          <div className="h-6 w-16 bg-slate-800/40 rounded" />
        </div>
      </div>

      {/* Repo Title */}
      <div className="space-y-2 mb-4">
        <div className="h-3 w-16 bg-slate-800/30 rounded" />
        <div className="h-5 w-40 bg-slate-800/60 rounded" />
        <div className="h-3 w-full bg-slate-800/30 rounded mt-2" />
        <div className="h-3 w-5/6 bg-slate-800/30 rounded" />
      </div>

      {/* Topics */}
      <div className="flex gap-1.5 mb-6 mt-3">
        <div className="h-5 w-12 bg-slate-800/40 rounded" />
        <div className="h-5 w-12 bg-slate-800/40 rounded" />
        <div className="h-5 w-12 bg-slate-800/40 rounded" />
      </div>

      {/* Mock Grid Stats */}
      <div className="h-14 bg-slate-800/20 border border-slate-900 rounded-xl mb-6" />

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mt-auto">
        <div className="h-9 bg-slate-800/40 rounded-xl" />
        <div className="h-9 bg-slate-800/60 rounded-xl" />
      </div>
    </Card>
  );
}

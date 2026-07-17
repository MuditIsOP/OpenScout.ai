import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { DeveloperProfile } from '../../types';
import { Award, Code, Compass, Zap } from 'lucide-react';

interface AnalysisSummaryProps {
  profile: DeveloperProfile;
}

export function AnalysisSummary({ profile }: AnalysisSummaryProps) {
  return (
    <Card variant="violet" className="border-purple-500/25 bg-purple-950/5 mt-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full" />
      
      <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-widest mb-3">
        <Zap className="w-4 h-4 animate-pulse" />
        Developer Identity Profile Generated
      </div>

      <h3 className="text-xl font-bold font-display text-white mb-6">Profile Snapshot</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Languages Section */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
              <Code className="w-3.5 h-3.5" />
              <span>Top Languages</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.languages.slice(0, 3).map((lang) => (
                <Badge key={lang.name} variant="blue">
                  {lang.name} ({lang.score}%)
                </Badge>
              ))}
            </div>
          </div>

          {/* Frameworks Section */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Detected Frameworks & Tools</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.frameworks.slice(0, 3).map((fw) => (
                <Badge key={fw.name} variant="violet">
                  {fw.name}
                </Badge>
              ))}
              {profile.frameworks.length === 0 && (
                <span className="text-xs text-slate-500 italic">None detected</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Experience level */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Estimated Experience</span>
            </div>
            <span className="text-sm font-semibold text-slate-200 capitalize tracking-wide font-display">
              {profile.experienceLevel} Developer
            </span>
          </div>

          {/* Profile Confidence score */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400">Profile Confidence Score</span>
              <span className={`font-semibold font-mono ${profile.confidenceScore >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {profile.confidenceScore}%
              </span>
            </div>
            <Progress value={profile.confidenceScore} variant="gradient" height="sm" />
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              {profile.confidenceScore >= 50
                ? 'High confidence. Ready to directly load the repository dashboard.'
                : 'Limited public repository activity detected. Manual preferences input is recommended.'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

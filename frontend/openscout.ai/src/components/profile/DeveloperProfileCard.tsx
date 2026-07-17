import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ConfidenceBar } from './ConfidenceBar';
import { SkillBadge } from './SkillBadge';
import { DeveloperProfile } from '../../types';
import { Award, Calendar, ExternalLink, GitFork, RefreshCw, Sliders } from 'lucide-react';

interface DeveloperProfileCardProps {
  profile: DeveloperProfile;
  onReanalyze: () => void;
  onEditSkills: () => void;
  isReanalyzing?: boolean;
}

export function DeveloperProfileCard({
  profile,
  onReanalyze,
  onEditSkills,
  isReanalyzing = false,
}: DeveloperProfileCardProps) {
  // Format analyzed date
  const lastAnalyzedDate = new Date(profile.lastAnalyzedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card variant="default" className="relative overflow-hidden flex flex-col h-full hover:border-slate-700/60 transition-all duration-300">
      {/* Top Banner Glow */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      {/* Profile Header Block */}
      <div className="flex items-start gap-4 mb-6">
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          className="w-16 h-16 rounded-2xl border border-slate-700/60 object-cover shadow-lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold font-display text-white truncate">{profile.name}</h3>
          <p className="text-sm text-slate-400 font-mono truncate">@{profile.githubUsername}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge variant="violet" className="normal-case">
              <Award className="w-3 h-3" />
              <span>{profile.experienceLevel}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="mb-6 bg-slate-950/40 border border-slate-900 rounded-xl p-3.5">
        <ConfidenceBar score={profile.confidenceScore} />
      </div>

      {/* Developer Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs mb-1">
            <GitFork className="w-3.5 h-3.5" />
            <span>Analyzed Repos</span>
          </div>
          <span className="text-lg font-bold font-mono text-slate-200">
            {profile.repositoriesAnalyzed}
          </span>
        </div>
        <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last Scanned</span>
          </div>
          <span className="text-xs font-semibold text-slate-300 block leading-6">
            {lastAnalyzedDate}
          </span>
        </div>
      </div>

      {/* Skill list scroll block */}
      <div className="space-y-4 flex-1 mb-6">
        {/* Languages Section */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 font-display mb-2.5 uppercase tracking-wider">Languages</h4>
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((lang) => (
              <SkillBadge key={lang.name} skill={lang} type="language" />
            ))}
            {profile.languages.length === 0 && (
              <span className="text-xs text-slate-500 italic">No languages added</span>
            )}
          </div>
        </div>

        {/* Frameworks Section */}
        {profile.frameworks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 font-display mb-2.5 uppercase tracking-wider">Frameworks & Tools</h4>
            <div className="flex flex-wrap gap-2">
              {profile.frameworks.map((fw) => (
                <SkillBadge key={fw.name} skill={fw} type="framework" />
              ))}
            </div>
          </div>
        )}

        {/* Interests Section */}
        {profile.interests.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 font-display mb-2.5 uppercase tracking-wider">Interests</h4>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="slate" className="normal-case">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full flex gap-1.5" onClick={onEditSkills}>
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit Skills</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full flex gap-1.5"
            onClick={onReanalyze}
            isLoading={isReanalyzing}
          >
            {!isReanalyzing && <RefreshCw className="w-3.5 h-3.5 text-slate-400" />}
            <span>Re-analyze</span>
          </Button>
        </div>
        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="glass" size="sm" className="w-full flex gap-1.5">
            <span>View GitHub Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>
    </Card>
  );
}

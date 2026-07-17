import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MatchScore } from './MatchScore';
import { RecommendationReasons } from './RecommendationReasons';
import { RepositoryRecommendation } from '../../types';
import { AlertCircle, Calendar, ExternalLink, GitFork, HelpCircle, Star } from 'lucide-react';

interface RepositoryCardProps {
  recommendation: RepositoryRecommendation;
  key?: React.Key;
}

export function RepositoryCard({ recommendation }: RepositoryCardProps) {
  const [showReasons, setShowReasons] = useState(false);

  // Difficulty badge configuration
  let diffVariant: 'green' | 'orange' | 'rose' = 'orange';
  if (recommendation.difficulty === 'beginner') diffVariant = 'green';
  if (recommendation.difficulty === 'challenging') diffVariant = 'rose';

  // Activity badge configuration
  let activityVariant: 'blue' | 'orange' | 'slate' = 'orange';
  if (recommendation.activityLevel === 'high') activityVariant = 'blue';
  if (recommendation.activityLevel === 'low') activityVariant = 'slate';

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const updatedDate = new Date(recommendation.lastUpdatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card
      variant="default"
      hoverGlow
      className="flex flex-col h-full bg-slate-950/25 border border-slate-900/80 hover:border-slate-800 transition-all duration-300 group"
    >
      {/* Top Section: Match score & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <MatchScore score={recommendation.matchScore} />
        
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={diffVariant} outline>
            {recommendation.difficulty}
          </Badge>
          <Badge variant={activityVariant} outline>
            {recommendation.activityLevel} Active
          </Badge>
          {recommendation.beginnerFriendly && (
            <Badge variant="green">Beginner Friendly</Badge>
          )}
          {recommendation.hasGoodFirstIssues && (
            <Badge variant="blue">Good First Issue</Badge>
          )}
        </div>
      </div>

      {/* Repository Title & Desc */}
      <div className="mb-4">
        <span className="text-xs font-mono text-slate-500 block mb-0.5">{recommendation.owner} /</span>
        <h3 className="text-lg font-bold font-display text-white tracking-wide group-hover:text-purple-400 transition-colors">
          {recommendation.name}
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">
          {recommendation.description}
        </p>
      </div>

      {/* Topics */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {recommendation.topics.slice(0, 4).map((topic) => (
          <span key={topic} className="text-[10px] font-mono text-slate-500 bg-slate-950/40 border border-slate-900 px-2 py-0.5 rounded">
            #{topic}
          </span>
        ))}
      </div>

      {/* GitHub Repo stats summary */}
      <div className="grid grid-cols-4 gap-2 bg-slate-950/30 border border-slate-900/60 rounded-xl p-3 text-center mb-5 font-mono text-xs text-slate-400">
        <div>
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Stars</span>
          </div>
          <span className="font-bold text-slate-200">{formatNumber(recommendation.stars)}</span>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <GitFork className="w-3.5 h-3.5 text-blue-400" />
            <span>Forks</span>
          </div>
          <span className="font-bold text-slate-200">{formatNumber(recommendation.forks)}</span>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Issues</span>
          </div>
          <span className="font-bold text-slate-200">{formatNumber(recommendation.openIssues)}</span>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Updated</span>
          </div>
          <span className="font-semibold text-slate-300 block">{updatedDate}</span>
        </div>
      </div>

      {/* Expanded Match Reasons accordion */}
      {showReasons && (
        <div className="mb-5 animate-[fadeIn_0.3s_ease]">
          <RecommendationReasons reasons={recommendation.recommendationReasons} />
        </div>
      )}

      {/* Repo Actions */}
      <div className="grid grid-cols-2 gap-2.5 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="w-full flex gap-1.5"
          onClick={() => setShowReasons(!showReasons)}
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>{showReasons ? 'Hide Alignment' : 'Why This Match?'}</span>
        </Button>

        <a
          href={recommendation.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="primary" size="sm" className="w-full flex gap-1.5">
            <span>View GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>
    </Card>
  );
}

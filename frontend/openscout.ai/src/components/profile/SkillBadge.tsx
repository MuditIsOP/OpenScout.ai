import React from 'react';
import { Badge } from '../ui/Badge';
import { GitBranch, User } from 'lucide-react';
import { SkillItem } from '../../types';

interface SkillBadgeProps {
  skill: SkillItem;
  type: 'language' | 'framework' | 'tool';
  key?: React.Key;
}

export function SkillBadge({ skill, type }: SkillBadgeProps) {
  const badgeColor = type === 'language' ? 'blue' : type === 'framework' ? 'violet' : 'orange';

  return (
    <div className="group relative flex items-center gap-2 bg-slate-950/40 border border-slate-800/60 rounded-xl px-3 py-1.5 hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-300">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-200 tracking-wide">{skill.name}</span>
          <span className="text-[10px] text-slate-500 font-mono">({skill.score}%)</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {skill.source === 'github' ? (
            <>
              <GitBranch className="w-2.5 h-2.5 text-blue-400" />
              <span className="text-[9px] text-blue-400 font-mono tracking-wider uppercase">github</span>
            </>
          ) : (
            <>
              <User className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] text-amber-400 font-mono tracking-wider uppercase">manual</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

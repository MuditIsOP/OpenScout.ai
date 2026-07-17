import React from 'react';
import { Award, Compass, Gauge } from 'lucide-react';

type ExperienceType = 'beginner' | 'intermediate' | 'advanced';

interface ExperienceOption {
  id: ExperienceType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ExperienceSelectorProps {
  value: ExperienceType;
  onChange: (value: ExperienceType) => void;
  error?: string;
}

export function ExperienceSelector({ value, onChange, error }: ExperienceSelectorProps) {
  const options: ExperienceOption[] = [
    {
      id: 'beginner',
      title: 'Beginner',
      description: 'Comfortable with basic programming and looking for guided issues.',
      icon: <Compass className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      description: 'Can understand an existing codebase and implement features independently.',
      icon: <Gauge className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: 'Comfortable with architecture, complex debugging, and large codebases.',
      icon: <Award className="w-5 h-5 text-purple-400" />,
    },
  ];

  return (
    <div className="space-y-2.5">
      <label className="text-xs font-semibold tracking-wide text-slate-300 font-display">
        Experience Level
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col items-start gap-3 cursor-pointer select-none active:scale-98 ${
                isSelected
                  ? 'bg-purple-500/5 border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.06)]'
                  : 'bg-slate-950/25 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl border ${isSelected ? 'bg-purple-500/10 border-purple-500/20' : 'bg-slate-950/40 border-slate-800'}`}>
                {opt.icon}
              </div>
              <div>
                <h4 className={`text-sm font-bold font-display ${isSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                  {opt.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <span className="block text-[11px] font-medium text-rose-400 font-sans">
          {error}
        </span>
      )}
    </div>
  );
}

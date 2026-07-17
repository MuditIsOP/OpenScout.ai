import React from 'react';
import { Sparkles, Trophy, ShieldAlert, Check } from 'lucide-react';

type DifficultyType = 'beginner' | 'moderate' | 'challenging';

interface DifficultySelectorProps {
  selectedValues: DifficultyType[];
  onChange: (values: DifficultyType[]) => void;
  error?: string;
}

export function DifficultySelector({ selectedValues, onChange, error }: DifficultySelectorProps) {
  const options = [
    {
      id: 'beginner' as DifficultyType,
      label: 'Beginner Friendly',
      description: 'Simple documentation cleanups, testing suites, or self-contained bugs.',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      colorClass: 'border-emerald-500/20 text-emerald-300 bg-emerald-500/5',
    },
    {
      id: 'moderate' as DifficultyType,
      label: 'Moderate',
      description: 'Minor features, styling overhauls, or mid-level state debugging tasks.',
      icon: <Trophy className="w-4 h-4 text-blue-400" />,
      colorClass: 'border-blue-500/20 text-blue-300 bg-blue-500/5',
    },
    {
      id: 'challenging' as DifficultyType,
      label: 'Challenging',
      description: 'Core architectural reviews, database refactors, or heavy logic engines.',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      colorClass: 'border-rose-500/20 text-rose-300 bg-rose-500/5',
    },
  ];

  const handleToggle = (val: DifficultyType) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((item) => item !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  return (
    <div className="space-y-2.5">
      <label className="text-xs font-semibold tracking-wide text-slate-300 font-display">
        Preferred Repository Difficulty
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {options.map((opt) => {
          const isSelected = selectedValues.includes(opt.id);
          
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleToggle(opt.id)}
              className={`text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 cursor-pointer select-none active:scale-98 ${
                isSelected
                  ? 'bg-purple-500/5 border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.06)]'
                  : 'bg-slate-950/25 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={`mt-0.5 shrink-0 p-1.5 rounded-xl border ${isSelected ? 'bg-purple-500/15 border-purple-500/20' : 'bg-slate-950/40 border-slate-800'}`}>
                {isSelected ? <Check className="w-4 h-4 text-purple-400" /> : opt.icon}
              </div>
              <div>
                <h4 className={`text-sm font-bold font-display ${isSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                  {opt.label}
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

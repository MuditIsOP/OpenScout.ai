import React from 'react';
import { Badge } from '../ui/Badge';
import { Check, Plus } from 'lucide-react';

interface MultiSelectFieldProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  error?: string;
  badgeVariant?: 'blue' | 'violet' | 'orange';
}

export function MultiSelectField({
  label,
  options,
  selectedValues,
  onChange,
  error,
  badgeVariant = 'blue',
}: MultiSelectFieldProps) {
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold tracking-wide text-slate-300 font-display">
          {label}
        </label>
        {selectedValues.length > 0 && (
          <span className="text-[10px] font-mono text-slate-500">
            {selectedValues.length} selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 p-4 bg-slate-950/40 border border-slate-900 rounded-2xl max-h-44 overflow-y-auto">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option);
          
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleToggle(option)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all duration-300 select-none ${
                isSelected
                  ? badgeVariant === 'blue'
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                    : badgeVariant === 'violet'
                    ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/20 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {isSelected ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5 opacity-60" />
              )}
              <span>{option}</span>
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

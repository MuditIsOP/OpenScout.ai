import React from 'react';
import { SlidersHorizontal, RotateCcw, Search, Star } from 'lucide-react';
import { ALL_PROGRAMMING_LANGUAGES } from '../../lib/mock-data';

interface FilterState {
  language: string;
  difficulty: string;
  activity: string;
  minStars: number;
  beginnerFriendlyOnly: boolean;
  search: string;
}

interface RepositoryFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function RepositoryFilters({ filters, onChange, onReset }: RepositoryFiltersProps) {
  const handleSelectLanguage = (lang: string) => {
    onChange({ ...filters, language: lang });
  };

  const handleSelectDifficulty = (diff: string) => {
    onChange({ ...filters, difficulty: diff });
  };

  const handleSelectActivity = (act: string) => {
    onChange({ ...filters, activity: act });
  };

  const handleMinStarsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, minStars: parseInt(e.target.value) || 0 });
  };

  const handleToggleBeginnerFriendly = () => {
    onChange({ ...filters, beginnerFriendlyOnly: !filters.beginnerFriendlyOnly });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  return (
    <div className="bg-slate-950/45 border border-slate-900 rounded-2xl p-5 space-y-4">
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-semibold text-slate-200 font-display">Filter Recommendations</h4>
        </div>
        
        {/* Search bar inside filters */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search matching repos..."
            className="w-full glass-input text-xs rounded-xl pl-9 pr-4 py-2 text-slate-200"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
        {/* Languages Selection Scroll */}
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-[10px] uppercase tracking-wider font-mono text-slate-500 font-medium">Language</label>
          <select
            className="w-full glass-input text-xs rounded-xl px-3 py-2 text-slate-300"
            value={filters.language}
            onChange={(e) => handleSelectLanguage(e.target.value)}
          >
            <option value="">All Languages</option>
            {ALL_PROGRAMMING_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Difficulty Select */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider font-mono text-slate-500 font-medium">Difficulty</label>
          <select
            className="w-full glass-input text-xs rounded-xl px-3 py-2 text-slate-300"
            value={filters.difficulty}
            onChange={(e) => handleSelectDifficulty(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner Friendly</option>
            <option value="moderate">Moderate</option>
            <option value="challenging">Challenging</option>
          </select>
        </div>

        {/* Min Stars Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-wider font-mono text-slate-500 font-medium">Min Stars</label>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">{filters.minStars.toLocaleString()}★</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="50000"
              step="1000"
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
              value={filters.minStars}
              onChange={handleMinStarsChange}
            />
          </div>
        </div>

        {/* Beginner friendly checkbox toggle + Reset */}
        <div className="flex items-center md:items-end justify-between md:justify-end gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500/20 focus:ring-offset-0"
              checked={filters.beginnerFriendlyOnly}
              onChange={handleToggleBeginnerFriendly}
            />
            <span className="text-xs text-slate-400 font-medium">Good First Issues Only</span>
          </label>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors py-1 px-2.5 rounded-lg border border-transparent hover:border-slate-800 hover:bg-slate-900/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}

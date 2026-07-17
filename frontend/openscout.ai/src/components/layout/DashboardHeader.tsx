import React from 'react';
import { Badge } from '../ui/Badge';
import { Bell, Menu, User, LogOut, Sliders, LayoutDashboard } from 'lucide-react';
import { DeveloperProfile } from '../../types';

interface DashboardHeaderProps {
  profile: DeveloperProfile;
  onLogout: () => void;
  onMenuToggle: () => void;
  title: string;
}

export function DashboardHeader({
  profile,
  onLogout,
  onMenuToggle,
  title,
}: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-slate-900/60 bg-[#060913]/90 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20 font-sans">
      {/* Title block */}
      <div className="flex items-center gap-3">
        {/* Toggle Mobile Menu Button */}
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-xl border border-slate-900 text-slate-400 hover:text-slate-200 md:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold font-display text-white tracking-wide truncate">
          {title}
        </h2>
      </div>

      {/* Profile summary & dropdown option on top-right */}
      <div className="flex items-center gap-4">
        {/* Notifications badge */}
        <div className="relative">
          <button className="p-2 rounded-xl border border-slate-900 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        </div>

        {/* User profile dropdown section */}
        <div className="flex items-center gap-2.5 border-l border-slate-800/80 pl-4">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-8 h-8 rounded-xl border border-slate-700/60 object-cover"
          />
          <div className="flex-col hidden sm:flex">
            <span className="text-xs font-bold text-slate-200">{profile.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">@{profile.githubUsername}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

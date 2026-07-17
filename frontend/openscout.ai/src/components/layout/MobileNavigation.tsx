import React from 'react';
import { Compass, LayoutDashboard, Sliders, User, LogOut, X, GitBranch } from 'lucide-react';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'dashboard' | 'profile' | 'preferences';
  onNavigate: (view: 'dashboard' | 'profile' | 'preferences') => void;
  onLogout: () => void;
  username: string;
}

export function MobileNavigation({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onLogout,
  username,
}: MobileNavigationProps) {
  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile' as const, label: 'Developer Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 z-40 md:hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Navigation drawer menu panel */}
      <div className="fixed top-0 left-0 bottom-0 w-72 bg-[#060913] border-r border-slate-900 shadow-2xl flex flex-col z-50 animate-[slideInLeft_0.3s_ease]">
        {/* Header section with X */}
        <div className="p-6 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500/15 via-purple-500/15 to-pink-500/15 border border-purple-500/30 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-sm font-bold font-display text-white">OpenScout.ai</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-900 text-slate-500 hover:text-slate-200 hover:border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-purple-500/10 border border-purple-500/25 text-purple-300'
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-950/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User stats + log out */}
        <div className="p-4 border-t border-slate-900/60 bg-slate-950/20">
          <div className="flex items-center justify-between p-2 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-mono font-bold text-purple-300 uppercase shrink-0">
                {username.slice(0, 2)}
              </div>
              <span className="text-xs font-bold text-slate-300 truncate">@{username}</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="p-1.5 rounded-lg border border-slate-900 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

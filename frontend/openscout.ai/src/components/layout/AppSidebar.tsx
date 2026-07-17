import React from 'react';
import { Compass, LayoutDashboard, Sliders, User, LogOut, Code, GitBranch } from 'lucide-react';

interface AppSidebarProps {
  currentView: 'dashboard' | 'profile' | 'preferences';
  onNavigate: (view: 'dashboard' | 'profile' | 'preferences') => void;
  onLogout: () => void;
  username: string;
}

export function AppSidebar({
  currentView,
  onNavigate,
  onLogout,
  username,
}: AppSidebarProps) {
  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile' as const, label: 'Developer Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Sliders },
  ];

  return (
    <aside className="w-64 border-r border-slate-900/60 bg-[#060913]/95 backdrop-blur-md flex flex-col h-screen fixed top-0 left-0 z-30 font-sans hidden md:flex">
      {/* Sidebar Logo Header */}
      <div className="p-6 border-b border-slate-900/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-purple-500/35 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <GitBranch className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-wider font-display bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            OpenScout.ai
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
            Phase 1 Scout
          </span>
        </div>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-purple-500/10 border border-purple-500/25 text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.05)]'
                  : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-950/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User profile details footer inside sidebar */}
      <div className="p-4 border-t border-slate-900/60 bg-slate-950/10">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-950/30 transition-all duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-mono font-bold text-purple-300 uppercase shrink-0">
              {username.slice(0, 2)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-300 truncate">@{username}</span>
              <span className="text-[10px] text-slate-500">Developer</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg border border-slate-900 text-slate-500 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all duration-300 cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

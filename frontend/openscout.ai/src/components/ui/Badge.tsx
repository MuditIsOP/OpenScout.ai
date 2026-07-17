import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'violet' | 'orange' | 'green' | 'rose' | 'slate';
  outline?: boolean;
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
}

export function Badge({
  children,
  className = '',
  variant = 'slate',
  outline = false,
  ...props
}: BadgeProps) {
  let baseClass = 'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md tracking-wider font-mono uppercase select-none';
  
  let variantClass = '';
  if (outline) {
    if (variant === 'blue') {
      variantClass = 'border border-blue-500/30 text-blue-400 bg-blue-500/5';
    } else if (variant === 'violet') {
      variantClass = 'border border-purple-500/30 text-purple-400 bg-purple-500/5';
    } else if (variant === 'orange') {
      variantClass = 'border border-amber-500/30 text-amber-400 bg-amber-500/5';
    } else if (variant === 'green') {
      variantClass = 'border border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
    } else if (variant === 'rose') {
      variantClass = 'border border-rose-500/30 text-rose-400 bg-rose-500/5';
    } else {
      variantClass = 'border border-slate-700 text-slate-300 bg-slate-800/10';
    }
  } else {
    // Glassy filled variant
    if (variant === 'blue') {
      variantClass = 'bg-blue-500/10 border border-blue-500/20 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.05)]';
    } else if (variant === 'violet') {
      variantClass = 'bg-purple-500/10 border border-purple-500/20 text-purple-300 shadow-[0_0_10px_rgba(139,92,246,0.05)]';
    } else if (variant === 'orange') {
      variantClass = 'bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.05)]';
    } else if (variant === 'green') {
      variantClass = 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.05)]';
    } else if (variant === 'rose') {
      variantClass = 'bg-rose-500/10 border border-rose-500/20 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.05)]';
    } else {
      variantClass = 'bg-slate-800/40 border border-slate-700/60 text-slate-300';
    }
  }

  return (
    <span className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
}

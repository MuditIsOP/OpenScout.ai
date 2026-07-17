import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'blue' | 'violet' | 'orange' | 'flat';
  hoverGlow?: boolean;
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
}

export function Card({
  children,
  className = '',
  variant = 'default',
  hoverGlow = false,
  ...props
}: CardProps) {
  let variantClass = 'glass-panel';
  
  if (variant === 'blue') {
    variantClass = 'glass-panel-accent-blue';
  } else if (variant === 'violet') {
    variantClass = 'glass-panel-accent-violet';
  } else if (variant === 'orange') {
    variantClass = 'glass-panel-accent-orange';
  } else if (variant === 'flat') {
    variantClass = 'bg-slate-950/40 border border-slate-800/60 backdrop-blur-md';
  }

  const hoverClass = hoverGlow
    ? 'hover:border-slate-400/35 hover:shadow-[0_12px_40px_rgba(255,255,255,0.03)] hover:translate-y-[-2px] transition-all duration-300 ease-out'
    : 'transition-all duration-300';

  return (
    <div
      className={`rounded-2xl p-6 ${variantClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

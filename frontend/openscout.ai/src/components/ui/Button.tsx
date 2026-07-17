import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'primary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export function Button({
  children,
  className = '',
  variant = 'glass',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  let baseClass = 'font-medium rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95';
  
  let variantClass = '';
  if (variant === 'glass') {
    variantClass = 'glass-button text-slate-100';
  } else if (variant === 'primary') {
    variantClass = 'glass-button-primary text-white';
  } else if (variant === 'outline') {
    variantClass = 'border border-slate-700/60 bg-transparent text-slate-300 hover:bg-slate-800/40 hover:border-slate-500/55';
  } else if (variant === 'danger') {
    variantClass = 'bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50';
  }

  let sizeClass = '';
  if (size === 'sm') {
    sizeClass = 'px-3.5 py-1.5 text-xs';
  } else if (size === 'md') {
    sizeClass = 'px-5 py-2.5 text-sm';
  } else if (size === 'lg') {
    sizeClass = 'px-7 py-3.5 text-base';
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}

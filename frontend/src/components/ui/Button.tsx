import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer';

  const variants = {
    primary:
      'bg-white text-black font-semibold hover:bg-white/90 border border-white/20 shadow-xs',
    secondary:
      'bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/[0.1] shadow-xs',
    outline:
      'border border-white/[0.16] bg-transparent text-white/90 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.3] shadow-xs',
    ghost:
      'text-white/70 hover:text-white hover:bg-white/[0.06]',
    danger:
      'bg-rose-500/90 text-white hover:bg-rose-600 shadow-sm font-medium border border-rose-400/30',
  };

  const sizes = {
    sm: 'h-8 rounded-md px-3 text-xs gap-1.5',
    md: 'h-9 px-4 py-2 text-sm gap-2',
    lg: 'h-10 rounded-md px-6 text-base gap-2',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

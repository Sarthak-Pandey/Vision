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
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none';

  const variants = {
    primary:
      'bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs font-medium',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40 shadow-2xs',
    outline:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-2xs',
    ghost:
      'hover:bg-accent hover:text-accent-foreground',
    danger:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-2xs font-medium',
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

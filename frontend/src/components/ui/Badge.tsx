import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'orange' | 'success' | 'warning' | 'error' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-secondary-bg text-secondary-text border border-border',
    orange: 'bg-brand-light-orange text-brand-dark-orange border border-orange-200',
    success: 'bg-green-50 text-status-success border border-green-200',
    warning: 'bg-amber-50 text-status-warning border border-amber-200',
    error: 'bg-red-50 text-status-error border border-red-200',
    outline: 'bg-transparent text-primary-text border border-border',
  };

  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, icon, className }) => {
  return (
    <div
      className={cn(
        'w-full py-12 px-6 flex flex-col items-center justify-center text-center bg-white border border-border border-dashed rounded-xl',
        className
      )}
    >
      {icon && <div className="p-3 mb-4 rounded-full bg-secondary-bg text-secondary-text">{icon}</div>}
      <h3 className="text-base font-semibold text-primary-text">{title}</h3>
      <p className="text-xs text-secondary-text max-w-md mt-1.5 leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-primary-text tracking-wide">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full h-10 px-3.5 py-2 text-sm bg-white border border-border rounded-lg text-primary-text placeholder:text-muted-text focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors disabled:bg-secondary-bg disabled:cursor-not-allowed',
            error && 'border-status-error focus:border-status-error focus:ring-status-error',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-error">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-secondary-text">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

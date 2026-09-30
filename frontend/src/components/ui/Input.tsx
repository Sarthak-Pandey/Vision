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
          <label className="text-xs font-semibold text-foreground tracking-wide select-none">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-2xs transition-all duration-150 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-destructive font-medium mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

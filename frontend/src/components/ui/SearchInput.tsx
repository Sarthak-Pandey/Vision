import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, placeholder = 'Search projects, media...', onChange, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text pointer-events-none" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          onChange={onChange}
          className={cn(
            'w-full h-10 pl-9 pr-3.5 text-sm bg-secondary-bg border border-border rounded-lg text-primary-text placeholder:text-muted-text focus:outline-none focus:bg-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

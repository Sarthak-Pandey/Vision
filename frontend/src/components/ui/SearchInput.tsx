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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          onChange={onChange}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-muted/40 pl-9 pr-3 py-1 text-sm shadow-2xs transition-all duration-150 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

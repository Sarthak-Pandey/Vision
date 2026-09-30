import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => {
  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizes = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-muted border border-border text-foreground font-semibold flex items-center justify-center select-none shrink-0 shadow-2xs',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};

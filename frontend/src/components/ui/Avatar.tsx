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
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-brand-light-orange border border-orange-200 text-brand-dark-orange font-semibold flex items-center justify-center select-none shrink-0',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};

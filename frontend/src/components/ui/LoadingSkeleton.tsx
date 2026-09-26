import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className }) => {
  return <div className={cn('animate-pulse bg-secondary-bg rounded-lg', className)} />;
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white border border-border rounded-xl p-5 space-y-4">
    <LoadingSkeleton className="h-32 w-full" />
    <LoadingSkeleton className="h-5 w-3/4" />
    <LoadingSkeleton className="h-4 w-1/2" />
  </div>
);

import React from 'react';

export const LoadingSkeletonCard: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-2xs">
      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
      <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
      <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
    </div>
  );
};

export const CardSkeleton = LoadingSkeletonCard;

export const LoadingSkeletonGrid: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeletonCard key={i} />
      ))}
    </div>
  );
};

import React from 'react';
import { Card } from './Card';
import { cn } from '@/lib/utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, className }) => {
  return (
    <Card className={cn('flex flex-col justify-between p-5 rounded-xl border border-border bg-card text-card-foreground shadow-2xs', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        {icon && <div className="p-2 rounded-lg bg-muted text-foreground/80">{icon}</div>}
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-md border',
              trend.positive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400'
            )}
          >
            {trend.positive ? '+' : ''}
            {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
};

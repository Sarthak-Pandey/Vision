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
    <Card className={cn('flex flex-col justify-between p-5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-secondary-text uppercase tracking-wider">{title}</span>
        {icon && <div className="p-2 rounded-lg bg-secondary-bg text-secondary-text">{icon}</div>}
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-primary-text tracking-tight">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              trend.positive ? 'bg-green-50 text-status-success' : 'bg-red-50 text-status-error'
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

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between p-4.5 rounded-xl border border-white/[0.05] bg-[#0e1014]/75 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-white/[0.12] transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/50">{title}</span>
        {icon && <div className="text-white/40">{icon}</div>}
      </div>
      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tracking-tight text-white">{value}</span>
          {trend && (
            <span
              className={cn(
                'text-[11px] font-medium px-1.5 py-0.5 rounded',
                trend.positive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              )}
            >
              {trend.positive ? '+' : ''}
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-white/40 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

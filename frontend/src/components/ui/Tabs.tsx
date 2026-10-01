'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-start rounded-xl bg-black/[0.04] dark:bg-black/40 p-1 text-zinc-600 dark:text-white/50 border border-black/[0.08] dark:border-white/10 select-none overflow-x-auto max-w-full backdrop-blur-md',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer gap-2',
              isActive
                ? 'bg-white dark:bg-white/15 text-zinc-950 dark:text-white font-semibold shadow-xs border border-black/[0.06] dark:border-white/10'
                : 'text-zinc-600 dark:text-white/60 hover:text-zinc-950 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-mono',
                  isActive
                    ? 'bg-black/10 dark:bg-white/20 text-zinc-900 dark:text-white'
                    : 'bg-black/[0.05] dark:bg-white/[0.06] text-zinc-500 dark:text-white/40'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};


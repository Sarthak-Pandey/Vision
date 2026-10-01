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
        'inline-flex h-10 items-center justify-start rounded-xl bg-black/40 p-1 text-white/50 border border-white/10 select-none overflow-x-auto max-w-full backdrop-blur-md',
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
                ? 'bg-white/15 text-white font-semibold shadow-sm border border-white/10'
                : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-mono',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.06] text-white/40'
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


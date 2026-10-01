'use client';

import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { useTheme } from '@/lib/theme/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-[56px] shrink-0 bg-white/80 dark:bg-[#070709]/80 backdrop-blur-xl border-b border-black/[0.08] dark:border-white/[0.08] px-6 flex items-center justify-between z-20 transition-colors duration-200">
      {/* Search Input with clean subtle shortcut */}
      <div className="w-[320px]">
        <SearchInput placeholder="Search projects or media..." />
      </div>

      {/* Theme Switcher: Small Segmented Light & Dark Button */}
      <div className="flex items-center">
        <div className="inline-flex items-center p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-xs">
          <button
            onClick={() => setTheme('light')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-zinc-950 shadow-xs border border-black/[0.06]'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
            title="Switch to Light Mode"
            aria-label="Light mode"
          >
            <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500'}`} />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-white/[0.12] text-white shadow-xs border border-white/10'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
            title="Switch to Dark Mode"
            aria-label="Dark mode"
          >
            <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-sky-300' : 'text-zinc-400 dark:text-zinc-500'}`} />
            <span>Dark</span>
          </button>
        </div>
      </div>
    </header>
  );
};


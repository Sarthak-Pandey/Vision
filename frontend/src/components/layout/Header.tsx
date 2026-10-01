'use client';

import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { useTheme } from '@/lib/theme/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-[56px] shrink-0 bg-white/80 dark:bg-[#070709]/80 backdrop-blur-xl border-b border-black/[0.08] dark:border-white/[0.08] px-6 flex items-center justify-between z-20 transition-colors duration-200">
      {/* Search Input with clean subtle shortcut */}
      <div className="w-[320px]">
        <SearchInput placeholder="Search projects or media..." />
      </div>

      {/* Theme Switcher Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>
      </div>
    </header>
  );
};


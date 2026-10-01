'use client';

import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';

export const Header: React.FC = () => {
  return (
    <header className="h-[56px] bg-[#070709]/80 backdrop-blur-xl border-b border-white/[0.08] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input with clean subtle shortcut */}
      <div className="w-[320px]">
        <SearchInput placeholder="Search projects or media..." />
      </div>
    </header>
  );
};


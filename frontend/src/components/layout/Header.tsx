'use client';

import React from 'react';
import { Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useRouter } from 'next/navigation';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/dashboard');
  };

  const dropdownItems = [
    {
      label: 'Profile Settings',
      onClick: () => {},
      icon: <UserIcon className="w-4 h-4" />,
    },
    {
      label: 'Sign Out',
      onClick: handleLogout,
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
    },
  ];

  return (
    <header className="h-[60px] bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Search Input */}
      <div className="w-[340px]">
        <SearchInput placeholder="Search projects, media..." />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Dark / Light Mode Toggle Button using the Shadcn Circle Hatch Logo */}
        <button
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors relative cursor-pointer flex items-center justify-center"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <Logo className="w-4 h-4 text-foreground transition-colors duration-200" />
        </button>

        {/* Notification Bell */}
        <button
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors relative cursor-pointer flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer select-none">
              <Avatar name={user?.name || user?.email || 'User'} size="sm" />
              <span className="text-xs font-semibold text-foreground">
                {user?.name || user?.email || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          }
          items={dropdownItems}
        />
      </div>
    </header>
  );
};

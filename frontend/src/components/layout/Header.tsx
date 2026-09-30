'use client';

import React from 'react';
import { Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
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
    <header className="h-[64px] bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="w-[340px]">
        <SearchInput placeholder="Search projects, media..." />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <button
          className="p-2 text-secondary-text hover:text-primary-text hover:bg-secondary-bg rounded-lg transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange rounded-full" />
        </button>

        <div className="h-5 w-px bg-border" />

        <Dropdown
          trigger={
            <button className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-secondary-bg transition-colors cursor-pointer">
              <Avatar name={user?.name || user?.email || 'User'} size="sm" />
              <span className="text-xs font-semibold text-primary-text">
                {user?.name || user?.email || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-secondary-text" />
            </button>
          }
          items={dropdownItems}
        />
      </div>
    </header>
  );
};

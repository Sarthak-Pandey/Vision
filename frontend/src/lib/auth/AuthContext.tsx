'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Default logged in user for seamless demo, or read from storage
    return {
      id: 'usr-1',
      email: 'sarthak.pandey@example.com',
      name: 'Sarthak Pandey',
      role: 'Team Member',
    };
  });

  const login = (email: string, name?: string) => {
    const newUser: User = {
      id: 'usr-' + Date.now(),
      email,
      name: name || email.split('@')[0] || 'User',
      role: 'Team Member',
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

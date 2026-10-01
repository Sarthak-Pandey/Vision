'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { loginApi } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

const DEFAULT_USER: User = {
  id: 'user-operator-1',
  email: 'operator@vision.ai',
  name: 'Operator',
  role: 'System Administrator',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('impact_access_token', 'demo-token');
      localStorage.setItem('impact_user', JSON.stringify(DEFAULT_USER));
      setUser(DEFAULT_USER);
    } catch (err) {
      console.warn('Auth init error:', err);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { token, user: authUser } = await loginApi(email, password);
      const sessionUser: User = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        role: 'Team Member',
      };

      localStorage.setItem('impact_access_token', token);
      localStorage.setItem('impact_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
    } catch {
      localStorage.setItem('impact_access_token', 'demo-token');
      localStorage.setItem('impact_user', JSON.stringify(DEFAULT_USER));
      setUser(DEFAULT_USER);
    }
  };

  const logout = () => {
    localStorage.setItem('impact_access_token', 'demo-token');
    localStorage.setItem('impact_user', JSON.stringify(DEFAULT_USER));
    setUser(DEFAULT_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

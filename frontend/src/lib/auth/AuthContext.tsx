'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { loginApi, guestLoginApi } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<string | undefined>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  guestLogin: async () => undefined,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore authenticated session from localStorage if present
    try {
      const storedToken = localStorage.getItem('impact_access_token');
      const storedUser = localStorage.getItem('impact_user');
      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.warn('Failed to restore auth session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user: authUser } = await loginApi(email, password);
    const sessionUser: User = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      role: 'Team Member',
      isGuest: false,
    };

    localStorage.setItem('impact_access_token', token);
    localStorage.setItem('impact_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
  };

  const guestLogin = async (): Promise<string | undefined> => {
    const { token, user: authUser, defaultProjectId } = await guestLoginApi();
    const sessionUser: User = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name || 'Guest Demo',
      role: 'Guest Demo',
      isGuest: true,
    };

    localStorage.setItem('impact_access_token', token);
    localStorage.setItem('impact_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
    return defaultProjectId;
  };

  const logout = () => {
    localStorage.removeItem('impact_access_token');
    localStorage.removeItem('impact_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        guestLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

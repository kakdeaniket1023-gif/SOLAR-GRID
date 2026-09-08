'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile } from '@/types';
import { apiClient } from '@/frontend/lib/api-client';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  signup: (name: string, email: string, referralCode?: string, password?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient('/api/auth/me', { cache: 'no-store', credentials: 'include' });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setProfile(data.profile || null);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const res = await apiClient('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setProfile(data.profile || null);
        return { success: true, message: 'Login successful', user: data.user };
      }
      return { success: false, message: data.message || 'Invalid credentials' };
    } catch {
      return { success: false, message: 'Network error during login' };
    }
  };

  const signup = async (name: string, email: string, referralCode?: string, password?: string) => {
    try {
      const res = await apiClient('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ name, email, referralCode, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, message: 'Account created successfully', user: data.user };
      }
      return { success: false, message: data.message || 'Signup failed' };
    } catch {
      return { success: false, message: 'Network error during signup' };
    }
  };

  const logout = async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

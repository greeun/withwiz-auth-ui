'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authGet, authPost } from '../utils/api-client';
import type { AuthContextValue, AuthProviderProps } from '../types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, apiBasePath = '/api/auth', onAuthChange }: AuthProviderProps) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await authGet(`${apiBasePath}/me`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? data);
        onAuthChange?.(true);
      } else {
        setUser(null);
        onAuthChange?.(false);
      }
    } catch {
      setUser(null);
      onAuthChange?.(false);
    } finally {
      setIsLoading(false);
    }
  }, [apiBasePath, onAuthChange]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authPost(`${apiBasePath}/login`, { email, password });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? 'Login failed');
    }
    const data = await res.json();
    setUser(data.user);
    onAuthChange?.(true);
  }, [apiBasePath, onAuthChange]);

  const logout = useCallback(async () => {
    await authPost(`${apiBasePath}/logout`);
    setUser(null);
    onAuthChange?.(false);
  }, [apiBasePath, onAuthChange]);

  const refresh = useCallback(async () => {
    const res = await authPost(`${apiBasePath}/refresh`);
    return res.ok;
  }, [apiBasePath]);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, user, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authGet, authPost } from '../utils/api-client';
import type { AuthContextValue, AuthProviderProps, MfaProof } from '../types';
import { verifyMfa as requestMfaVerify } from '../utils/mfa-api';
import { readAuthError, readJsonSafely } from '../utils/read-auth-error';
import { readSuccessField } from '../utils/read-success-body';
import { AuthError } from '../utils/auth-error';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, apiBasePath = '/api/auth', onAuthChange }: AuthProviderProps) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await authGet(`${apiBasePath}/me`);
      if (res.ok) {
        const data = await res.json();
        setUser((readSuccessField(data, 'user') ?? data) as AuthContextValue['user']);
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
      const body = await readJsonSafely(res);
      const info = readAuthError(res.status, body, 'Login failed');
      if (info.key === 'MFA_REQUIRED') {
        // LoginForm 과 같이 본문 최상위의 문자열만 읽는다(data 봉투 안은 보지 않는다).
        const token = (body as { mfaToken?: unknown } | null)?.mfaToken;
        throw new AuthError(info, typeof token === 'string' && token ? { mfaToken: token } : undefined);
      }
      throw new AuthError(info);
    }
    const data = await res.json();
    setUser((readSuccessField(data, 'user') ?? null) as AuthContextValue['user']);
    onAuthChange?.(true);
  }, [apiBasePath, onAuthChange]);

  const verifyMfa = useCallback(async (proof: MfaProof, opts?: { mfaToken?: string }) => {
    const result = await requestMfaVerify(
      apiBasePath,
      proof,
      { fallback: 'Verification failed', network: 'Network error' },
      opts,
    );
    if (!result.ok) throw new AuthError(result.error);
    const { user: bodyUser, redirectTo } = result.data;
    if (typeof bodyUser === 'object' && bodyUser !== null) {
      setUser(bodyUser as AuthContextValue['user']);
      onAuthChange?.(true);
    } else {
      await checkAuth();
    }
    return redirectTo !== undefined ? { redirectTo } : {};
  }, [apiBasePath, onAuthChange, checkAuth]);

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
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, user, login, verifyMfa, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

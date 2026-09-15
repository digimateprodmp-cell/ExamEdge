'use client';

import * as React from 'react';
import { apiFetch, ApiError } from '@/lib/api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

interface AuthResponse {
  user: AdminUser;
  accessToken: string;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AdminUser | null;
  accessToken: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AdminUser | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<AuthStatus>('loading');

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' })
      .then((res) => {
        if (cancelled) return;
        if (res.user.role !== 'ADMIN') {
          setStatus('unauthenticated');
          return;
        }
        setUser(res.user);
        setAccessToken(res.accessToken);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } });
    if (res.user.role !== 'ADMIN') {
      throw new ApiError('This account does not have admin access', 403);
    }
    setUser(res.user);
    setAccessToken(res.accessToken);
    setStatus('authenticated');
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    setAccessToken(null);
    setStatus('unauthenticated');
  }, []);

  const value = React.useMemo(
    () => ({ user, accessToken, status, login, logout }),
    [user, accessToken, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

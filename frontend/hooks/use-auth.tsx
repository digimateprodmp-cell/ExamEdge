'use client';

import * as React from 'react';
import { authService, type RegisterPayload } from '@/services/auth.service';
import { ApiError } from '@/lib/api';
import type { User } from '@/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<User | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<AuthStatus>('loading');

  React.useEffect(() => {
    let cancelled = false;
    authService
      .refresh()
      .then((res) => {
        if (cancelled) return;
        setUserState(res.user);
        setAccessToken(res.accessToken);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setUserState(res.user);
    setAccessToken(res.accessToken);
    setStatus('authenticated');
  }, []);

  const register = React.useCallback(async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    setUserState(res.user);
    setAccessToken(res.accessToken);
    setStatus('authenticated');
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout; clear local state regardless
    }
    setUserState(null);
    setAccessToken(null);
    setStatus('unauthenticated');
  }, []);

  const setUser = React.useCallback((next: User) => setUserState(next), []);

  const value = React.useMemo(
    () => ({ user, accessToken, status, login, register, logout, setUser }),
    [user, accessToken, status, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { ApiError };

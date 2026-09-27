import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../data/types';
import {
  clearDemoUser,
  findDemoAccount,
  getStoredDemoUser,
  storeDemoUser,
} from '../data/demo';
import { fetchMe, login as loginApi, logoutApi } from '../lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  login: (staffId: string, pin: string, remember: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Frontend demo sessions work fully offline — restore first.
      const demo = getStoredDemoUser();
      if (demo) {
        if (!cancelled) {
          setUser(demo);
          setLoading(false);
        }
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (staffId: string, pin: string, _remember: boolean) => {
    // Demo accounts always succeed locally (no backend needed).
    const demo = findDemoAccount(staffId, pin);
    if (demo) {
      storeDemoUser(demo);
      setUser(demo);
      return true;
    }
    try {
      const account = await loginApi(staffId.trim(), pin.trim());
      setUser(account);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    clearDemoUser();
    try {
      await logoutApi();
    } catch {
      /* ignore network errors on logout */
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, login, logout, loading }), [user, login, logout, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

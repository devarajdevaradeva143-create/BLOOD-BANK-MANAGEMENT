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
  updateProfile: (patch: Partial<Pick<AuthUser, 'name' | 'email' | 'phone'>>) => void;
  loading: boolean;
}

const PROFILE_OVERRIDE_KEY = 'aegis-demo-profile-overrides';

function getProfileOverrides(): Record<string, Partial<AuthUser>> {
  try {
    const raw = localStorage.getItem(PROFILE_OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<AuthUser>>;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function applyProfileOverrides(user: AuthUser | null): AuthUser | null {
  if (!user) return null;
  try {
    const overrides = getProfileOverrides();
    const patch = overrides[user.id];
    if (!patch) return user;
    const next = { ...user, ...patch };
    if (patch.districtId === undefined) {
      next.districtId = user.districtId;
    }
    return next;
  } catch {
    return user;
  }
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
          setUser(applyProfileOverrides(demo));
          setLoading(false);
        }
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) setUser(applyProfileOverrides(me) ?? me);
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
      setUser(applyProfileOverrides(demo));
      return true;
    }
    try {
      const account = await loginApi(staffId.trim(), pin.trim());
      const withOverrides = applyProfileOverrides(account) ?? account;
      setUser({ ...withOverrides, districtId: withOverrides.districtId ?? account.districtId });
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

  const updateProfile = useCallback((patch: Partial<Pick<AuthUser, 'name' | 'email' | 'phone'>>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const cleaned: Partial<AuthUser> = {};
      if (typeof patch.name === 'string') cleaned.name = patch.name.trim();
      if (typeof patch.email === 'string') cleaned.email = patch.email.trim();
      if (typeof patch.phone === 'string') cleaned.phone = patch.phone.trim();
      const next = { ...prev, ...cleaned };
      try {
        const overrides = getProfileOverrides();
        overrides[prev.id] = { ...(overrides[prev.id] ?? {}), ...cleaned };
        localStorage.setItem(PROFILE_OVERRIDE_KEY, JSON.stringify(overrides));
        // Keep base demo session in sync so refresh keeps the latest name.
        storeDemoUser(next);
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, updateProfile, loading }),
    [user, login, logout, updateProfile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

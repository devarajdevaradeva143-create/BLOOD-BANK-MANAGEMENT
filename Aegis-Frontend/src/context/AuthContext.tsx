import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../data/types';
import { fetchMe, login as loginApi, logoutApi } from '../lib/api';
// TEMP-DEMO-LOGIN: frontend-only demo sessions (no backend).
import { DEMO_LOGIN_ENABLED, DEMO_DISTRICT_ADMIN, DEMO_SUPER_ADMIN, readDemoSession, writeDemoSession, clearDemoSession } from '../lib/demo';

interface AuthContextValue {
  user: AuthUser | null;
  login: (staffId: string, pin: string, remember: boolean) => Promise<AuthUser | null>;
  // TEMP-DEMO-LOGIN: frontend-only demo login (no backend).
  demoLogin: (role: 'DistrictAdmin' | 'SuperAdmin') => AuthUser | null;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<AuthUser, 'name' | 'email' | 'phone'>>) => void;
  loading: boolean;
}

const PROFILE_OVERRIDE_KEY = 'aegis-profile-overrides';

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
      // TEMP-DEMO-LOGIN: restore frontend-only demo session before backend check.
      const demo = DEMO_LOGIN_ENABLED ? readDemoSession() : null;
      if (demo) {
        setUser(demo);
        setLoading(false);
        return;
      }
      // Real backend session only — no offline demo login.
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
    // Real backend login only.
    try {
      const account = await loginApi(staffId.trim(), pin.trim());
      const withOverrides = applyProfileOverrides(account) ?? account;
      const next = { ...withOverrides, districtId: withOverrides.districtId ?? account.districtId };
      setUser(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      /* ignore network errors on logout */
    } finally {
      // TEMP-DEMO-LOGIN: clear frontend-only demo session.
      clearDemoSession();
      setUser(null);
    }
  }, []);

  // TEMP-DEMO-LOGIN: frontend-only demo login (no backend).
  const demoLogin = useCallback((role: 'DistrictAdmin' | 'SuperAdmin') => {
    if (!DEMO_LOGIN_ENABLED) return null;
    const mock = role === 'SuperAdmin' ? DEMO_SUPER_ADMIN : DEMO_DISTRICT_ADMIN;
    writeDemoSession(role);
    setUser(mock);
    return mock;
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
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, login, demoLogin, logout, updateProfile, loading }),
    [user, login, demoLogin, logout, updateProfile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

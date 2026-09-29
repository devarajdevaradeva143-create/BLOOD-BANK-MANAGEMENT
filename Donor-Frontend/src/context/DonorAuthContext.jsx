import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearAccessToken, fetchDonorProfile, logoutDonor } from "../lib/api";
import { saveLocalDonor } from "../services/authApi";

const DonorAuthContext = createContext(null);

const LOGGED_IN_KEY = "donorLoggedIn";
const REGISTERED_KEY = "registeredDonor";

function readLoggedIn() {
  try {
    return localStorage.getItem(LOGGED_IN_KEY) === "true";
  } catch {
    return false;
  }
}

export function DonorAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => readLoggedIn());
  const [donorEmail, setDonorEmail] = useState(() => {
    try {
      const raw = localStorage.getItem(REGISTERED_KEY);
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed?.email ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LOGGED_IN_KEY) {
        setIsAuthenticated(e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Boot check: a remembered flag alone is not a session. Verify it against
  // GET /api/donors/me (silently refreshing first) and refresh the cached
  // profile. Offline keeps the session; a rejected one is signed out.
  useEffect(() => {
    if (!readLoggedIn()) return undefined;
    let cancelled = false;

    fetchDonorProfile()
      .then((data) => {
        if (!cancelled && data?.user) saveLocalDonor(data.user);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = String(err?.message || "");
        if (message.includes("Unable to reach server")) return; // offline
        try {
          localStorage.removeItem(LOGGED_IN_KEY);
        } catch {
          // ignore
        }
        clearAccessToken();
        setIsAuthenticated(false);
        setDonorEmail("");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((email) => {
    // Real account session — the caller has already verified credentials
    // against POST /api/donors/login and stored the access token.
    try {
      localStorage.setItem(LOGGED_IN_KEY, "true");
    } catch {
      // ignore storage errors (private mode etc.)
    }
    setIsAuthenticated(true);
    if (email) setDonorEmail(email);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(LOGGED_IN_KEY);
      // Real-website hygiene: do not leave PII on shared devices.
      // registeredDonor/donations/photo stay for UX, but session flag is gone.
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setDonorEmail("");
    // Best-effort: revoke the refresh session server-side.
    logoutDonor().catch(() => {
      clearAccessToken();
    });
  }, []);

  return (
    <DonorAuthContext.Provider value={{ isAuthenticated, donorEmail, login, logout }}>
      {children}
    </DonorAuthContext.Provider>
  );
}

export function useDonorAuth() {
  const ctx = useContext(DonorAuthContext);
  if (!ctx) {
    throw new Error("useDonorAuth must be used within a DonorAuthProvider");
  }
  return ctx;
}

export { LOGGED_IN_KEY, REGISTERED_KEY };

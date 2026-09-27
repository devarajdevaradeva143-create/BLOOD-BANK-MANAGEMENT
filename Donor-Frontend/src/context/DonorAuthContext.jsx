import { createContext, useCallback, useContext, useEffect, useState } from "react";

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

  const login = useCallback((email) => {
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
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
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

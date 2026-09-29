export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const TOKEN_KEY = "donorAccessToken";

export function getAccessToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors (private mode etc.)
  }
}

export function clearAccessToken() {
  setAccessToken(null);
}

function getServerMessage(data, fallback) {
  if (data && typeof data.message === "string" && data.message.trim()) {
    if (Array.isArray(data.issues) && data.issues.length > 0) {
      const first = data.issues[0];
      if (first && typeof first.message === "string" && first.message.trim()) {
        const path = typeof first.path === "string" && first.path ? `${first.path}: ` : "";
        return `${data.message} — ${path}${first.message}`;
      }
    }
    return data.message;
  }
  if (data && typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }
  return fallback;
}

function networkError() {
  return new Error("Unable to reach server. Please check your connection.");
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

let refreshPromise = null;

/** Rotate the httpOnly refresh cookie into a fresh access token. */
function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/donors/refresh`, {
          method: "POST",
          credentials: "include",
        });
        const data = await parseJson(res);
        if (res.ok && data?.accessToken) {
          setAccessToken(data.accessToken);
          return true;
        }
      } catch {
        // ignore — caller falls through to a clean 401
      }
      return false;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function req(path, { method = "GET", body, auth = false, _retried = false } = {}) {
  const token = getAccessToken();

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw networkError();
  }

  if (res.status === 401 && auth && !_retried) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return req(path, { method, body, auth, _retried: true });
    }
    clearAccessToken();
  }

  const data = await parseJson(res);

  if (!res.ok) {
    throw new Error(getServerMessage(data, `Request failed (${res.status})`));
  }

  return data ?? {};
}

export function requestOtp(mobile) {
  return req("/api/otp/request", {
    method: "POST",
    body: { mobile: String(mobile).trim(), purpose: "donor" },
  });
}

export function registerDonor(payload, code) {
  return req("/api/donors", {
    method: "POST",
    body: { ...payload, code: String(code).trim() },
  });
}

export async function loginDonor(email, password) {
  const data = await req("/api/donors/login", {
    method: "POST",
    body: { email, password },
  });
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data;
}

export function logoutDonor() {
  return req("/api/donors/logout", { method: "POST" });
}

export function fetchDonorProfile() {
  return req("/api/donors/me", { auth: true });
}

export function requestDonationOtp(mobile) {
  return req("/api/otp/request", {
    method: "POST",
    body: { mobile: String(mobile).trim(), purpose: "donation" },
  });
}

export function submitDonation(payload) {
  const { code, ...rest } = payload || {};
  return req("/api/donations", {
    method: "POST",
    body: { ...rest, code: String(code ?? "").trim() },
  });
}

export function fetchStats() {
  return req("/api/stats");
}

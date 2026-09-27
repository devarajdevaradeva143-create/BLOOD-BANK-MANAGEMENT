export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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

async function req(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Unable to reach server. Please check your connection.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

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

export function fetchStats() {
  return req("/api/stats");
}

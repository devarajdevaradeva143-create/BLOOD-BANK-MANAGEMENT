import { useEffect, useState } from "react";
import { TN_DISTRICTS } from "../data/constants";

const DONATIONS_KEY = "donorDonations";
const ADMIN_PIN = "admin123";

function readDonations() {
  try {
    const raw = localStorage.getItem(DONATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDonations(list) {
  try {
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function add90Days(dateStr) {
  try {
    const base = dateStr ? new Date(dateStr) : new Date();
    const d = Number.isNaN(base.getTime()) ? new Date() : base;
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  } catch {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 90);
    return fallback.toISOString().slice(0, 10);
  }
}

function badgeClass(status) {
  if (status === "approved")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
  if (status === "rejected")
    return "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300";
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
}

function updateRegisteredDonorOnApprove(h) {
  try {
    const raw = localStorage.getItem("registeredDonor");
    if (!raw) return;
    const reg = JSON.parse(raw);
    if (!reg || typeof reg !== "object") return;
    const regEmail = String(reg.email || "").trim().toLowerCase();
    const hEmail = String(h.email || "").trim().toLowerCase();
    if (regEmail) {
      if (!hEmail || regEmail !== hEmail) return;
    }
    const updated = {
      ...reg,
      totalDonations: (Number(reg.totalDonations) || 0) + 1,
      lastDonationDate: h.date,
      nextEligibleDate: add90Days(h.date),
      eligibilityStatus: "Not Eligible",
      isActive: true,
    };
    localStorage.setItem("registeredDonor", JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

export default function AdminApprovalsPage() {
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem("adminAuthed") === "true";
    } catch {
      return false;
    }
  });
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [district, setDistrict] = useState(() => {
    try {
      return sessionStorage.getItem("adminDistrict") || "Chennai";
    } catch {
      return "Chennai";
    }
  });
  const [donations, setDonations] = useState(() => readDonations());

  const refresh = () => {
    setDonations(readDonations());
  };

  useEffect(() => {
    refresh();
    const onStorage = (e) => {
      if (!e.key || e.key === DONATIONS_KEY) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("adminDistrict", district);
    } catch {
      // ignore
    }
  }, [district]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      try {
        sessionStorage.setItem("adminAuthed", "true");
        sessionStorage.setItem("adminDistrict", district);
      } catch {
        // ignore
      }
      setAuthed(true);
      setPinError("");
      refresh();
    } else {
      setPinError("Wrong PIN. Try again.");
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("adminAuthed");
    } catch {
      // ignore
    }
    setAuthed(false);
    setPin("");
    setPinError("");
  };

  const handleApprove = (requestId) => {
    const all = readDonations();
    const target = all.find((h) => h && h.requestId === requestId);
    const nowIso = new Date().toISOString();
    const next = all.map((h) => {
      if (!h || h.requestId !== requestId) return h;
      return {
        requestId: h.requestId,
        donorName: h.donorName,
        bloodGroup: h.bloodGroup,
        mobile: h.mobile,
        email: h.email,
        district: h.district,
        center: h.center,
        date: h.date,
        time: h.time,
        status: "approved",
        createdAt: h.createdAt,
        decidedAt: nowIso,
        decidedBy: "district-admin",
      };
    });
    writeDonations(next);
    setDonations(next);
    if (target) updateRegisteredDonorOnApprove(target);
  };

  const handleReject = (requestId) => {
    const all = readDonations();
    const nowIso = new Date().toISOString();
    const next = all.map((h) => {
      if (!h || h.requestId !== requestId) return h;
      return {
        requestId: h.requestId,
        donorName: h.donorName,
        bloodGroup: h.bloodGroup,
        mobile: h.mobile,
        email: h.email,
        district: h.district,
        center: h.center,
        date: h.date,
        time: h.time,
        status: "rejected",
        createdAt: h.createdAt,
        decidedAt: nowIso,
        decidedBy: "district-admin",
      };
    });
    writeDonations(next);
    setDonations(next);
  };

  const normDistrict = String(district || "").trim().toLowerCase();
  const filtered =
    normDistrict === "all districts" || normDistrict === "all"
      ? donations
      : donations.filter(
          (h) =>
            String(h && h.district ? h.district : "").trim().toLowerCase() ===
            normDistrict
        );

  const sorted = [...filtered].sort((a, b) => {
    const aPending = a && a.status === "pending" ? 0 : 1;
    const bPending = b && b.status === "pending" ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    const ta = a && a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b && b.createdAt ? Date.parse(b.createdAt) : 0;
    const na = Number.isNaN(ta) ? 0 : ta;
    const nb = Number.isNaN(tb) ? 0 : tb;
    return nb - na;
  });

  const pendingCount = filtered.filter((h) => h && h.status === "pending").length;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Admin Approvals
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          Select panna district admin-ku vandha requests mattum inga theriyum.
        </p>
        <form
          onSubmit={handleLogin}
          className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <label
            htmlFor="admin-pin"
            className="block text-sm font-semibold text-gray-700 dark:text-slate-300"
          >
            Admin PIN
          </label>
          <input
            id="admin-pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter Admin PIN"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          {pinError && (
            <p className="mt-2 text-sm font-medium text-rose-600" role="alert">
              {pinError}
            </p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Login
          </button>
          <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
            Demo PIN: admin123
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
            Admin Approvals
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            Select panna district admin-ku vandha requests mattum inga theriyum.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Logout
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label
          htmlFor="admin-district"
          className="text-sm font-semibold text-gray-700 dark:text-slate-300"
        >
          District
        </label>
        <select
          id="admin-district"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="All Districts">All Districts</option>
          {TN_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {pendingCount} pending
        </span>
      </div>

      {pendingCount === 0 && (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Indha district-ku pending request illa.
        </p>
      )}

      {sorted.length > 0 ? (
        <div className="mt-6 space-y-4">
          {sorted.map((h) => (
            <div
              key={h.requestId}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    {h.donorName || "—"}{" "}
                    <span className="ml-1 inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      {h.bloodGroup || "—"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                    {h.mobile || "—"} · {h.email || "—"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                    {h.center || "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {h.date || "—"} {h.time ? `· ${h.time}` : ""} ·{" "}
                    {h.requestId || ""} · {h.createdAt || ""}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${badgeClass(
                    h.status
                  )}`}
                >
                  {h.status || "pending"}
                </span>
              </div>
              {h.status === "pending" && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleApprove(h.requestId)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(h.requestId)}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        pendingCount === 0 && null
      )}
    </div>
  );
}

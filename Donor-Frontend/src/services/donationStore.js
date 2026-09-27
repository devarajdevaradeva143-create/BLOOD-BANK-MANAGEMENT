const STORAGE_KEY = "donorDonations";

function readAll() {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function sortNewestFirst(list) {
  return [...list].sort((a, b) => {
    const ta = a && a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b && b.createdAt ? Date.parse(b.createdAt) : 0;
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

export function getDonations() {
  return sortNewestFirst(readAll());
}

export function getDonationsByDistrict(district) {
  const all = getDonations();
  if (!district || String(district).trim() === "") return all;
  const norm = String(district).trim().toLowerCase();
  if (norm === "all") return all;
  return all.filter(
    (d) => String(d && d.district ? d.district : "").toLowerCase() === norm
  );
}

export function getDistrictsInDonations() {
  const all = readAll();
  const seen = new Map();
  for (const d of all) {
    const name = String(d && d.district ? d.district : "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, { id: key, name });
    }
  }
  return Array.from(seen.values());
}

export function getDonationById(requestId) {
  if (!requestId) return undefined;
  const all = readAll();
  return all.find((d) => d && d.requestId === requestId);
}

export function saveDonation(record) {
  const now = new Date().toISOString();
  const saved = {
    ...(record || {}),
    status: "pending",
    createdAt: (record && record.createdAt) || now,
  };
  const all = readAll();
  all.push(saved);
  writeAll(all);
  return saved;
}

export function updateDonationStatus(requestId, status, by) {
  if (!requestId) return false;
  const all = readAll();
  const idx = all.findIndex((d) => d && d.requestId === requestId);
  if (idx === -1) return false;
  all[idx] = {
    ...all[idx],
    status,
    decidedAt: new Date().toISOString(),
    decidedBy: by || "",
  };
  writeAll(all);
  return true;
}

export default {
  getDonations,
  getDonationsByDistrict,
  getDistrictsInDonations,
  getDonationById,
  saveDonation,
  updateDonationStatus,
};

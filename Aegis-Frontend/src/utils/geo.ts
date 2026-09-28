import { districtCenter } from '../data/districtCenters';

export interface MappedDonor {
  donorId: string;
  fullName: string;
  bloodGroup: string;
  mobile: string;
  district: string;
  city?: string;
  pincode?: string;
  address?: string;
  status: string;
  lat: number | null;
  lng: number | null;
  // Map la kaatradhuku final coords — backend lat/lng irundha adhu,
  // illana district centre + deterministic jitter (demo/offline fallback).
  mapLat: number;
  mapLng: number;
  approx: boolean;
}

// String hash — same donor ku same jitter varanum, reload la thullakoodadhu.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function toMappedDonor(raw: unknown, fallbackSlug: string): MappedDonor {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const donorId = str(r.donorId) || str(r.id) || str(r._id);
  const district = str(r.district) || fallbackSlug;
  const numOrNull = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
    return null;
  };
  const lat = numOrNull(r.lat);
  const lng = numOrNull(r.lng);

  if (lat !== null && lng !== null) {
    return {
      donorId,
      fullName: str(r.fullName) || str(r.name),
      bloodGroup: str(r.bloodGroup),
      mobile: str(r.mobile),
      district,
      city: str(r.city) || undefined,
      pincode: str(r.pincode) || undefined,
      address: str(r.address) || undefined,
      status: str(r.status) || 'Registered',
      lat,
      lng,
      mapLat: lat,
      mapLng: lng,
      approx: false,
    };
  }

  // Fallback: district centre + ~3km jitter.
  const key = (district || fallbackSlug || 'chennai').toLowerCase();
  const [cLat, cLng] = districtCenter(key);
  const h = hashStr(donorId || `${district}-${Math.random()}`);
  const dLat = ((h % 1000) / 1000 - 0.5) * 0.06;
  const dLng = (((h >> 10) % 1000) / 1000 - 0.5) * 0.06;
  return {
    donorId,
    fullName: str(r.fullName) || str(r.name),
    bloodGroup: str(r.bloodGroup),
    mobile: str(r.mobile),
    district,
    city: str(r.city) || undefined,
    pincode: str(r.pincode) || undefined,
    address: str(r.address) || undefined,
    status: str(r.status) || 'Registered',
    lat: null,
    lng: null,
    mapLat: cLat + dLat,
    mapLng: cLng + dLng,
    approx: true,
  };
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const a =
    s1 * s1 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Trip order: greedy nearest-neighbour — pakkathula irukura donor ah adutha stop ah edu.
export function orderTrip(donors: MappedDonor[]): MappedDonor[] {
  if (donors.length <= 2) return donors;
  const remaining = [...donors];
  const ordered: MappedDonor[] = [];
  ordered.push(remaining.shift()!);
  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i += 1) {
      const d = haversineKm(last.mapLat, last.mapLng, remaining[i].mapLat, remaining[i].mapLng);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    ordered.push(remaining.splice(best, 1)[0]);
  }
  return ordered;
}

export function tripKm(ordered: MappedDonor[]): number {
  let total = 0;
  for (let i = 1; i < ordered.length; i += 1) {
    total += haversineKm(
      ordered[i - 1].mapLat,
      ordered[i - 1].mapLng,
      ordered[i].mapLat,
      ordered[i].mapLng
    );
  }
  return total;
}

export function googleDirectionsUrl(stops: MappedDonor[]): string {
  if (stops.length === 0) return 'https://www.google.com/maps';
  const origin = `${stops[0].mapLat},${stops[0].mapLng}`;
  const dest = `${stops[stops.length - 1].mapLat},${stops[stops.length - 1].mapLng}`;
  const waypoints = stops
    .slice(1, -1)
    .map((s) => `${s.mapLat},${s.mapLng}`)
    .join('|');
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination: dest,
    travelmode: 'driving',
  });
  if (waypoints) params.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

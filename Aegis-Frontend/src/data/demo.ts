import type { AuthUser, BloodUnit } from './types';

// Frontend-only demo mode: TEMPORARY, kept until user says remove.
// Set VITE_ENABLE_DEMO=false to hide/remove it in one step.
// Real logins always hit the backend; demo never touches real data.

export const DEMO_STORAGE_KEY = 'aegis-demo-user';
export const DEMO_UNITS_KEY = 'aegis-demo-units';

export const DEMO_ENABLED: boolean =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_ENABLE_DEMO !== 'false';

export interface DemoCredential {
  role: 'DistrictAdmin' | 'SuperAdmin';
  staffId: string;
  pin: string;
  user: AuthUser;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: 'DistrictAdmin',
    staffId: 'DIST-001',
    pin: 'Dist@1234',
    user: { id: 'DIST-001', name: 'District Admin', role: 'DistrictAdmin', designation: 'District Coordinator', districtId: 'chennai' },
  },
  {
    role: 'SuperAdmin',
    staffId: 'SUPER001',
    pin: 'Admin@123',
    user: { id: 'SUPER001', name: 'Super Admin', role: 'SuperAdmin', designation: 'System Administrator' },
  },
];

export function normalizeStaffId(staffId: string): string {
  return staffId.trim().toUpperCase();
}

export function findDemoAccount(staffId: string, pin: string): AuthUser | null {
  if (!DEMO_ENABLED) return null;
  const id = normalizeStaffId(staffId);
  const pinCode = pin.trim();
  const match = DEMO_CREDENTIALS.find((d) => d.staffId === id && d.pin === pinCode);
  return match ? match.user : null;
}

export function getStoredDemoUser(): AuthUser | null {
  if (!DEMO_ENABLED) return null;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser & { role?: string } | null;
    if (!parsed || typeof parsed.id !== 'string') return null;
    const role = (parsed as { role?: string }).role;
    if (role === 'Doctor' || role === 'Staff' || (role !== 'DistrictAdmin' && role !== 'SuperAdmin')) {
      try {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        const staleKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (key && key.startsWith('aegis-demo-') && key !== DEMO_STORAGE_KEY && key !== DEMO_UNITS_KEY) {
            staleKeys.push(key);
          }
        }
        staleKeys.forEach((key) => localStorage.removeItem(key));
      } catch {
        /* ignore storage errors */
      }
      const migrated = DEMO_CREDENTIALS[0].user;
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(migrated));
      } catch {
        /* ignore storage errors */
      }
      return migrated;
    }
    if (parsed.role === 'DistrictAdmin' && !parsed.districtId) {
      return { ...parsed, districtId: 'chennai' };
    }
    return parsed as AuthUser;
  } catch {
    return null;
  }
}

export function storeDemoUser(user: AuthUser): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
  } catch {
    /* ignore storage errors */
  }
}

export function clearDemoUser(): void {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isDemoSession(): boolean {
  return getStoredDemoUser() !== null;
}

// --- Mock blood units for demo (dates relative to today) ---

function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateOnly(d);
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

export const MOCK_UNITS: BloodUnit[] = [
  {
    id: 'BU-101',
    bloodGroup: 'O+',
    component: 'wholeBlood',
    district: 'Chennai',
    collectionDate: daysFromNow(-6),
    expiryDate: daysFromNow(29),
    storageLocation: 'Rack A-01',
    quantity: 1,
    collectionStaff: 'District Admin',
    testStatus: 'Passed',
    status: 'Available',
    screeningResult: 'Non-reactive — all markers negative',
    testedBy: 'District Admin',
    testDate: daysFromNow(-5),
    updatedAt: hoursAgo(5),
    history: [
      { id: 'BU-101-h0', type: 'registered', at: hoursAgo(140) },
      { id: 'BU-101-h1', type: 'testCompleted', at: hoursAgo(120), status: 'Available' },
    ],
  },
  {
    id: 'BU-102',
    bloodGroup: 'B+',
    component: 'prbc',
    district: 'Coimbatore',
    collectionDate: daysFromNow(-3),
    expiryDate: daysFromNow(32),
    storageLocation: 'Rack A-02',
    quantity: 1,
    collectionStaff: 'District Admin',
    testStatus: 'Pending',
    status: 'UnderTesting',
    updatedAt: hoursAgo(9),
    history: [
      { id: 'BU-102-h0', type: 'registered', at: hoursAgo(70) },
      { id: 'BU-102-h1', type: 'testingStarted', at: hoursAgo(60) },
    ],
  },
  {
    id: 'BU-103',
    bloodGroup: 'A+',
    component: 'platelets',
    district: 'Madurai',
    collectionDate: daysFromNow(-2),
    expiryDate: daysFromNow(3),
    storageLocation: 'Rack B-01',
    quantity: 1,
    collectionStaff: 'District Admin',
    testStatus: 'Passed',
    status: 'Available',
    screeningResult: 'Non-reactive',
    testedBy: 'District Admin',
    testDate: daysFromNow(-1),
    updatedAt: hoursAgo(12),
    history: [
      { id: 'BU-103-h0', type: 'registered', at: hoursAgo(50) },
      { id: 'BU-103-h1', type: 'testCompleted', at: hoursAgo(26), status: 'Available' },
    ],
  },
  {
    id: 'BU-104',
    bloodGroup: 'AB-',
    component: 'ffp',
    district: 'Salem',
    collectionDate: daysFromNow(-20),
    expiryDate: daysFromNow(-2),
    storageLocation: 'Rack C-01',
    quantity: 1,
    collectionStaff: 'District Admin',
    testStatus: 'Passed',
    status: 'Expired',
    screeningResult: 'Non-reactive',
    testedBy: 'District Admin',
    testDate: daysFromNow(-19),
    remarks: 'Auto-expired',
    updatedAt: hoursAgo(30),
    history: [
      { id: 'BU-104-h0', type: 'registered', at: hoursAgo(480) },
      { id: 'BU-104-h1', type: 'testCompleted', at: hoursAgo(460), status: 'Available' },
      { id: 'BU-104-h2', type: 'statusUpdated', at: hoursAgo(30), status: 'Expired' },
    ],
  },
  {
    id: 'BU-105',
    bloodGroup: 'O-',
    component: 'prbc',
    district: 'Tiruchirappalli',
    collectionDate: daysFromNow(-10),
    expiryDate: daysFromNow(25),
    storageLocation: 'Rack B-02',
    quantity: 1,
    collectionStaff: 'District Admin',
    testStatus: 'Passed',
    status: 'Reserved',
    screeningResult: 'Non-reactive',
    testedBy: 'District Admin',
    testDate: daysFromNow(-9),
    updatedAt: hoursAgo(3),
    history: [
      { id: 'BU-105-h0', type: 'registered', at: hoursAgo(240) },
      { id: 'BU-105-h1', type: 'testCompleted', at: hoursAgo(220), status: 'Available' },
      { id: 'BU-105-h2', type: 'statusUpdated', at: hoursAgo(3), status: 'Reserved', note: 'Reserved for Ward 5' },
    ],
  },
  {
    id: 'BU-106',
    bloodGroup: 'A-',
    component: 'cryo',
    district: 'Vellore',
    collectionDate: daysFromNow(-15),
    expiryDate: daysFromNow(20),
    storageLocation: 'Rack D-01',
    quantity: 2,
    collectionStaff: 'District Admin',
    testStatus: 'Failed',
    status: 'Discarded',
    screeningResult: 'Reactive — HBsAg',
    testedBy: 'District Admin',
    testDate: daysFromNow(-14),
    updatedAt: hoursAgo(50),
    history: [
      { id: 'BU-106-h0', type: 'registered', at: hoursAgo(360) },
      { id: 'BU-106-h1', type: 'testCompleted', at: hoursAgo(340), status: 'Discarded' },
    ],
  },
];

export function loadDemoUnits(): BloodUnit[] {
  try {
    const raw = localStorage.getItem(DEMO_UNITS_KEY);
    if (!raw) return MOCK_UNITS;
    const parsed = JSON.parse(raw) as BloodUnit[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_UNITS;
    return parsed;
  } catch {
    return MOCK_UNITS;
  }
}

export function saveDemoUnits(units: BloodUnit[]): void {
  try {
    localStorage.setItem(DEMO_UNITS_KEY, JSON.stringify(units));
  } catch {
    /* ignore storage errors */
  }
}

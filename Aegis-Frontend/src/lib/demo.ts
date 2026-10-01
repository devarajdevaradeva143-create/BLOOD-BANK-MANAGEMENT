// TEMP-DEMO-LOGIN: frontend-only demo sessions (no backend). Removal: delete this file + demoLogin in AuthContext + demo box in LoginPage + login.demoOffline key.
import type { AuthUser } from '../data/types';
export const DEMO_LOGIN_ENABLED = true;
const DEMO_SESSION_KEY = 'aegis-demo-session';
export const DEMO_DISTRICT_ADMIN: AuthUser = { id: 'DEMO-DIST-001', name: 'Demo District Admin', role: 'DistrictAdmin', designation: 'District Admin (demo)', email: 'demo.district@demo.local', phone: '9876543210', districtId: 'chennai' };
export const DEMO_SUPER_ADMIN: AuthUser = { id: 'DEMO-SUPER-001', name: 'Demo Super Admin', role: 'SuperAdmin', designation: 'Super Admin (demo)', email: 'demo.super@demo.local', phone: '9876543210', districtId: '' };
export function readDemoSession(): AuthUser | null { try { const raw = localStorage.getItem(DEMO_SESSION_KEY); if (!raw) return null; const p = JSON.parse(raw) as { role?: unknown }; if (p?.role === 'DistrictAdmin') return DEMO_DISTRICT_ADMIN; if (p?.role === 'SuperAdmin') return DEMO_SUPER_ADMIN; return null; } catch { return null; } }
export function writeDemoSession(role: 'DistrictAdmin' | 'SuperAdmin'): void { try { localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ role })); } catch { /* ignore */ } }
export function clearDemoSession(): void { try { localStorage.removeItem(DEMO_SESSION_KEY); } catch { /* ignore */ } }

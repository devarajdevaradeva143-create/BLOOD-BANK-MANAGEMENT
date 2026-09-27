import type {
  AuthUser,
  BloodComponent,
  BloodGroup,
  BloodUnit,
  HistoryEvent,
  TestResultInput,
  UnitStatus,
} from '../data/types';

export const API_BASE: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
}

async function parseBody(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function errorFromBody(data: any, res: Response): Error {
  const message =
    (data && typeof data.message === 'string' && data.message) ||
    (data && typeof data.error === 'string' && data.error) ||
    `Request failed (${res.status})`;
  return new Error(message);
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, retry = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Network error');
  }

  if (res.status === 401 && auth && retry) {
    try {
      await refreshAccessToken();
    } catch {
      throw errorFromBody(await parseBody(res), res);
    }
    const retryHeaders: Record<string, string> = {};
    if (body !== undefined) retryHeaders['Content-Type'] = 'application/json';
    if (accessToken) retryHeaders['Authorization'] = `Bearer ${accessToken}`;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Network error');
    }
  }

  const data = await parseBody(res);
  if (!res.ok) throw errorFromBody(data, res);
  return data as T;
}

interface ServerUser {
  id: string;
  staffId?: string;
  name: string;
  role: 'Doctor' | 'Staff';
  designation?: string | null;
}

function mapServerUser(user: ServerUser): AuthUser {
  return {
    id: user.staffId ?? user.id,
    name: user.name,
    role: user.role,
    designation: user.designation ?? '',
  };
}

export async function login(staffId: string, pin: string): Promise<AuthUser> {
  const data = await apiFetch<{ user: ServerUser; accessToken: string }>('/api/auth/login', {
    method: 'POST',
    body: { staffId, pin },
  });
  setAccessToken(data.accessToken);
  return mapServerUser(data.user);
}

export async function refreshAccessToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await parseBody(res);
  if (!res.ok) throw errorFromBody(data, res);
  const token = (data as { accessToken?: unknown } | null)?.accessToken;
  if (typeof token !== 'string' || !token) throw new Error('Session expired');
  setAccessToken(token);
  return token;
}

export async function logoutApi(): Promise<void> {
  try {
    await apiFetch<{ message?: string }>('/api/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await apiFetch<{ user: ServerUser }>('/api/auth/me', { auth: true });
  return mapServerUser(data.user);
}

interface ServerHistoryItem {
  type: HistoryEvent['type'];
  at: string;
  note?: string;
  status?: string;
  byUser?: string;
}

interface ServerUnit {
  unitCode: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  district: string;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  quantity: number;
  collectionStaff: string;
  testStatus: BloodUnit['testStatus'];
  status: UnitStatus;
  screeningResult?: string;
  testedBy?: string;
  testDate?: string;
  remarks?: string;
  updatedAt?: string;
  history?: ServerHistoryItem[];
}

function toDateOnly(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return s.length > 10 ? s.slice(0, 10) : s;
}

function toIsoString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value) return value;
  if (value) {
    const d = new Date(String(value));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback;
}

export function mapServerUnit(raw: ServerUnit): BloodUnit {
  const history: HistoryEvent[] = (raw.history ?? []).map((h, index) => ({
    id: `${raw.unitCode}-h${index}`,
    type: h.type,
    at: toIsoString(h.at, new Date().toISOString()),
    note: h.note,
    status: (h.status as UnitStatus | undefined) ?? undefined,
  }));
  const updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt
      ? raw.updatedAt
      : (history.length > 0 ? history[history.length - 1].at : new Date().toISOString());
  return {
    id: raw.unitCode,
    bloodGroup: raw.bloodGroup,
    component: raw.component,
    district: raw.district ?? '',
    collectionDate: toDateOnly(raw.collectionDate),
    expiryDate: toDateOnly(raw.expiryDate),
    storageLocation: raw.storageLocation ?? '',
    quantity: Number(raw.quantity ?? 0),
    collectionStaff: raw.collectionStaff ?? '',
    testStatus: raw.testStatus,
    status: raw.status,
    screeningResult: raw.screeningResult,
    testedBy: raw.testedBy,
    testDate: raw.testDate ? toDateOnly(raw.testDate) : undefined,
    remarks: raw.remarks,
    updatedAt,
    history,
  };
}

export interface ListUnitsParams {
  bloodGroup?: string;
  district?: string;
  status?: string;
  component?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListUnitsResult {
  data: BloodUnit[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function listUnits(params: ListUnitsParams = {}): Promise<ListUnitsResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: ServerUnit[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/units${query}`, { auth: true });
  return {
    data: (data.data ?? []).map(mapServerUnit),
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export interface CreateUnitInput {
  unitCode?: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  district: string;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  quantity: number;
  collectionStaff: string;
}

export async function createUnitApi(input: CreateUnitInput): Promise<BloodUnit> {
  const data = await apiFetch<{ unit: ServerUnit }>('/api/units', {
    method: 'POST',
    body: input,
    auth: true,
  });
  return mapServerUnit(data.unit);
}

export async function updateUnitStatusApi(
  id: string,
  status: UnitStatus,
  note?: string,
): Promise<BloodUnit> {
  const data = await apiFetch<{ unit: ServerUnit }>(
    `/api/units/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: note ? { status, note } : { status },
      auth: true,
    },
  );
  return mapServerUnit(data.unit);
}

export async function recordTestApi(id: string, input: TestResultInput): Promise<BloodUnit> {
  const data = await apiFetch<{ unit: ServerUnit }>(
    `/api/units/${encodeURIComponent(id)}/test`,
    {
      method: 'POST',
      body: input,
      auth: true,
    },
  );
  return mapServerUnit(data.unit);
}

export interface ListRequestsParams {
  bloodGroup?: string;
  districtId?: string;
  district?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListRequestsResult {
  data: unknown[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function listRequests(params: ListRequestsParams = {}): Promise<ListRequestsResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<ListRequestsResult>(`/api/requests${query}`, { auth: true });
}

export async function updateRequestStatusApi(id: string, status: string): Promise<unknown> {
  const data = await apiFetch<{ request: unknown }>(
    `/api/requests/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: { status },
      auth: true,
    },
  );
  return data.request;
}

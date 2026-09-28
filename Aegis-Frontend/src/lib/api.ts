import type {
  AuthUser,
  BloodComponent,
  BloodGroup,
  BloodRequest,
  BloodUnit,
  Donation,
  DonationStatus,
  HistoryEvent,
  Message,
  MessageStatus,
  RequestStatus,
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
  role: 'DistrictAdmin' | 'SuperAdmin';
  designation?: string | null;
  districtId?: string | null;
  email?: string | null;
  phone?: string | null;
}

function mapServerUser(user: ServerUser): AuthUser {
  return {
    id: user.staffId ?? user.id,
    name: user.name,
    role: user.role,
    designation: user.designation ?? '',
    districtId: user.districtId ?? undefined,
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
  };
}

export interface PublicStats {
  donors: number;
  requests: number;
  fulfilledUnits: number;
  livesSupported: number;
  availableUnits: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  const data = await apiFetch<Partial<PublicStats>>('/api/stats');
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return {
    donors: num(data.donors),
    requests: num(data.requests),
    fulfilledUnits: num(data.fulfilledUnits),
    livesSupported: num(data.livesSupported),
    availableUnits: num(data.availableUnits),
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
  requestType?: string;
  groupId?: string;
  page?: number;
  limit?: number;
}

export interface ListRequestsResult {
  data: BloodRequest[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export function mapServerRequest(raw: any): BloodRequest {
  const requestId =
    (typeof raw?.requestId === 'string' && raw.requestId) ||
    (typeof raw?._id === 'string' && raw._id) ||
    String(raw?.id ?? '');
  const statusRaw = String(raw?.status ?? 'submitted');
  const status: RequestStatus =
    statusRaw === 'approved' ||
    statusRaw === 'fulfilled' ||
    statusRaw === 'cancelled'
      ? statusRaw
      : 'submitted';
  const requestType = raw?.requestType === 'emergency' ? 'emergency' : 'normal';
  return {
    requestId,
    patientName: String(raw?.patientName ?? ''),
    bloodGroup: String(raw?.bloodGroup ?? ''),
    units: Number(raw?.units ?? 0),
    districtId: String(raw?.districtId ?? raw?.district ?? ''),
    hospitalName: String(raw?.hospitalName ?? ''),
    hospitalAddress:
      raw?.hospitalAddress !== undefined && raw?.hospitalAddress !== null
        ? String(raw.hospitalAddress)
        : undefined,
    contact:
      raw?.contact !== undefined && raw?.contact !== null
        ? String(raw.contact)
        : undefined,
    requiredDate: raw?.requiredDate ? toDateOnly(raw.requiredDate) : undefined,
    requestType,
    priority:
      raw?.priority !== undefined && raw?.priority !== null
        ? String(raw.priority)
        : undefined,
    status,
    createdAt:
      typeof raw?.createdAt === 'string'
        ? raw.createdAt
        : raw?.createdAt
          ? toIsoString(raw.createdAt, new Date().toISOString())
          : undefined,
    groupId:
      raw?.groupId !== undefined && raw?.groupId !== null
        ? String(raw.groupId)
        : undefined,
  };
}

export async function listRequests(params: ListRequestsParams = {}): Promise<ListRequestsResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/requests${query}`, { auth: true });
  return {
    data: (data.data ?? []).map(mapServerRequest),
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export async function updateRequestStatusApi(
  id: string,
  status: RequestStatus,
): Promise<BloodRequest> {
  const data = await apiFetch<{ request: any }>(
    `/api/requests/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: { status },
      auth: true,
    },
  );
  return mapServerRequest(data.request);
}

export interface ListDonorsParams {
  bloodGroup?: string;
  district?: string;
  districtId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListDonorsResult {
  data: any[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function listDonors(params: ListDonorsParams = {}): Promise<ListDonorsResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/donors${query}`, { auth: true });
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export interface ListDonorMapParams {
  bloodGroup?: string;
  district?: string;
  districtId?: string;
  limit?: number;
}

export interface ListDonorMapResult {
  data: any[];
  total: number;
  limit?: number;
}

export async function listDonorMap(params: ListDonorMapParams = {}): Promise<ListDonorMapResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    limit?: number;
  }>(`/api/donors/map${query}`, { auth: true });
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    limit: data.limit,
  };
}

export interface ListDonationsParams {
  bloodGroup?: string;
  districtId?: string;
  district?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListDonationsResult {
  data: Donation[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export function mapServerDonation(raw: any): Donation {
  const donationId =
    (typeof raw?.donationId === 'string' && raw.donationId) ||
    (typeof raw?._id === 'string' && raw._id) ||
    String(raw?.id ?? '');
  const statusRaw = String(raw?.status ?? 'pending');
  const status: DonationStatus =
    statusRaw === 'approved' || statusRaw === 'completed' || statusRaw === 'cancelled'
      ? statusRaw
      : 'pending';
  return {
    donationId,
    donorName: String(raw?.donorName ?? raw?.donor ?? ''),
    bloodGroup: String(raw?.bloodGroup ?? ''),
    mobile: String(raw?.mobile ?? raw?.contact ?? ''),
    districtId: String(raw?.districtId ?? raw?.district ?? ''),
    district:
      raw?.district !== undefined && raw?.district !== null
        ? String(raw.district)
        : undefined,
    availableDate: raw?.availableDate ? toDateOnly(raw.availableDate) : undefined,
    preferredTime:
      raw?.preferredTime !== undefined && raw?.preferredTime !== null
        ? String(raw.preferredTime)
        : undefined,
    notes:
      raw?.notes !== undefined && raw?.notes !== null ? String(raw.notes) : undefined,
    status,
    createdAt:
      typeof raw?.createdAt === 'string'
        ? raw.createdAt
        : raw?.createdAt
          ? toIsoString(raw.createdAt, new Date().toISOString())
          : undefined,
  };
}

export async function listDonations(
  params: ListDonationsParams = {},
): Promise<ListDonationsResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/donations${query}`, { auth: true });
  return {
    data: (data.data ?? []).map(mapServerDonation),
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export async function updateDonationStatusApi(
  id: string,
  status: DonationStatus,
): Promise<Donation> {
  const data = await apiFetch<{ donation: any }>(
    `/api/donations/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: { status },
      auth: true,
    },
  );
  return mapServerDonation(data.donation);
}

export function mapServerMessage(raw: any): Message {
  const messageId =
    (typeof raw?.messageId === 'string' && raw.messageId) ||
    (typeof raw?._id === 'string' && raw._id) ||
    String(raw?.id ?? '');
  const statusRaw = String(raw?.status ?? 'unread');
  const status: MessageStatus =
    statusRaw === 'read' || statusRaw === 'replied' ? statusRaw : 'unread';
  return {
    messageId,
    subject: String(raw?.subject ?? ''),
    body: String(raw?.body ?? ''),
    reply:
      raw?.reply !== undefined && raw?.reply !== null && String(raw.reply) !== ''
        ? String(raw.reply)
        : undefined,
    status,
    createdAt:
      typeof raw?.createdAt === 'string'
        ? raw.createdAt
        : raw?.createdAt
          ? toIsoString(raw.createdAt, new Date().toISOString())
          : undefined,
    fromName:
      raw?.fromName !== undefined && raw?.fromName !== null
        ? String(raw.fromName)
        : undefined,
    fromDistrictId:
      raw?.fromDistrictId !== undefined && raw?.fromDistrictId !== null
        ? String(raw.fromDistrictId)
        : undefined,
  };
}

export interface ListMessagesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListMessagesResult {
  data: Message[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function listMessages(params: ListMessagesParams = {}): Promise<ListMessagesResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/messages${query}`, { auth: true });
  return {
    data: (data.data ?? []).map(mapServerMessage),
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export async function sendMessage(input: { subject: string; body: string }): Promise<Message> {
  const data = await apiFetch<{ message: string; data: any }>('/api/messages', {
    method: 'POST',
    body: input,
    auth: true,
  });
  return mapServerMessage(data.data);
}

export interface UnitsSummary {
  total?: number;
  byGroup?: Record<string, number>;
  byStatus?: Record<string, number>;
  [key: string]: unknown;
}

export async function listUnitsSummary(): Promise<UnitsSummary> {
  return apiFetch<UnitsSummary>('/api/units/summary', { auth: true });
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export function mapServerNotification(raw: any): AppNotification {
  const id =
    (typeof raw?.notificationId === 'string' && raw.notificationId) ||
    (typeof raw?._id === 'string' && raw._id) ||
    String(raw?.id ?? '');
  const read =
    typeof raw?.read === 'boolean'
      ? raw.read
      : typeof raw?.isRead === 'boolean'
        ? raw.isRead
        : String(raw?.status ?? '').toLowerCase() === 'read';
  const link =
    raw?.link !== undefined && raw?.link !== null && String(raw.link) !== ''
      ? String(raw.link)
      : undefined;
  return {
    id,
    type: String(raw?.type ?? 'info'),
    title: String(raw?.title ?? raw?.subject ?? ''),
    body: String(raw?.body ?? raw?.message ?? ''),
    link,
    read,
    createdAt:
      typeof raw?.createdAt === 'string'
        ? raw.createdAt
        : raw?.createdAt
          ? toIsoString(raw.createdAt, new Date().toISOString())
          : new Date().toISOString(),
  };
}

export interface ListNotificationsParams {
  search?: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface ListNotificationsResult {
  data: AppNotification[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<ListNotificationsResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/notifications${query}`, { auth: true });
  return {
    data: (data.data ?? []).map(mapServerNotification),
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const data = await apiFetch<{ notification?: any } | any>(
    `/api/notifications/${encodeURIComponent(id)}/read`,
    {
      method: 'PATCH',
      auth: true,
    },
  );
  const raw = (data as { notification?: unknown })?.notification ?? data;
  if (raw && typeof raw === 'object') {
    try {
      const mapped = mapServerNotification(raw);
      if (mapped.id) return { ...mapped, read: true };
    } catch {
      /* fall through to synthesized receipt */
    }
  }
  return {
    id,
    type: 'info',
    title: '',
    body: '',
    read: true,
    createdAt: new Date().toISOString(),
  };
}

export interface DistrictHospital {
  id: string;
  name: string;
  district: string;
  license?: string;
  contact: string;
  email?: string;
  address?: string;
  officer?: string;
  adminName?: string;
  status: string;
}

export interface ListHospitalsParams {
  district?: string;
  districtId?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ListHospitalsResult {
  data: DistrictHospital[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export function mapServerHospital(raw: any): DistrictHospital {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
  const first = (...vals: unknown[]): string => {
    for (const v of vals) {
      const s = str(v);
      if (s) return s;
    }
    return '';
  };
  return {
    id: first(r.id, r._id, r.hospitalId),
    name: first(r.name, r.hospitalName),
    district: first(r.district, r.districtId),
    license: str(r.license) || undefined,
    contact: first(r.contact, r.mobile, r.phone),
    email: str(r.email) || undefined,
    address: str(r.address) || undefined,
    officer: first(r.officer, r.adminName, r.incharge) || undefined,
    adminName: str(r.adminName) || undefined,
    status: str(r.status) || 'approved',
  };
}

export async function listHospitals(params: ListHospitalsParams = {}): Promise<ListHospitalsResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/hospitals${query}`, { auth: true });
  return {
    data: (data.data ?? []).map(mapServerHospital),
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export interface DistrictActivityItem {
  id: string;
  title: string;
  detail?: string;
  at: string;
}

export interface DistrictStats {
  totalUnits: number;
  availableUnits: number;
  totalRequests: number;
  totalDonations: number;
  totalHospitals: number;
  stockByGroup: Record<string, number>;
  recentActivity: DistrictActivityItem[];
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapServerDistrictStats(raw: any): DistrictStats {
  const src = (raw !== null && typeof raw === 'object' && 'data' in raw && (raw as { data: unknown }).data !== undefined
    ? (raw as { data: any }).data
    : raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
  const stockRaw = (src.stockByGroup ?? src.stock ?? {}) as Record<string, unknown>;
  const stockByGroup: Record<string, number> = {};
  for (const [k, v] of Object.entries(stockRaw)) stockByGroup[k] = toNumber(v);
  const activityRaw = Array.isArray(src.recentActivity)
    ? (src.recentActivity as unknown[])
    : Array.isArray(src.recent)
      ? (src.recent as unknown[])
      : [];
  const recentActivity: DistrictActivityItem[] = activityRaw.map((item, index) => {
    const r = (item ?? {}) as Record<string, unknown>;
    const id = str(r.id) || str(r._id) || `activity-${index}`;
    const title = str(r.title) || str(r.message) || str(r.text) || str(r.type) || 'Activity';
    const detail = str(r.detail) || str(r.body) || str(r.note) || undefined;
    const at = str(r.at) || str(r.createdAt) || str(r.updatedAt) || str(r.date) || new Date().toISOString();
    return { id, title, detail, at };
  });
  return {
    totalUnits: toNumber(src.totalUnits ?? src.units),
    availableUnits: toNumber(src.availableUnits ?? src.available),
    totalRequests: toNumber(src.totalRequests ?? src.requests),
    totalDonations: toNumber(src.totalDonations ?? src.donations),
    totalHospitals: toNumber(src.totalHospitals ?? src.hospitals),
    stockByGroup,
    recentActivity,
  };
}

export async function getDistrictStats(): Promise<DistrictStats> {
  const data = await apiFetch<any>('/api/stats/district', { auth: true });
  return mapServerDistrictStats(data);
}

export interface ListDistrictMessagesParams {
  districtId?: string;
  district?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListDistrictMessagesResult {
  data: Message[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function listDistrictMessages(
  params: ListDistrictMessagesParams = {},
): Promise<ListDistrictMessagesResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/messages${query}`, { auth: true });
  return {
    data: (data.data ?? []).map(mapServerMessage),
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export async function markMessageRead(id: string): Promise<Message> {
  const data = await apiFetch<any>(`/api/messages/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
    auth: true,
  });
  const raw = (data as { data?: unknown })?.data ?? data;
  if (raw && typeof raw === 'object') {
    try {
      return { ...mapServerMessage(raw), status: 'read' };
    } catch {
      /* fall through to synthesized receipt */
    }
  }
  return { messageId: id, subject: '', body: '', status: 'read' };
}

export async function replyToMessage(id: string, reply: string): Promise<Message> {
  const data = await apiFetch<any>(`/api/messages/${encodeURIComponent(id)}/reply`, {
    method: 'POST',
    body: { reply },
    auth: true,
  });
  const raw = (data as { data?: unknown })?.data ?? data;
  if (raw && typeof raw === 'object') {
    try {
      return { ...mapServerMessage(raw), status: 'replied' };
    } catch {
      /* fall through to synthesized receipt */
    }
  }
  return { messageId: id, subject: '', body: '', reply, status: 'replied' };
}

// ===== SuperAdmin HARD pages (appended only — existing helpers untouched) =====

export interface BloodBank {
  id: string;
  name: string;
  district: string;
  contact: string;
  units: number;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface ListBloodBanksParams {
  search?: string;
  district?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ListBloodBanksResult {
  data: BloodBank[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export function mapServerBloodBank(raw: any): BloodBank {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string =>
    typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v);
  const first = (...vals: unknown[]): string => {
    for (const v of vals) {
      const s = str(v);
      if (s) return s;
    }
    return '';
  };
  const statusRaw = first(r.status).toLowerCase() || 'active';
  const status: BloodBank['status'] =
    statusRaw === 'inactive' ? 'inactive' : statusRaw === 'maintenance' ? 'maintenance' : 'active';
  const n = Number(r.units ?? r.availableUnits ?? r.totalUnits ?? r.stock ?? 0);
  return {
    id: first(r.id, r._id, r.bankId, r.code),
    name: first(r.name, r.bankName),
    district: first(r.district, r.districtId, r.districtName),
    contact: first(r.contact, r.phone, r.mobile),
    units: Number.isFinite(n) ? n : 0,
    status,
  };
}

export async function listBloodBanks(params: ListBloodBanksParams = {}): Promise<ListBloodBanksResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/blood-banks${query}`, { auth: true });
  return {
    data: (data.data ?? []).map(mapServerBloodBank),
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export interface CreateBloodBankInput {
  name: string;
  district: string;
  contact: string;
  units?: number;
  status?: BloodBank['status'];
}

export async function createBloodBank(input: CreateBloodBankInput): Promise<BloodBank> {
  const data = await apiFetch<{ bank?: any; data?: any } | any>('/api/blood-banks', {
    method: 'POST',
    body: input,
    auth: true,
  });
  const raw = (data as { bank?: unknown })?.bank ?? (data as { data?: unknown })?.data ?? data;
  return mapServerBloodBank(raw);
}

export async function updateBloodBank(
  id: string,
  patch: Partial<Pick<BloodBank, 'name' | 'district' | 'contact' | 'units' | 'status'>>,
): Promise<BloodBank> {
  const data = await apiFetch<{ bank?: any; data?: any } | any>(
    `/api/blood-banks/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: patch,
      auth: true,
    },
  );
  const raw = (data as { bank?: unknown })?.bank ?? (data as { data?: unknown })?.data ?? data;
  return mapServerBloodBank(raw);
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  role: string;
  status: 'active' | 'inactive';
}

export interface ListAdminsParams {
  search?: string;
  district?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ListAdminsResult {
  data: AdminAccount[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export function mapServerAdmin(raw: any): AdminAccount {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string =>
    typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v);
  const first = (...vals: unknown[]): string => {
    for (const v of vals) {
      const s = str(v);
      if (s) return s;
    }
    return '';
  };
  const statusRaw = first(r.status).toLowerCase();
  return {
    id: first(r.id, r._id, r.adminId, r.staffId),
    name: first(r.name),
    email: first(r.email),
    phone: first(r.phone, r.mobile, r.contact),
    district: first(r.district, r.districtId, r.districtName),
    role: first(r.role, r.designation),
    status: statusRaw === 'inactive' ? 'inactive' : 'active',
  };
}

export async function listAdmins(params: ListAdminsParams = {}): Promise<ListAdminsResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiFetch<{
    data: any[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(`/api/admins${query}`, { auth: true });
  return {
    data: (data.data ?? []).map(mapServerAdmin),
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export interface CreateAdminInput {
  name: string;
  email: string;
  phone: string;
  district: string;
  role: string;
  status?: 'active' | 'inactive';
}

export async function createAdmin(input: CreateAdminInput): Promise<AdminAccount> {
  const data = await apiFetch<{ admin?: any; data?: any } | any>('/api/admins', {
    method: 'POST',
    body: input,
    auth: true,
  });
  const raw = (data as { admin?: unknown })?.admin ?? (data as { data?: unknown })?.data ?? data;
  return mapServerAdmin(raw);
}

export async function updateAdmin(
  id: string,
  patch: Partial<Pick<AdminAccount, 'name' | 'email' | 'phone' | 'district' | 'role' | 'status'>>,
): Promise<AdminAccount> {
  const data = await apiFetch<{ admin?: any; data?: any } | any>(
    `/api/admins/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: patch,
      auth: true,
    },
  );
  const raw = (data as { admin?: unknown })?.admin ?? (data as { data?: unknown })?.data ?? data;
  return mapServerAdmin(raw);
}

export interface ResetPinResult {
  pin?: string;
  message?: string;
}

export async function resetAdminPin(id: string, newPin?: string): Promise<ResetPinResult> {
  const data = await apiFetch<any>(`/api/admins/${encodeURIComponent(id)}/reset-pin`, {
    method: 'POST',
    auth: true,
    ...(newPin ? { body: { newPin } } : {}),
  });
  if (data !== null && typeof data === 'object') {
    const r = data as Record<string, unknown>;
    const pin =
      typeof r.pin === 'string'
        ? r.pin
        : typeof r.tempPin === 'string'
          ? r.tempPin
          : typeof r.newPin === 'string'
            ? r.newPin
            : undefined;
    const message = typeof r.message === 'string' ? r.message : undefined;
    return { pin, message };
  }
  return {};
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface SuperAdminReports {
  collections?: number;
  issues?: number;
  newDonors?: number;
  fulfilment?: number | string;
  totalUnits?: number;
  totalDonors?: number;
  totalHospitals?: number;
  totalBanks?: number;
  pendingRequests?: number;
  stockByGroup?: Record<string, number>;
  [key: string]: unknown;
}

export async function getReports(period: ReportPeriod = 'daily'): Promise<SuperAdminReports> {
  const qs = new URLSearchParams();
  qs.set('period', period);
  return apiFetch<SuperAdminReports>(`/api/stats/reports?${qs.toString()}`, { auth: true });
}

export async function updateProfile(patch: {
  name?: string;
  email?: string;
  phone?: string;
}): Promise<AuthUser> {
  const data = await apiFetch<{ user?: any } | any>('/api/auth/profile', {
    method: 'PATCH',
    body: patch,
    auth: true,
  });
  const raw: any = (data as { user?: unknown })?.user ?? data;
  const mapped = mapServerUser(raw as ServerUser);
  if (raw && typeof raw.email === 'string') mapped.email = raw.email;
  else if (typeof patch.email === 'string') mapped.email = patch.email;
  if (raw && typeof raw.phone === 'string') mapped.phone = raw.phone;
  else if (typeof patch.phone === 'string') mapped.phone = patch.phone;
  if (raw && typeof raw.name === 'string' && raw.name) mapped.name = raw.name;
  return mapped;
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  // Backend contract is { currentPin, newPin } — map here so callers stay clean.
  await apiFetch<{ message?: string }>('/api/auth/change-password', {
    method: 'POST',
    body: { currentPin: input.currentPassword, newPin: input.newPassword },
    auth: true,
  });
}

// ===== SuperAdmin MEDIUM pages (appended only — existing helpers untouched) =====

export interface DistrictOverviewRow {
  district: string;
  hospitals: number;
  banks: number;
  donors: number;
  requests: number;
  stock: number;
}

function toFiniteNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapServerDistrictOverview(raw: any): DistrictOverviewRow {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string =>
    typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v);
  const first = (...vals: unknown[]): string => {
    for (const v of vals) {
      const s = str(v).trim();
      if (s) return s;
    }
    return '';
  };
  return {
    district: first(r.district, r.districtId, r.name, r.districtName),
    hospitals: toFiniteNumber(r.hospitals ?? r.totalHospitals ?? r.hospitalCount),
    banks: toFiniteNumber(r.banks ?? r.totalBanks ?? r.bankCount ?? r.bloodBanks),
    donors: toFiniteNumber(r.donors ?? r.totalDonors ?? r.donorCount),
    requests: toFiniteNumber(r.requests ?? r.totalRequests ?? r.requestCount),
    stock: toFiniteNumber(
      r.stock ?? r.availableUnits ?? r.available ?? r.totalUnits ?? r.units,
    ),
  };
}

/**
 * GET /api/stats/districts — aggregate per-district overview.
 * NOTE: backend currently exposes only GET /api/stats and
 * GET /api/stats/district (singular). This helper targets the plural
 * aggregate endpoint; callers MUST catch failures and fall back to
 * per-district getDistrictStatsFor() fan-out. Never mock.
 */
export async function listDistrictsOverview(): Promise<DistrictOverviewRow[]> {
  const data = await apiFetch<any>('/api/stats/districts', { auth: true });
  const arr: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: unknown })?.data)
      ? (data as { data: unknown[] }).data
      : Array.isArray((data as { districts?: unknown })?.districts)
        ? (data as { districts: unknown[] }).districts
        : [];
  return arr
    .map(mapServerDistrictOverview)
    .filter((row) => row.district !== '');
}

export interface DistrictScopedStats {
  district: string;
  donors: number;
  requests: number;
  fulfilledUnits: number;
  availableUnits: number;
  hospitals: number;
}

/**
 * GET /api/stats/district?districtId=<slug> — per-district counters.
 * Backend supports ?districtId= / ?district= for SuperAdmin.
 * Separate from the legacy zero-arg getDistrictStats() above (untouched).
 */
export async function getDistrictStatsFor(districtId: string): Promise<DistrictScopedStats> {
  const qs = new URLSearchParams();
  qs.set('districtId', districtId);
  const data = await apiFetch<any>(`/api/stats/district?${qs.toString()}`, { auth: true });
  const src = (data ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string =>
    typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v);
  return {
    district: str(src.district) || districtId,
    donors: toFiniteNumber(src.donors),
    requests: toFiniteNumber(src.requests),
    fulfilledUnits: toFiniteNumber(src.fulfilledUnits),
    availableUnits: toFiniteNumber(src.availableUnits),
    hospitals: toFiniteNumber(src.hospitals),
  };
}

/**
 * PATCH /api/hospitals/:id/status — hospital approve/reject.
 * NOTE: backend routes (hospitals.routes.js) currently expose only
 * GET /, POST register/login/refresh/logout, GET /me, PATCH /me.
 * This helper documents the intended endpoint; callers MUST catch
 * 404/failures and fall back to local-state + toast with a backend-pending note.
 */
export async function updateHospitalStatusApi(
  id: string,
  status: string,
): Promise<DistrictHospital> {
  const data = await apiFetch<{ hospital?: any; data?: any } | any>(
    `/api/hospitals/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: { status },
      auth: true,
    },
  );
  const raw =
    (data as { hospital?: unknown })?.hospital ??
    (data as { data?: unknown })?.data ??
    data;
  return mapServerHospital(raw);
}

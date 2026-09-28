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
}

function mapServerUser(user: ServerUser): AuthUser {
  return {
    id: user.staffId ?? user.id,
    name: user.name,
    role: user.role,
    designation: user.designation ?? '',
    districtId: user.districtId ?? undefined,
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

import { CHANGE_EVENT } from '@/lib/storage/local-store';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api';
export const SESSION_KEY = 'skins.session';
export const ACCESS_KEY = 'skins.access';
export const ACCESS_REQUIRED = 'access_required';

export const readSession = (): string | null => {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);

    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null;
  }
};

export const writeSession = (token: string | null): void => {
  try {
    if (token) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(token));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {}

  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const readAccess = (): string | null => {
  try {
    const raw = window.localStorage.getItem(ACCESS_KEY);

    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null;
  }
};

export const writeAccess = (token: string | null): void => {
  try {
    if (token) {
      window.localStorage.setItem(ACCESS_KEY, JSON.stringify(token));
    } else {
      window.localStorage.removeItem(ACCESS_KEY);
    }
  } catch {}

  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

const authHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const token = readSession();
  const access = readAccess();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(access ? { 'X-Access-Token': access } : {}),
  };
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type QueryValue = string | number | boolean | string[] | undefined;

const buildUrl = (path: string, query?: Record<string, QueryValue>): string => {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else {
      params.set(key, String(value));
    }
  });

  const search = params.toString();

  return search ? `${API_URL}${path}?${search}` : `${API_URL}${path}`;
};

const readMessage = (payload: unknown): string => {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const { message } = payload as { message: unknown };

    if (Array.isArray(message) && typeof message[0] === 'string') {
      return message[0];
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Request failed';
};

const fail = async (response: Response): Promise<never> => {
  const payload: unknown = await response.json().catch(() => null);

  const message = readMessage(payload);

  if (response.status === UNAUTHORIZED && readSession()) {
    writeSession(null);
  }

  if (response.status === FORBIDDEN && message === ACCESS_REQUIRED) {
    writeAccess(null);
  }

  throw new ApiError(response.status, message);
};

export const apiGet = async <T>(
  path: string,
  query?: Record<string, QueryValue>,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(buildUrl(path, query), { signal, headers: authHeaders() });

  if (!response.ok) {
    return fail(response);
  }

  return (await response.json()) as T;
};

export const apiSend = async <T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      ...authHeaders(),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    return fail(response);
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
};

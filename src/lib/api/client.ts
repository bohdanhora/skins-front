const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api';

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

export const apiGet = async <T>(
  path: string,
  query?: Record<string, QueryValue>,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(buildUrl(path, query), { signal });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);

    throw new ApiError(response.status, readMessage(payload));
  }

  return (await response.json()) as T;
};

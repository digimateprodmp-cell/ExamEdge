const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4100/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  token?: string | null;
  body?: unknown;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string | string[];
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, body, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const text = await res.text();
  const json: Envelope<T> | undefined = text ? JSON.parse(text) : undefined;

  if (!res.ok || !json?.success) {
    const message = json?.message
      ? Array.isArray(json.message)
        ? json.message.join(', ')
        : json.message
      : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return json.data as T;
}

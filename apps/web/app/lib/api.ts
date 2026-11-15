import { clearToken, getToken } from './auth';
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://127.0.0.1:8787';
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
    public retryable?: boolean,
  ) {
    super(message);
  }
}
export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  const headers = new Headers();
  if (options.auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const isForm = options.body instanceof FormData;
  if (options.body !== undefined && !isForm) headers.set('Content-Type', 'application/json');
  const response = await fetch(API_ORIGIN + path, {
    method: options.method ?? 'GET',
    headers,
    body:
      options.body === undefined
        ? null
        : isForm
          ? (options.body as FormData)
          : JSON.stringify(options.body),
    signal: options.signal ?? null,
    cache: 'no-store',
    credentials: 'omit',
  });
  if (options.auth && [401, 403].includes(response.status)) {
    clearToken();
    window.dispatchEvent(new Event('owner-session-ended'));
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok)
    throw new APIError(
      response.status,
      data.error?.code ?? 'request_failed',
      data.error?.message ?? 'The request could not be completed.',
      data.error?.fields,
      data.error?.retryable,
    );
  return data as T;
}

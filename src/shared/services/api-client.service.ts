import type { AuthSession } from '../../features/auth/types/auth.types';

const AUTH_SESSION_STORAGE_KEY = 'onevault-auth-session';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function readToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession).token : null;
  } catch {
    return null;
  }
}

const RAW_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env
    ? ((import.meta.env.VITE_WORKER_URL as string | undefined) ||
       (import.meta.env.VITE_API_URL as string | undefined) ||
       '')
    : '') as string;
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

/**
 * Shared fetch wrapper for the onevault-worker API (`/api/*`).
 * Adds the session token and turns error responses into `ApiError`.
 * A 401 on an authenticated call clears the session and reloads to the sign-in page.
 */
export async function apiRequest<T>(
  path: string,
  init: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  // Security basic: prevent fetching hidden URLs or path traversal
  if (path.includes('..') || /(?:^|\/)\.[^/]/.test(path)) {
    throw new ApiError(403, 'Forbidden: Fetching hidden or restricted URL is not allowed.');
  }

  const { method = 'GET', body, auth = true } = init;
  const token = auth ? readToken() : null;

  const targetUrl = `${API_BASE}/api${path}`;
  const res = await fetch(targetUrl, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.location.reload();
  }

  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

import type { AuthSession } from '../../features/auth/types/auth.types';
import { syncQueueService, type SyncWriteOptions } from './sync-queue.service';

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

export interface ApiRequestOptions<T = unknown> {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /** When true, automatically enqueues the write to the Local-First Debounced Sync Engine */
  sync?: boolean;
  syncKey?: string;
  optimisticData?: T;
}

/**
 * Shared fetch wrapper for the onevault-worker API (`/api/*`).
 * Adds the session token and turns error responses into `ApiError`.
 * If `sync: true`, automatically routes through the Local-First Debounced Sync Engine.
 * A 401 on an authenticated call clears the session and reloads to the sign-in page.
 */
export async function apiRequest<T>(
  path: string,
  init: ApiRequestOptions<T> = {}
): Promise<T> {
  // If sync requested, route immediately through local-first sync queue
  if (init.sync) {
    return syncQueueService.syncWrite<T>(path, {
      method: (init.method || 'POST') as any,
      body: init.body,
      syncKey: init.syncKey,
      optimisticData: init.optimisticData,
    });
  }

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

export const apiClient = {
  // Direct Network Calls
  get: <T>(path: string) => apiRequest<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),

  /**
   * Universal Local-First Write:
   * 1. Returns immediately (perceived 0ms UI response with optimisticData or body).
   * 2. Persists to local queue and debounces (2.5s) while user is typing or active.
   * 3. Flushes automatically to Cloudflare D1 when user is idle or closes/switches tabs.
   */
  syncWrite: <T>(path: string, options: SyncWriteOptions<T> = {}) =>
    syncQueueService.syncWrite<T>(path, options),
  syncPatch: <T>(path: string, body?: unknown, syncKey?: string, optimisticData?: T) =>
    syncQueueService.syncWrite<T>(path, { method: 'PATCH', body, syncKey, optimisticData }),
  syncPut: <T>(path: string, body?: unknown, syncKey?: string, optimisticData?: T) =>
    syncQueueService.syncWrite<T>(path, { method: 'PUT', body, syncKey, optimisticData }),
  syncPost: <T>(path: string, body?: unknown, syncKey?: string, optimisticData?: T) =>
    syncQueueService.syncWrite<T>(path, { method: 'POST', body, syncKey, optimisticData }),
  syncDelete: <T>(path: string, syncKey?: string) =>
    syncQueueService.syncWrite<T>(path, { method: 'DELETE', syncKey }),
};

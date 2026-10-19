/**
 * OneVault — Local-First Debounced Batch Sync Queue Service
 * 
 * Architecture:
 * 1. Optimistic Local-First: Writes instantly to in-memory state & localStorage.
 * 2. Idle Debouncing: Queues mutations and waits for user idle (2.5s) before flushing.
 * 3. Lifecycle Flush: Automatically flushes on `visibilitychange` (tab switch/blur)
 *    and `beforeunload` (closing browser) to ensure zero data loss.
 * 4. Network Resilience: Automatically retries when regaining internet connection.
 */

import { apiRequest } from './api-client.service';

export type SyncMutationType =
  | 'mail_account_update'
  | 'mail_filter_preferences'
  | 'note_update'
  | 'custom';

export interface SyncWriteOptions<T = unknown> {
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  syncKey?: string;
  optimisticData?: T;
  type?: SyncMutationType;
}

export interface SyncMutation<T = unknown> {
  id: string;
  type: SyncMutationType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;
  enqueuedAt: number;
  retryCount: number;
}

export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'synced' | 'error';

type SyncStatusListener = (status: SyncStatus, pendingCount: number) => void;

const STORAGE_KEY = 'onevault_pending_sync_queue';
const IDLE_DEBOUNCE_MS = 2500;
const MAX_RETRIES = 3;

class SyncQueueService {
  private queue: Map<string, SyncMutation> = new Map();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isSyncing = false;
  private listeners: Set<SyncStatusListener> = new Set();
  private currentStatus: SyncStatus = 'idle';

  constructor() {
    this.restoreFromStorage();
    this.initLifecycleListeners();
  }

  /**
   * Restores pending mutations from localStorage if the user reloads or returns.
   */
  private restoreFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SyncMutation[] = JSON.parse(saved);
        for (const item of parsed) {
          this.queue.set(item.id, item);
        }
        if (this.queue.size > 0) {
          this.setStatus('pending');
        }
      }
    } catch {
      // Ignore corrupted localStorage entries
    }
  }

  /**
   * Persists current in-memory queue to localStorage.
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      if (this.queue.size === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const array = Array.from(this.queue.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
      }
    } catch {
      // Quota exceeded or private browsing restrictions
    }
  }

  /**
   * Attaches browser lifecycle events to flush on idle, tab switch, or page close.
   */
  private initLifecycleListeners(): void {
    if (typeof window === 'undefined') return;

    // Flush when user switches tabs or minimizes browser
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.queue.size > 0) {
        this.flush();
      }
    });

    // Flush when browser tab is closing
    window.addEventListener('beforeunload', () => {
      if (this.queue.size > 0) {
        this.flush();
      }
    });

    // Flush when internet connectivity is restored
    window.addEventListener('online', () => {
      if (this.queue.size > 0) {
        this.flush();
      }
    });
  }

  private setStatus(status: SyncStatus): void {
    this.currentStatus = status;
    const count = this.queue.size;
    for (const listener of this.listeners) {
      try {
        listener(status, count);
      } catch {
        // Listener errors shouldn't break the sync service
      }
    }
  }

  /**
   * Subscribe to sync lifecycle status updates.
   */
  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus, this.queue.size);
    return () => this.listeners.delete(listener);
  }

  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  public getPendingCount(): number {
    return this.queue.size;
  }

  /**
   * Enqueues a write mutation.
   * Duplicate mutations for the same `id` will overwrite/merge automatically.
   * Resets the idle debounce timer.
   */
  public enqueue<T>(mutation: Omit<SyncMutation<T>, 'enqueuedAt' | 'retryCount'>): void {
    const fullMutation: SyncMutation = {
      ...mutation,
      enqueuedAt: Date.now(),
      retryCount: 0,
    };

    this.queue.set(mutation.id, fullMutation);
    this.saveToStorage();
    this.setStatus('pending');

    // Reset idle timer (user is actively making changes)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, IDLE_DEBOUNCE_MS);
  }

  /**
   * Universal Local-First Write method:
   * 1. Merges into background queue and resets idle debounce (2.5s).
   * 2. Returns optimistic data immediately (0ms UI latency).
   * 3. Guarantees persistence across tab switches (`visibilitychange`) and browser closes (`beforeunload`).
   */
  public async syncWrite<T>(
    endpoint: string,
    options: SyncWriteOptions<T> = {}
  ): Promise<T> {
    const method = options.method || 'POST';
    const id = options.syncKey || `${method}:${endpoint}`;
    const type = options.type || 'custom';

    this.enqueue({
      id,
      type,
      endpoint,
      method,
      payload: options.body,
    });

    return (options.optimisticData ?? (options.body as T) ?? ({} as T));
  }

  /**
   * Immediately flushes the pending queue to the Cloudflare Worker API.
   */
  public async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.queue.size === 0 || this.isSyncing) return;

    this.isSyncing = true;
    this.setStatus('syncing');

    const mutations = Array.from(this.queue.values());

    for (const mutation of mutations) {
      try {
        await apiRequest(mutation.endpoint, {
          method: mutation.method,
          body: mutation.payload,
        });

        // Successfully synced to cloud
        this.queue.delete(mutation.id);
        this.saveToStorage();
      } catch (err) {
        mutation.retryCount += 1;
        if (mutation.retryCount >= MAX_RETRIES) {
          // Keep in storage but mark error
          this.setStatus('error');
        }
      }
    }

    this.isSyncing = false;
    if (this.queue.size === 0) {
      this.setStatus('synced');
      setTimeout(() => {
        if (this.queue.size === 0 && this.currentStatus === 'synced') {
          this.setStatus('idle');
        }
      }, 1500);
    } else {
      this.setStatus('pending');
    }
  }
}

export const syncQueueService = new SyncQueueService();

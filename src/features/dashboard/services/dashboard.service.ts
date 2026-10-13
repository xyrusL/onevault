import { apiRequest } from '../../../shared/services/api-client.service';
import type {
  DashboardStats,
  DdosDefenseTelemetry,
  ImmuneSystemTelemetry,
} from '../types/dashboard.types';

const DASHBOARD_CACHE_KEY = 'onevault.dashboard.cache.v1';
const AUTH_SESSION_STORAGE_KEY = 'onevault-auth-session';

let memoryStats: DashboardStats | null = (() => {
  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
    return raw ? (JSON.parse(raw) as DashboardStats) : null;
  } catch {
    return null;
  }
})();

let lastFetchedAt = 0;
const CLIENT_CACHE_TTL_MS = 45000; // 45 seconds TTL to protect Cloudflare Free Tier (100k req/day)

function persistCache(stats: DashboardStats) {
  memoryStats = stats;
  lastFetchedAt = Date.now();
  try {
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota
  }
}

export const dashboardService = {
  getCached(): DashboardStats | null {
    return memoryStats;
  },

  async getStats(forceRefresh = false): Promise<DashboardStats> {
    const isFresh =
      !forceRefresh &&
      memoryStats !== null &&
      memoryStats.ddosDefense !== undefined &&
      memoryStats.immuneSystem !== undefined &&
      Date.now() - lastFetchedAt < CLIENT_CACHE_TTL_MS;

    if (isFresh && memoryStats) {
      return memoryStats;
    }

    const data = await apiRequest<DashboardStats>('/dashboard/stats');
    persistCache(data);
    return data;
  },

  /** Zero-DB lightweight latency check against edge worker */
  async pingEdge(): Promise<{ latencyMs: number; status: 'ok' | 'error' }> {
    const start = performance.now();
    try {
      await apiRequest<{ status: string }>('/dashboard/ping');
      const latencyMs = Math.round(performance.now() - start);
      return { latencyMs, status: 'ok' };
    } catch {
      const latencyMs = Math.round(performance.now() - start);
      return { latencyMs, status: 'error' };
    }
  },

  /**
   * Executes the 12-Scenario Automated Security & Zero-False-Positive Verification Suite
   * on the Adaptive Threat Guard (IPS) engine.
   */
  async runImmuneVerificationSuite(): Promise<ImmuneSystemTelemetry> {
    const res = await apiRequest<{ immuneSystem: ImmuneSystemTelemetry }>(
      '/dashboard/security/threat-guard-test',
      {
        method: 'POST',
        body: {},
      }
    );
    if (memoryStats) {
      persistCache({ ...memoryStats, immuneSystem: res.immuneSystem });
    }
    return res.immuneSystem;
  },

  /**
   * Logs out all previous devices & rotates/pins the current browser's HMAC token
   */
  async lockdownToCurrentDevice(): Promise<DdosDefenseTelemetry> {
    const res = await apiRequest<{
      token: string;
      email: string;
      ddosDefense: DdosDefenseTelemetry;
    }>('/dashboard/security/lockdown', {
      method: 'POST',
      body: { action: 'lockdown_sessions' },
    });

    if (res.token) {
      try {
        const existingRaw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
        const existing = existingRaw
          ? (JSON.parse(existingRaw) as { email?: string; token?: string })
          : {};
        localStorage.setItem(
          AUTH_SESSION_STORAGE_KEY,
          JSON.stringify({
            email: res.email || existing.email || 'admin@admin.com',
            token: res.token,
          })
        );
      } catch {
        // Ignore storage error
      }
    }

    if (memoryStats) {
      persistCache({ ...memoryStats, ddosDefense: res.ddosDefense });
    }
    return res.ddosDefense;
  },

  /**
   * Updates temporary Edge Self-Defense mode or toggles individual protection layers
   */
  async updateDefenseConfig(patch: {
    active?: boolean;
    zeroD1Gate?: boolean;
    singleDeviceLock?: boolean;
    slidingRateLimit?: boolean;
    d1PayloadCircuit?: boolean;
    botSignatureScrubber?: boolean;
  }): Promise<DdosDefenseTelemetry> {
    const res = await apiRequest<{ ddosDefense: DdosDefenseTelemetry }>(
      '/dashboard/security/lockdown',
      {
        method: 'POST',
        body: { action: 'update_config', ...patch },
      }
    );
    if (memoryStats) {
      persistCache({ ...memoryStats, ddosDefense: res.ddosDefense });
    }
    return res.ddosDefense;
  },
};



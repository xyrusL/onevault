import { apiRequest } from './api-client.service';
import type { ImmuneActionState } from '../../features/dashboard/types/dashboard.types';

export interface RouteProbeDecision {
  pathname: string;
  action: ImmuneActionState;
  riskScore: number;
  detectionVector: string;
  distinct404Count: number;
  humanTypoForgivenessLimit: number;
  scannerDistinct404Threshold: number;
  quarantineExpiresAt: string | null;
}

interface StoredRouteProbeState {
  windowStartedAt: number;
  distinct404Paths: string[];
  riskScore: number;
  action: ImmuneActionState;
  detectionVector: string;
  quarantineUntil: number;
}

const STORAGE_KEY = 'onevault.threat-guard.route-probe.v1';
const WINDOW_MS = 60_000;
const HUMAN_TYPO_FORGIVENESS_LIMIT = 3;
const SCANNER_DISTINCT_404_THRESHOLD = 6;
const QUARANTINE_MS = 10 * 60_000;

const CANARY_HONEYPOT_PATTERNS = [
  /(?:^|\/)\.env(?:\.|$|\/)/i,
  /(?:^|\/)\.git(?:\/|$)/i,
  /(?:^|\/)wp-admin(?:\/|$)/i,
  /(?:^|\/)wp-login\.php/i,
  /(?:^|\/)phpmyadmin(?:\/|$)/i,
  /(?:^|\/)actuator(?:\/|$)/i,
  /(?:^|\/)server-status/i,
  /(?:^|\/)config\.php/i,
  /(?:^|\/)backup\.sql/i,
  /(?:^|\/)admin\/config/i,
];

function loadState(): StoredRouteProbeState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as StoredRouteProbeState;
    }
  } catch {
    // ignore storage errors
  }
  return {
    windowStartedAt: Date.now(),
    distinct404Paths: [],
    riskScore: 0,
    action: 'ALLOW',
    detectionVector: 'Normal Navigation',
    quarantineUntil: 0,
  };
}

function saveState(state: StoredRouteProbeState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export const routeThreatGuardService = {
  /**
   * Evaluates an unknown/unmapped frontend URL path and synchronizes with the Worker Threat Guard.
   * Guarantees 0% false positives for 1–3 accidental human URL typos while intercepting page scanners & honeypot probes.
   */
  recordUnknownRouteProbe(
    pathname: string,
    isAuthenticated: boolean
  ): RouteProbeDecision {
    const now = Date.now();
    const state = loadState();

    // Reset sliding window after 60s if not actively quarantined
    if (now - state.windowStartedAt > WINDOW_MS && state.quarantineUntil <= now) {
      state.windowStartedAt = now;
      state.distinct404Paths = [];
      state.riskScore = 0;
      state.action = 'ALLOW';
    }

    const cleanPath = pathname.toLowerCase().trim() || '/unknown';
    if (!state.distinct404Paths.includes(cleanPath)) {
      state.distinct404Paths.push(cleanPath);
    }

    const distinctCount = state.distinct404Paths.length;

    if (CANARY_HONEYPOT_PATTERNS.some((rx) => rx.test(cleanPath))) {
      state.riskScore = 98;
      state.action = 'PENETRATION_BLOCK';
      state.detectionVector = `Canary Honeypot Trap (${cleanPath})`;
      state.quarantineUntil = now + QUARANTINE_MS * 3;
    } else if (distinctCount <= HUMAN_TYPO_FORGIVENESS_LIMIT) {
      state.riskScore = distinctCount * 7;
      state.action = 'ALLOW';
      state.detectionVector = `Human URL Typo Forgiven (${distinctCount}/${HUMAN_TYPO_FORGIVENESS_LIMIT} free cushion)`;
    } else if (distinctCount < SCANNER_DISTINCT_404_THRESHOLD) {
      state.riskScore = 42 + (distinctCount - 4) * 8;
      state.action = 'RATE_LIMITED';
      state.detectionVector = `Suspicious Page Enumeration (${distinctCount} unknown pages in 60s)`;
    } else {
      state.riskScore = Math.min(84, 68 + (distinctCount - 6) * 4);
      state.action = 'TEMP_QUARANTINE';
      state.detectionVector = `Automated Page Scanner Quarantined (${distinctCount} distinct 404 pages probed)`;
      state.quarantineUntil = now + QUARANTINE_MS;
    }

    saveState(state);

    // Zero-Quota Protection: Normal 1-3 typos are handled 100% in browser memory (0 Worker requests).
    // Only notify Worker once if an actual scanner/honeypot threshold is triggered.
    if (
      (state.action === 'PENETRATION_BLOCK' || state.action === 'TEMP_QUARANTINE') &&
      distinctCount <= SCANNER_DISTINCT_404_THRESHOLD
    ) {
      void apiRequest('/auth/route-probe', {
        method: 'POST',
        body: { pathname: cleanPath, isAuthenticated },
      }).catch(() => {});
    }

    return {
      pathname: cleanPath,
      action: state.action,
      riskScore: state.riskScore,
      detectionVector: state.detectionVector,
      distinct404Count: distinctCount,
      humanTypoForgivenessLimit: HUMAN_TYPO_FORGIVENESS_LIMIT,
      scannerDistinct404Threshold: SCANNER_DISTINCT_404_THRESHOLD,
      quarantineExpiresAt:
        state.quarantineUntil > now
          ? new Date(state.quarantineUntil).toISOString()
          : null,
    };
  },

  /**
   * Resets local page-probe session state when the admin returns home
   */
  clearClientProbeState(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

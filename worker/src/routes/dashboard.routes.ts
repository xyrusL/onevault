import { Hono } from 'hono';
import { authService } from '../services/auth.service';
import { dashboardService } from '../services/dashboard.service';
import { edgeDefenseService } from '../services/edge-defense.service';
import { threatGuardService } from '../services/threat-guard.service';
import type { AppBindings } from '../types/env.types';

export const dashboardRoutes = new Hono<AppBindings>();

/** GET /api/dashboard/stats — Aggregates real-time metrics across all vault modules */
dashboardRoutes.get('/stats', async (c) => {
  const cf = (c.req.raw as Request & { cf?: IncomingRequestCfProperties }).cf;
  const stats = await dashboardService.getStats(c.env, cf);
  c.header('Cache-Control', 'private, max-age=15');
  return c.json(stats);
});

/** GET /api/dashboard/ping — Zero-DB lightweight edge heartbeat latency check */
dashboardRoutes.get('/ping', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/dashboard/security/threat-guard-test — Executes the 12-Scenario Automated Security &
 * Zero-False-Positive Verification Suite on the Adaptive Threat Guard (IPS) engine.
 */
dashboardRoutes.post('/security/threat-guard-test', (c) => {
  threatGuardService.runVerificationSuite();
  const immuneSystem = threatGuardService.getThreatGuardTelemetry();
  return c.json({ immuneSystem });
});

/**
 * POST /api/dashboard/security/lockdown — Rotates & pins current device session
 * (logging out all previous devices) or updates temporary Edge Self-Defense layers.
 */
dashboardRoutes.post('/security/lockdown', async (c) => {
  interface LockdownRequestBody {
    action?: 'lockdown_sessions' | 'update_config';
    active?: boolean;
    zeroD1Gate?: boolean;
    singleDeviceLock?: boolean;
    slidingRateLimit?: boolean;
    d1PayloadCircuit?: boolean;
    botSignatureScrubber?: boolean;
  }
  const body = await c.req
    .json<LockdownRequestBody>()
    .catch((): LockdownRequestBody => ({}));

  const cf = (c.req.raw as Request & { cf?: IncomingRequestCfProperties }).cf;
  const email = c.get('userEmail') || c.env.ADMIN_EMAIL || 'admin@admin.com';

  if (body.action === 'lockdown_sessions') {
    const newToken = await authService.createToken(c.env, email);
    const pinInfo = edgeDefenseService.pinNewDeviceToken(
      newToken,
      c.req.header('User-Agent')
    );

    // Record the Single-Device Session Lock in D1 audit logs
    if (c.env.DB) {
      const logId = `audit_lockdown_${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();
      c.executionCtx.waitUntil(
        c.env.DB.prepare(
          `INSERT INTO system_audit_logs (id, level, category, title, message, details, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            logId,
            'info',
            'auth',
            'Single-Device Session Lock Activated',
            'Previous device sessions revoked; authentication pinned exclusively to current device.',
            `Device: ${pinInfo.pinnedDeviceLabel} · Revoked sessions: ${pinInfo.revokedPreviousSessions}`,
            now
          )
          .run()
          .catch(() => {})
      );
    }

    const ddosDefense = edgeDefenseService.getDefenseTelemetry(c.env, cf);
    return c.json({
      token: newToken,
      email,
      ddosDefense,
    });
  }

  edgeDefenseService.updateDefenseConfig(body);
  const ddosDefense = edgeDefenseService.getDefenseTelemetry(c.env, cf);
  return c.json({ ddosDefense });
});



import { Hono } from 'hono';
import { HttpError } from '../lib/http-error';
import { backupService } from '../services/backup.service';
import type { AppBindings } from '../types/env.types';

export const backupRoutes = new Hono<AppBindings>();

/** GET /api/backup/stats - Item counts across all vault collections */
backupRoutes.get('/stats', async (c) => {
  const stats = await backupService.getVaultStats(c.env);
  return c.json(stats);
});

/** GET /api/backup/export - Complete vault bundle */
backupRoutes.get('/export', async (c) => {
  const url = new URL(c.req.url);
  const hostname = url.hostname || 'onevault.app';
  const data = await backupService.exportVault(c.env, hostname);
  return c.json(data);
});

/** POST /api/backup/import - Smart merge incoming vault data */
backupRoutes.post('/import', async (c) => {
  const body = await c.req
    .json<{ data?: any; collections?: any }>()
    .catch(() => ({} as { data?: any; collections?: any }));

  if (!body || (!body.data && !body.collections)) {
    throw new HttpError(400, 'Invalid import request. Missing vault collections payload.');
  }

  const payload = body.data || body;
  const result = await backupService.importVault(c.env, payload);
  return c.json(result);
});

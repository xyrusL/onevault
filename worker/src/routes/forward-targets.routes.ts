import { Hono } from 'hono';
import { HttpError } from '../lib/http-error';
import { forwardTargetsService } from '../services/forward-targets.service';
import type { AppBindings } from '../types/env.types';

export const forwardTargetsRoutes = new Hono<AppBindings>();

/** GET /api/forward-targets — destination addresses (verified flag included) */
forwardTargetsRoutes.get('/', async (c) => c.json(await forwardTargetsService.list(c.env)));

/** POST /api/forward-targets — register a destination; Cloudflare sends a verification email */
forwardTargetsRoutes.post('/', async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}) as { email?: string });
  if (!body.email) throw new HttpError(400, 'Email is required.');
  return c.json(await forwardTargetsService.create(c.env, body.email.trim().toLowerCase()), 201);
});

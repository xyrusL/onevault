import { Hono } from 'hono';
import { HttpError } from '../lib/http-error';
import { mailService } from '../services/mail.service';
import type { AppBindings } from '../types/env.types';

export const mailRoutes = new Hono<AppBindings>();

/** GET /api/mail */
mailRoutes.get('/', async (c) => c.json(await mailService.list(c.env)));

/** POST /api/mail  { localPart, domain, forwardTo, note } */
mailRoutes.post('/', async (c) => {
  const body = await c.req
    .json<{
      localPart?: string;
      domain?: string;
      forwardTo?: string | null;
      note?: string | null;
    }>()
    .catch(
      () =>
        ({}) as {
          localPart?: string;
          domain?: string;
          forwardTo?: string | null;
          note?: string | null;
        }
    );

  if (!body.localPart || !body.domain) {
    throw new HttpError(400, 'localPart and domain are required.');
  }

  const created = await mailService.create(c.env, {
    localPart: body.localPart,
    domain: body.domain,
    forwardTo: body.forwardTo ?? null,
    note: body.note ?? null,
  });
  return c.json(created, 201);
});

/** GET /api/mail/preferences */
mailRoutes.get('/preferences', async (c) => {
  try {
    await c.env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS app_preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )`
    ).run();
    const row = await c.env.DB.prepare(
      'SELECT value FROM app_preferences WHERE key = ?'
    ).bind('mail_filters').first<{ value: string }>();
    if (!row) return c.json({ preferences: null });
    return c.json({ preferences: JSON.parse(row.value) });
  } catch {
    return c.json({ preferences: null });
  }
});

/** POST /api/mail/preferences */
mailRoutes.post('/preferences', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    await c.env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS app_preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )`
    ).run();
    await c.env.DB.prepare(
      `INSERT INTO app_preferences (key, value, updated_at)
       VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`
    ).bind('mail_filters', JSON.stringify(body)).run();
  } catch {}
  return c.json({ ok: true, preferences: body });
});

/** PATCH /api/mail/:id  { forwardTo, note } */
mailRoutes.patch('/:id', async (c) => {
  const body = await c.req
    .json<{ forwardTo?: string | null; note?: string | null }>()
    .catch(() => ({}) as { forwardTo?: string | null; note?: string | null });
  return c.json(await mailService.update(c.env, c.req.param('id'), body));
});

/** DELETE /api/mail/:id */
mailRoutes.delete('/:id', async (c) => {
  await mailService.remove(c.env, c.req.param('id'));
  return c.body(null, 204);
});

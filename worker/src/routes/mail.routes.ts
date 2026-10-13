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

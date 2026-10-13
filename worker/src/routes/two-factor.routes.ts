import { Hono } from 'hono';
import { HttpError } from '../lib/http-error';
import { twoFactorService } from '../services/two-factor.service';
import type { AppBindings } from '../types/env.types';
import type { CreateTwoFactorInput } from '../types/two-factor.types';

export const twoFactorRoutes = new Hono<AppBindings>();

/** GET /api/two-factor */
twoFactorRoutes.get('/', async (c) => c.json(await twoFactorService.list(c.env)));

/** POST /api/two-factor */
twoFactorRoutes.post('/', async (c) => {
  const body = await c.req
    .json<Partial<CreateTwoFactorInput>>()
    .catch(() => ({}) as Partial<CreateTwoFactorInput>);

  if (!body.issuer || !body.label || !body.secret || !body.otpauthUri) {
    throw new HttpError(400, 'issuer, label, secret, and otpauthUri are required.');
  }

  const created = await twoFactorService.create(c.env, {
    issuer: body.issuer,
    label: body.label,
    secret: body.secret,
    algorithm: body.algorithm,
    digits: body.digits,
    period: body.period,
    otpauthUri: body.otpauthUri,
  });
  return c.json(created, 201);
});

/** DELETE /api/two-factor/:id */
twoFactorRoutes.delete('/:id', async (c) => {
  await twoFactorService.remove(c.env, c.req.param('id'));
  return c.body(null, 204);
});

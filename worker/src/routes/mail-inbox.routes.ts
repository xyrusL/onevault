import { Hono } from 'hono';
import { mailInboxService } from '../services/mail-inbox.service';
import type { AppBindings } from '../types/env.types';

export const mailInboxRoutes = new Hono<AppBindings>();

/** GET /api/mail-inbox/activity — list all incoming email routing activity (Forwarded + None) */
mailInboxRoutes.get('/activity', async (c) => {
  const activity = await mailInboxService.listActivity(c.env);
  return c.json(activity);
});

/** PATCH /api/mail-inbox/activity/:messageId/read — mark a single activity item as read */
mailInboxRoutes.patch('/activity/:messageId/read', async (c) => {
  await mailInboxService.markActivityRead(c.env, c.req.param('messageId'));
  return c.json({ ok: true });
});

/** POST /api/mail-inbox/activity/read-all — mark all unread activity items as read */
mailInboxRoutes.post('/activity/read-all', async (c) => {
  await mailInboxService.markAllActivityRead(c.env);
  return c.json({ ok: true });
});

/** GET /api/mail-inbox/:accountId — list inbox messages for a mailbox */
mailInboxRoutes.get('/:accountId', async (c) => {
  const messages = await mailInboxService.listByAccount(
    c.env,
    c.req.param('accountId')
  );
  return c.json(messages);
});

/** GET /api/mail-inbox/:accountId/messages/:messageId — get full formatted + raw message */
mailInboxRoutes.get('/:accountId/messages/:messageId', async (c) => {
  const detail = await mailInboxService.getMessageDetail(
    c.env,
    c.req.param('accountId'),
    c.req.param('messageId')
  );
  return c.json(detail);
});

/** DELETE /api/mail-inbox/:accountId/messages/:messageId — delete a message */
mailInboxRoutes.delete('/:accountId/messages/:messageId', async (c) => {
  await mailInboxService.removeMessage(
    c.env,
    c.req.param('accountId'),
    c.req.param('messageId')
  );
  return c.body(null, 204);
});

import { HttpError } from '../lib/http-error';
import { parseIncomingMime } from '../lib/mime-parser';
import type { Env } from '../types/env.types';
import type {
  MailActivityDto,
  MailActivityRecord,
  MailMessageDetailDto,
  MailMessageRecord,
  MailMessageSummaryDto,
} from '../types/mail-inbox.types';
import type { MailAccountRecord } from '../types/mail.types';
import { domainsService } from './domains.service';

function toSummaryDto(row: MailMessageRecord): MailMessageSummaryDto {
  return {
    id: row.id,
    mailAccountId: row.mail_account_id,
    recipientEmail: row.recipient_email,
    sender: row.sender,
    senderName: row.sender_name,
    subject: row.subject,
    snippet: row.snippet,
    isRead: Boolean(row.is_read),
    receivedAt: row.received_at,
  };
}

function toDetailDto(row: MailMessageRecord): MailMessageDetailDto {
  return {
    ...toSummaryDto(row),
    textBody: row.text_body,
    htmlBody: row.html_body,
    rawMime: row.raw_mime,
  };
}

function toActivityDto(row: MailActivityRecord): MailActivityDto {
  return {
    id: row.id,
    mailAccountId: row.mail_account_id,
    recipientEmail: row.recipient_email,
    sender: row.sender,
    senderName: row.sender_name,
    subject: row.subject,
    snippet: row.snippet,
    isRead: Boolean(row.is_read),
    receivedAt: row.received_at,
    forwardTo: row.forward_to,
  };
}

/** Parses an RFC-5322 `From` header (e.g. `"Alice <alice@example.com>"`) without consuming raw stream. */
function parseFromHeader(
  rawFrom: string | null | undefined,
  fallbackFrom: string
): { sender: string; senderName: string } {
  const cleaned = (rawFrom || '').trim();
  const angleMatch = cleaned.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/);
  if (angleMatch) {
    const email = angleMatch[2].trim() || fallbackFrom || 'unknown@sender';
    const name =
      angleMatch[1]?.trim() || email.split('@')[0] || 'Unknown Sender';
    return { sender: email, senderName: name };
  }
  const email = cleaned || fallbackFrom || 'unknown@sender';
  const name = email.split('@')[0] || 'Unknown Sender';
  return { sender: email, senderName: name };
}

export const mailInboxService = {
  /**
   * Saves an incoming email into `onevault-storage` D1 when the mailbox
   * has `forward_to === null` ("None").
   */
  async saveIncomingMessage(
    env: Env,
    account: MailAccountRecord,
    rawSource: ReadableStream<Uint8Array> | ArrayBuffer | string,
    fallbackFrom: string
  ): Promise<MailMessageDetailDto> {
    const parsed = await parseIncomingMime(rawSource, fallbackFrom);
    const id = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO mail_messages (
         id, mail_account_id, recipient_email, sender, sender_name,
         subject, snippet, text_body, html_body, raw_mime, is_read
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    )
      .bind(
        id,
        account.id,
        account.email.toLowerCase(),
        parsed.sender,
        parsed.senderName,
        parsed.subject,
        parsed.snippet,
        parsed.textBody,
        parsed.htmlBody,
        parsed.rawMime
      )
      .run();

    const saved = await env.DB.prepare('SELECT * FROM mail_messages WHERE id = ?')
      .bind(id)
      .first<MailMessageRecord>();
    return toDetailDto(saved as MailMessageRecord);
  },

  /**
   * Records a lightweight activity entry in D1 when an incoming email is forwarded
   * to an external address (e.g. Gmail), without consuming the raw stream needed by `message.forward()`.
   */
  async saveForwardedActivity(
    env: Env,
    account: MailAccountRecord,
    fallbackFrom: string,
    headers?: Headers
  ): Promise<void> {
    const id = crypto.randomUUID();
    const { sender, senderName } = parseFromHeader(
      headers?.get('from'),
      fallbackFrom
    );
    const subject = headers?.get('subject')?.trim() || '(No subject)';
    const snippet = account.forward_to
      ? `Forwarded to ${account.forward_to}`
      : 'Forwarded email';

    await env.DB.prepare(
      `INSERT INTO mail_messages (
         id, mail_account_id, recipient_email, sender, sender_name,
         subject, snippet, text_body, html_body, raw_mime, is_read
       ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, '', 0)`
    )
      .bind(
        id,
        account.id,
        account.email.toLowerCase(),
        sender,
        senderName,
        subject,
        snippet
      )
      .run();
  },

  /**
   * Lists all incoming email routing activity across all mailboxes (both Forwarded and None).
   * Combines stored D1 messages with live Cloudflare Email Routing activity log events
   * retrieved via Cloudflare's GraphQL API (emailRoutingAdaptive).
   */
  async listActivity(env: Env): Promise<MailActivityDto[]> {
    // 1. Fetch locally stored D1 activity / messages
    let localItems: MailActivityDto[] = [];
    try {
      const { results } = await env.DB.prepare(
        `SELECT
           m.id,
           m.mail_account_id,
           m.recipient_email,
           m.sender,
           m.sender_name,
           m.subject,
           m.snippet,
           m.is_read,
           m.received_at,
           a.forward_to
         FROM mail_messages m
         LEFT JOIN mail_accounts a ON a.id = m.mail_account_id
         ORDER BY m.received_at DESC
         LIMIT 200`
      ).all<MailActivityRecord>();

      localItems = results.map(toActivityDto);
    } catch (err) {
      console.warn('Failed to query local mail_messages:', err);
    }

    // 2. Map existing mail_accounts in D1 for fast lookups
    const accountsByEmail = new Map<string, { id: string; forwardTo: string | null }>();
    try {
      const { results: accRows } = await env.DB.prepare(
        'SELECT id, email, forward_to FROM mail_accounts'
      ).all<{ id: string; email: string; forward_to: string | null }>();
      for (const acc of accRows) {
        accountsByEmail.set(acc.email.toLowerCase(), { id: acc.id, forwardTo: acc.forward_to });
      }
    } catch (err) {
      console.warn('Failed to query mail_accounts for activity mapping:', err);
    }

    // 3. Fetch live Cloudflare Email Routing Activity Log via GraphQL
    const cfItems: MailActivityDto[] = [];
    if (env.CF_API_TOKEN) {
      try {
        const zones = await domainsService.listZones(env);
        if (zones.length > 0) {
          const zoneTags = zones.map((z) => z.id);
          // Query within the last 28 days (Cloudflare limit is 4 weeks)
          const startTime = new Date(Date.now() - 28 * 86400000).toISOString();

          const gqlQuery = `query EmailActivity($zoneTags: [String!]!, $start: Time!) {
            viewer {
              zones(filter: { zoneTag_in: $zoneTags }) {
                zoneTag
                emailRoutingAdaptive(
                  filter: { datetime_geq: $start }
                  limit: 100
                  orderBy: [datetime_DESC]
                ) {
                  datetime
                  from
                  to
                  subject
                  status
                  action
                  errorDetail
                }
              }
            }
          }`;

          const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.CF_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: gqlQuery,
              variables: { zoneTags, start: startTime },
            }),
          });

          if (res.ok) {
            const body = (await res.json()) as {
              data?: {
                viewer?: {
                  zones?: Array<{
                    zoneTag: string;
                    emailRoutingAdaptive?: Array<{
                      datetime: string;
                      from: string;
                      to: string;
                      subject: string;
                      status: string;
                      action: string;
                      errorDetail?: string;
                    }>;
                  }>;
                };
              };
            };

            let eventIndex = 0;
            const zonesData = body.data?.viewer?.zones || [];
            for (const zone of zonesData) {
              for (const event of zone.emailRoutingAdaptive || []) {
                eventIndex++;
                const toLower = (event.to || '').toLowerCase().trim();
                const matchedAccount = accountsByEmail.get(toLower);
                const { sender, senderName } = parseFromHeader(event.from, 'unknown@sender');
                const forwardTarget =
                  matchedAccount?.forwardTo ??
                  (event.action === 'forward' ? 'Forwarded' : 'None');

                // Guaranteed unique deterministic ID based on recipient + timestamp + sender + subject + index
                let h = 0x811c9dc5;
                const rawKey = `${toLower}_${event.datetime}_${sender}_${event.subject || ''}_${eventIndex}`;
                for (let k = 0; k < rawKey.length; k++) {
                  h ^= rawKey.charCodeAt(k);
                  h = Math.imul(h, 0x01000193);
                }
                const eventId = `cf_${(h >>> 0).toString(36)}_${eventIndex}`;

                cfItems.push({
                  id: eventId,
                  mailAccountId: matchedAccount?.id || '',
                  recipientEmail: event.to,
                  sender,
                  senderName,
                  subject: event.subject || '(No subject)',
                  snippet:
                    event.action === 'forward'
                      ? `Forwarded to ${forwardTarget}`
                      : event.errorDetail || `Status: ${event.status || event.action}`,
                  isRead: true, // Cloudflare forwarded activities are successfully delivered
                  receivedAt: event.datetime,
                  forwardTo: forwardTarget,
                });
              }
            }
          }
        }
      } catch (cfErr) {
        console.warn('Failed to fetch Cloudflare email routing activity:', cfErr);
      }
    }

    // 4. Merge and deduplicate by (recipient + sender + subject + time window)
    const seen = new Set<string>();
    const combined: MailActivityDto[] = [];

    // Local items first (may have full content/inbox state)
    for (const item of localItems) {
      const timeBucket = Math.floor(new Date(item.receivedAt).getTime() / 600000);
      const dedupeKey = `${item.recipientEmail.toLowerCase()}_${item.sender.toLowerCase()}_${item.subject.toLowerCase()}_${timeBucket}`;
      seen.add(dedupeKey);
      combined.push(item);
    }

    // Add Cloudflare items that are not already present
    for (const item of cfItems) {
      const timeBucket = Math.floor(new Date(item.receivedAt).getTime() / 600000);
      const dedupeKey = `${item.recipientEmail.toLowerCase()}_${item.sender.toLowerCase()}_${item.subject.toLowerCase()}_${timeBucket}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        combined.push(item);
      }
    }

    // Sort newest first
    combined.sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    return combined.slice(0, 200);
  },

  /** Marks a single activity/message entry as read (`is_read = 1`). */
  async markActivityRead(env: Env, messageId: string): Promise<void> {
    if (messageId.startsWith('cf_')) {
      return;
    }
    await env.DB.prepare('UPDATE mail_messages SET is_read = 1 WHERE id = ?')
      .bind(messageId)
      .run();
  },

  /** Marks all unread activity/message entries as read (`is_read = 1`). */
  async markAllActivityRead(env: Env): Promise<void> {
    await env.DB.prepare('UPDATE mail_messages SET is_read = 1 WHERE is_read = 0')
      .run();
  },

  /** Lists all stored messages for a specific `None`-forwarding mailbox. */
  async listByAccount(env: Env, accountId: string): Promise<MailMessageSummaryDto[]> {
    const account = await env.DB.prepare(
      'SELECT id, email FROM mail_accounts WHERE id = ?'
    )
      .bind(accountId)
      .first<{ id: string; email: string }>();
    if (!account) {
      throw new HttpError(404, 'Mail account not found.');
    }

    const { results } = await env.DB.prepare(
      `SELECT id, mail_account_id, recipient_email, sender, sender_name,
              subject, snippet, is_read, received_at,
              NULL as text_body, NULL as html_body, '' as raw_mime
       FROM mail_messages
       WHERE mail_account_id = ? OR recipient_email = ?
       ORDER BY received_at DESC`
    )
      .bind(account.id, account.email.toLowerCase())
      .all<MailMessageRecord>();

    return results.map(toSummaryDto);
  },

  /** Returns the full message (HTML, plain text, and raw MIME) and marks it read. */
  async getMessageDetail(
    env: Env,
    accountId: string,
    messageId: string
  ): Promise<MailMessageDetailDto> {
    const row = await env.DB.prepare(
      'SELECT * FROM mail_messages WHERE id = ? AND mail_account_id = ?'
    )
      .bind(messageId, accountId)
      .first<MailMessageRecord>();

    if (!row) {
      throw new HttpError(404, 'Message not found.');
    }

    if (!row.is_read) {
      await env.DB.prepare('UPDATE mail_messages SET is_read = 1 WHERE id = ?')
        .bind(messageId)
        .run();
      row.is_read = 1;
    }

    return toDetailDto(row);
  },

  /** Deletes a stored message from D1. */
  async removeMessage(env: Env, accountId: string, messageId: string): Promise<void> {
    const result = await env.DB.prepare(
      'DELETE FROM mail_messages WHERE id = ? AND mail_account_id = ?'
    )
      .bind(messageId, accountId)
      .run();

    if (!result.meta.changes) {
      throw new HttpError(404, 'Message not found.');
    }
  },
};

import { cfFetch } from '../lib/cloudflare-api';
import { HttpError } from '../lib/http-error';
import type { Env } from '../types/env.types';
import type {
  CreateMailInput,
  MailAccountDto,
  MailAccountRecord,
  UpdateMailInput,
} from '../types/mail.types';
import { domainsService } from './domains.service';
import { forwardTargetsService } from './forward-targets.service';

const LOCAL_PART_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CfRoutingRuleMatcher {
  type: 'literal' | 'all' | string;
  field?: 'to' | string;
  value?: string;
}

interface CfRoutingRuleAction {
  type: 'forward' | 'drop' | 'worker' | string;
  value?: string[];
}

interface CfRoutingRule {
  id: string;
  tag?: string;
  name?: string;
  enabled?: boolean;
  matchers?: CfRoutingRuleMatcher[];
  actions?: CfRoutingRuleAction[];
}

function toDto(row: MailAccountRecord): MailAccountDto {
  return {
    id: row.id,
    localPart: row.local_part,
    domain: row.domain,
    email: row.email,
    forwardTo: row.forward_to,
    note: row.note ?? null,
    createdAt: row.created_at,
  };
}

async function assertForwardAllowed(env: Env, forwardTo: string | null) {
  if (!forwardTo) return;
  if (!EMAIL_PATTERN.test(forwardTo)) {
    throw new HttpError(400, 'Forward address is not a valid email.');
  }
  if (!(await forwardTargetsService.isVerified(env, forwardTo))) {
    throw new HttpError(
      400,
      `${forwardTo} is not a verified destination address in Cloudflare Email Routing.`
    );
  }
}

function buildRulePayload(
  email: string,
  forwardTo: string | null,
  noneAction: CfRoutingRuleAction
) {
  return {
    name: `onevault: ${email}`,
    enabled: true,
    matchers: [{ type: 'literal', field: 'to', value: email }],
    actions: forwardTo ? [{ type: 'forward', value: [forwardTo] }] : [noneAction],
  };
}

/**
 * When `forwardTo` is null ("None"), routes the rule to `onevault-worker` so incoming
 * emails are saved to D1; falls back to `drop` only if the worker isn't deployed yet.
 */
async function upsertCloudflareRule(
  env: Env,
  zoneId: string,
  email: string,
  forwardTo: string | null,
  existingRuleId?: string
): Promise<CfRoutingRule> {
  const path = existingRuleId
    ? `/zones/${zoneId}/email/routing/rules/${existingRuleId}`
    : `/zones/${zoneId}/email/routing/rules`;
  const method = existingRuleId ? 'PUT' : 'POST';

  const workerAction: CfRoutingRuleAction = {
    type: 'worker',
    value: [env.WORKER_NAME || 'onevault-worker'],
  };

  try {
    return await cfFetch<CfRoutingRule>(env, path, {
      method,
      body: JSON.stringify(buildRulePayload(email, forwardTo, workerAction)),
    });
  } catch (err) {
    if (
      !forwardTo &&
      err instanceof HttpError &&
      /script|worker/i.test(err.message)
    ) {
      return await cfFetch<CfRoutingRule>(env, path, {
        method,
        body: JSON.stringify(
          buildRulePayload(email, forwardTo, { type: 'drop' })
        ),
      });
    }
    throw err;
  }
}

/**
 * Syncs Cloudflare Email Routing rules across all active account zones into D1.
 * - Imports rules created directly in the Cloudflare dashboard (e.g., testing@ainxe.com)
 * - Updates forwarding target in D1 if changed in Cloudflare dashboard
 * - Removes D1 rows if the rule was deleted in Cloudflare dashboard
 */
async function syncWithCloudflare(env: Env): Promise<void> {
  const zones = await domainsService.listZones(env);
  if (!zones.length) return;

  const { results: existingRows } = await env.DB.prepare(
    'SELECT * FROM mail_accounts'
  ).all<MailAccountRecord>();

  const byRuleId = new Map<string, MailAccountRecord>();
  const byEmail = new Map<string, MailAccountRecord>();
  for (const row of existingRows) {
    if (row.routing_rule_id) byRuleId.set(row.routing_rule_id, row);
    byEmail.set(row.email.toLowerCase(), row);
  }

  const seenIds = new Set<string>();
  const syncedZoneIds = new Set<string>();

  await Promise.all(
    zones.map(async (zone) => {
      let rules: CfRoutingRule[] = [];
      try {
        rules = await cfFetch<CfRoutingRule[]>(
          env,
          `/zones/${zone.id}/email/routing/rules?per_page=100`
        );
        syncedZoneIds.add(zone.id);
      } catch {
        // Skip zone if Email Routing is not readable/enabled on that zone
        return;
      }

      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const ruleId = rule.id || rule.tag;
        if (!ruleId) continue;

        // Only sync custom address rules (literal "to" matcher), skipping Catch-All
        const toMatcher = rule.matchers?.find(
          (m) => m.type === 'literal' && m.field === 'to' && m.value
        );
        if (!toMatcher?.value) continue;

        const email = toMatcher.value.trim().toLowerCase();
        const atIndex = email.indexOf('@');
        if (atIndex <= 0 || atIndex === email.length - 1) continue;

        const localPart = email.slice(0, atIndex);
        const domainPart = email.slice(atIndex + 1);

        const forwardAction = rule.actions?.find(
          (a) => a.type === 'forward' && Array.isArray(a.value) && a.value.length > 0
        );
        const forwardTo =
          rule.enabled !== false && forwardAction?.value?.[0]
            ? forwardAction.value[0].trim().toLowerCase()
            : null;

        // Historical base timestamp for pre-existing rules synced from Cloudflare (2024-01-01 + index)
        // so they never incorrectly jump ahead of actual OneVault-created emails.
        const importedCreatedAt = new Date(
          new Date('2024-01-01T00:00:00.000Z').getTime() + i * 1000
        ).toISOString();

        const match = byRuleId.get(ruleId) ?? byEmail.get(email);
        if (match) {
          seenIds.add(match.id);
          if (
            match.routing_rule_id !== ruleId ||
            match.zone_id !== zone.id ||
            match.forward_to !== forwardTo ||
            match.email !== email
          ) {
            await env.DB.prepare(
              `UPDATE mail_accounts
               SET local_part = ?, domain = ?, email = ?, zone_id = ?, routing_rule_id = ?, forward_to = ?
               WHERE id = ?`
            )
              .bind(localPart, domainPart, email, zone.id, ruleId, forwardTo, match.id)
              .run();
          }
        } else {
          const newId = crypto.randomUUID();
          seenIds.add(newId);
          await env.DB.prepare(
            `INSERT INTO mail_accounts (id, local_part, domain, email, zone_id, routing_rule_id, forward_to, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(newId, localPart, domainPart, email, zone.id, ruleId, forwardTo, importedCreatedAt)
            .run();
        }
      }
    })
  );

  // Clean up any local D1 rows whose rule was deleted directly in the Cloudflare dashboard
  for (const row of existingRows) {
    if (syncedZoneIds.has(row.zone_id) && !seenIds.has(row.id)) {
      await env.DB.prepare('DELETE FROM mail_accounts WHERE id = ?').bind(row.id).run();
    }
  }
}

export const mailService = {
  async list(env: Env): Promise<MailAccountDto[]> {
    await syncWithCloudflare(env);
    const { results } = await env.DB.prepare(
      'SELECT * FROM mail_accounts ORDER BY created_at DESC, id DESC'
    ).all<MailAccountRecord>();
    return results.map(toDto);
  },

  /**
   * Creates the address in two places:
   *  1. Cloudflare Email Routing rule (forward to destination or drop when None)
   *  2. D1 row in onevault-storage
   */
  async create(env: Env, input: CreateMailInput): Promise<MailAccountDto> {
    const localPart = input.localPart.trim().toLowerCase();
    if (!LOCAL_PART_PATTERN.test(localPart)) {
      throw new HttpError(
        400,
        'Email name may only contain letters, numbers, dots, dashes and underscores.'
      );
    }

    const domain = await domainsService.findByName(env, input.domain);
    if (!domain) {
      throw new HttpError(400, `${input.domain} is not a domain in this Cloudflare account.`);
    }

    const rawForward = input.forwardTo?.trim().toLowerCase();
    const forwardTo =
      !rawForward || rawForward === 'none' || rawForward === 'vault'
        ? null
        : rawForward;
    const note = input.note?.trim() || null;
    await assertForwardAllowed(env, forwardTo);

    const email = `${localPart}@${domain.name}`;
    const existing = await env.DB.prepare('SELECT id FROM mail_accounts WHERE email = ?')
      .bind(email)
      .first();
    if (existing) throw new HttpError(409, `${email} already exists.`);

    const rule = await upsertCloudflareRule(
      env,
      domain.id,
      email,
      forwardTo
    );

    const id = crypto.randomUUID();
    try {
      await env.DB.prepare(
        `INSERT INTO mail_accounts (id, local_part, domain, email, zone_id, routing_rule_id, forward_to, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(id, localPart, domain.name, email, domain.id, rule.id, forwardTo, note)
        .run();
    } catch (err) {
      // Roll back the routing rule so Cloudflare and D1 never drift apart
      await cfFetch(env, `/zones/${domain.id}/email/routing/rules/${rule.id}`, {
        method: 'DELETE',
      }).catch(() => undefined);
      throw err;
    }

    const row = await env.DB.prepare('SELECT * FROM mail_accounts WHERE id = ?')
      .bind(id)
      .first<MailAccountRecord>();
    return toDto(row as MailAccountRecord);
  },

  async update(
    env: Env,
    id: string,
    input: UpdateMailInput
  ): Promise<MailAccountDto> {
    const existing = await env.DB.prepare('SELECT * FROM mail_accounts WHERE id = ?')
      .bind(id)
      .first<MailAccountRecord>();
    if (!existing) throw new HttpError(404, 'Mail account not found.');

    const rawForward = input.forwardTo !== undefined ? input.forwardTo?.trim().toLowerCase() : undefined;
    const forwardTo =
      rawForward !== undefined
        ? !rawForward || rawForward === 'none' || rawForward === 'vault'
          ? null
          : rawForward
        : existing.forward_to;
    const note =
      input.note !== undefined
        ? input.note?.trim() || null
        : existing.note ?? null;

    if (forwardTo !== existing.forward_to) {
      await assertForwardAllowed(env, forwardTo);
      if (existing.routing_rule_id) {
        await upsertCloudflareRule(
          env,
          existing.zone_id,
          existing.email,
          forwardTo,
          existing.routing_rule_id
        );
      }
    }

    await env.DB.prepare(
      'UPDATE mail_accounts SET forward_to = ?, note = ? WHERE id = ?'
    )
      .bind(forwardTo, note, id)
      .run();

    const row = await env.DB.prepare('SELECT * FROM mail_accounts WHERE id = ?')
      .bind(id)
      .first<MailAccountRecord>();
    return toDto(row as MailAccountRecord);
  },

  async remove(env: Env, id: string): Promise<void> {
    const row = await env.DB.prepare('SELECT * FROM mail_accounts WHERE id = ?')
      .bind(id)
      .first<MailAccountRecord>();
    if (!row) throw new HttpError(404, 'Mail account not found.');

    if (row.routing_rule_id) {
      await cfFetch(env, `/zones/${row.zone_id}/email/routing/rules/${row.routing_rule_id}`, {
        method: 'DELETE',
      }).catch((err) => {
        // Rule already gone on Cloudflare's side is fine; anything else should surface
        if (!(err instanceof HttpError) || !/not found|does not exist/i.test(err.message)) {
          throw err;
        }
      });
    }

    await env.DB.prepare('DELETE FROM mail_accounts WHERE id = ?').bind(id).run();
  },

  /** Used by the email() handler: where should mail for this address go? */
  async findByAddress(env: Env, address: string): Promise<MailAccountRecord | null> {
    return env.DB.prepare('SELECT * FROM mail_accounts WHERE email = ?')
      .bind(address.toLowerCase())
      .first<MailAccountRecord>();
  },
};

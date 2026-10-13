import type { Env } from '../types/env.types';
import { HttpError } from './http-error';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

interface CfEnvelope<T> {
  success: boolean;
  errors: { code: number; message: string }[];
  result: T;
}

/**
 * Thin wrapper around the Cloudflare REST API.
 * All Cloudflare calls in this worker go through here.
 */
export async function cfFetch<T>(
  env: Env,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!env.CF_API_TOKEN) {
    throw new HttpError(
      500,
      'CF_API_TOKEN is not configured. Add it to .env or run `wrangler secret put CF_API_TOKEN`.'
    );
  }

  const res = await fetch(`${CF_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as CfEnvelope<T> | null;

  if (!res.ok || !body || !body.success) {
    const detail =
      body?.errors?.map((e) => e.message).join('; ') ||
      `Cloudflare API error (${res.status})`;
    throw new HttpError(res.status === 401 || res.status === 403 ? 502 : 502, detail);
  }

  return body.result;
}

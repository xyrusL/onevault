import { cfFetch } from '../lib/cloudflare-api';
import type { Env } from '../types/env.types';
import type { ForwardTargetDto } from '../types/mail.types';

interface CfDestinationAddress {
  email: string;
  verified: string | null;
}

export const forwardTargetsService = {
  /** Destination addresses registered in Email Routing (account level). */
  async list(env: Env): Promise<ForwardTargetDto[]> {
    const addresses = await cfFetch<CfDestinationAddress[]>(
      env,
      `/accounts/${env.CF_ACCOUNT_ID}/email/routing/addresses?per_page=50`
    );
    return addresses.map((a) => ({ email: a.email, verified: Boolean(a.verified) }));
  },

  /** Registers a new destination; Cloudflare emails the owner a verification link. */
  async create(env: Env, email: string): Promise<ForwardTargetDto> {
    const created = await cfFetch<CfDestinationAddress>(
      env,
      `/accounts/${env.CF_ACCOUNT_ID}/email/routing/addresses`,
      { method: 'POST', body: JSON.stringify({ email }) }
    );
    return { email: created.email, verified: Boolean(created.verified) };
  },

  async isVerified(env: Env, email: string): Promise<boolean> {
    const all = await this.list(env);
    return all.some((t) => t.email.toLowerCase() === email.toLowerCase() && t.verified);
  },
};

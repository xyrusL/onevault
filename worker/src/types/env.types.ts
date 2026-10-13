/**
 * Worker environment contract.
 * Bindings come from `wrangler.jsonc`; secrets come from `.dev.vars` (local)
 * or `wrangler secret put` (production).
 */
export interface Env {
  /** D1 database `onevault-storage` */
  DB: D1Database;
  /** Static assets (built React site) */
  ASSETS: Fetcher;

  /** Cloudflare account id (public var in wrangler.jsonc) */
  CF_ACCOUNT_ID: string;
  /** Name of this worker, used as the Email Routing rule destination */
  WORKER_NAME: string;

  /** SECRET: API token (Zone:Read, Email Routing Rules:Edit, Email Routing Addresses:Edit) */
  CF_API_TOKEN: string;
  /** SECRET: portal admin login */
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  /** SECRET: HMAC key used to sign session tokens */
  SESSION_SECRET: string;
}

export type AppBindings = {
  Bindings: Env;
  Variables: {
    userEmail?: string;
  };
};


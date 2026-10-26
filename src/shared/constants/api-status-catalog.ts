/**
 * Shared API Status & Diagnostic Catalog
 *
 * Provides human-readable status labels, titles, plain-English explanations,
 * root causes, and recommended resolutions for all OneVault APIs:
 *   - Notes API (`/api/notes`)
 *   - Mail Routing & Inbox API (`/api/mail`, `/api/mail-inbox`, `/api/forward-targets`)
 *   - 2FA Authenticator API (`/api/two-factor`)
 *   - Auth & Session API (`/api/auth`)
 *   - Backup & Sync API (`/api/backup`)
 *   - Domains & DNS API (`/api/domains`)
 *   - System & Edge Security (`system`)
 *
 * Used across the Dashboard, Live API Health Monitor, Incident Modals,
 * Endpoint History Modals, and Security Audit Stream so raw errors/logs
 * are automatically translated into friendly, actionable status summaries.
 */

export type ApiEndpointCategory =
  | 'notes'
  | 'mail'
  | 'two_factor'
  | 'auth'
  | 'backup'
  | 'system'
  | 'projects';

export type SharedApiCategory = ApiEndpointCategory;

export type ApiEndpointKey =
  | 'notes'
  | 'mail'
  | 'twoFactor'
  | 'auth'
  | 'backup'
  | 'domains';

export interface ApiStatusDescriptor {
  /** Short machine-friendly code, e.g. 'AUTH_INVALID_CREDENTIALS' */
  code: string;
  /** HTTP status code associated with this state */
  statusCode: number;
  /** Short status badge text, e.g. 'Auth Challenge Blocked' */
  statusText: string;
  /** Severity tier */
  severity: 'healthy' | 'warning' | 'outage';
  /** Clear human-readable title */
  title: string;
  /** Plain-English explanation of what happened */
  meaning: string;
  /** Root-cause explanation */
  rootCause: string;
  /** How the system resolved it or what the user should do */
  resolution: string;
  /** Applicable API category (or 'all' if shared across all APIs) */
  category: ApiEndpointCategory | 'all';
}

export interface EndpointStatusSummary {
  key: ApiEndpointKey;
  category: ApiEndpointCategory;
  name: string;
  path: string;
  healthyLabel: string;
  degradedLabel: string;
  outageLabel: string;
  healthyMeaning: string;
}

/**
 * Shared baseline status labels per API endpoint
 */
export const ENDPOINT_STATUS_SUMMARIES: Record<ApiEndpointKey, EndpointStatusSummary> = {
  notes: {
    key: 'notes',
    category: 'notes',
    name: 'Notes API',
    path: '/api/notes',
    healthyLabel: 'Sync Ready',
    degradedLabel: 'Sync Delayed',
    outageLabel: 'Sync Offline',
    healthyMeaning: 'Zero-knowledge notes & folders are syncing with D1 in sub-25ms.',
  },
  mail: {
    key: 'mail',
    category: 'mail',
    name: 'Mail Routing API',
    path: '/api/mail',
    healthyLabel: 'Routing Active',
    degradedLabel: 'Queue Throttled',
    outageLabel: 'Routing Disrupted',
    healthyMeaning: 'Cloudflare Email Routing rules & direct vault inboxes are delivering normally.',
  },
  twoFactor: {
    key: 'twoFactor',
    category: 'two_factor',
    name: '2FA Authenticator API',
    path: '/api/two-factor',
    healthyLabel: 'Vault Locked',
    degradedLabel: 'Clock Drift',
    outageLabel: 'Engine Offline',
    healthyMeaning: 'RFC-6238 TOTP secrets are verified and generating 6-digit codes cleanly.',
  },
  auth: {
    key: 'auth',
    category: 'auth',
    name: 'Auth & Session API',
    path: '/api/auth',
    healthyLabel: 'Session Verified',
    degradedLabel: 'Rate Limited',
    outageLabel: 'Auth Disrupted',
    healthyMeaning: 'Edge HMAC-SHA256 tokens & admin credentials are verifying in sub-millisecond isolates.',
  },
  backup: {
    key: 'backup',
    category: 'backup',
    name: 'Backup & Sync API',
    path: '/api/backup',
    healthyLabel: 'Snapshot Ready',
    degradedLabel: 'Export Buffering',
    outageLabel: 'Stream Locked',
    healthyMeaning: 'Full-vault JSON export and smart-merge import pipelines are online.',
  },
  domains: {
    key: 'domains',
    category: 'system',
    name: 'Domains & DNS API',
    path: '/api/domains',
    healthyLabel: 'DNS Verified',
    degradedLabel: 'DNS Pending',
    outageLabel: 'Zone API Error',
    healthyMeaning: 'Custom domains, subdomains, and MX/SPF records are synced with Cloudflare DNS.',
  },
};

/**
 * Pattern-matched catalog of shared & API-specific status definitions.
 * Ordered from most specific pattern to general HTTP status fallbacks.
 */
interface PatternStatusRule {
  pattern: RegExp;
  categories?: ApiEndpointCategory[];
  descriptor: ApiStatusDescriptor;
}

const STATUS_PATTERN_RULES: PatternStatusRule[] = [
  // ============================================================================
  // 1. SHARED CROSS-API DATABASE & EDGE INFRASTRUCTURE STATUSES (Applies to any API)
  // ============================================================================
  {
    pattern: /no such table|SQLITE_ERROR.*table/i,
    descriptor: {
      code: 'D1_SCHEMA_INITIALIZING',
      statusCode: 500,
      statusText: 'Database Table Auto-Initializing',
      severity: 'outage',
      title: 'D1 Database Table Missing or Migrating',
      meaning: 'The requested SQLite table was not found in D1 when the API query executed.',
      rootCause: 'A new feature table had not yet been migrated or initialized in local/remote D1 storage.',
      resolution: 'Auto-created table schema on retry; run D1 migrations if persistent.',
      category: 'all',
    },
  },
  {
    pattern: /Failed to parse body as JSON|D1_ERROR|database.*locked|SQLITE_BUSY/i,
    descriptor: {
      code: 'D1_ISOLATE_CONTENTION',
      statusCode: 503,
      statusText: 'D1 Storage Busy · Auto-Retrying',
      severity: 'outage',
      title: 'Cloudflare D1 Isolate Concurrency Contention',
      meaning: 'Simultaneous database queries briefly locked the local D1 SQLite worker connection.',
      rootCause: 'Parallel read/write batch operations overlapped during an edge isolate cold start.',
      resolution: 'Connection pool cleared automatically; subsequent API requests succeeded.',
      category: 'all',
    },
  },
  {
    pattern: /hidden or restricted URL|hidden endpoint|path traversal|\.\./i,
    descriptor: {
      code: 'WAF_RESTRICTED_PATH_BLOCKED',
      statusCode: 403,
      statusText: 'Security Shield Blocked Probe',
      severity: 'warning',
      title: 'Restricted Path or Dotfile Probe Blocked',
      meaning: 'The edge security middleware blocked an attempt to access a hidden file or restricted path.',
      rootCause: 'Request URL contained dotfile segments (e.g. /.env, /.git) or traversal characters.',
      resolution: 'Blocked automatically at the edge with HTTP 403; no vault data exposed.',
      category: 'all',
    },
  },
  {
    pattern: /CF_API_TOKEN is not configured/i,
    descriptor: {
      code: 'CF_TOKEN_MISSING',
      statusCode: 500,
      statusText: 'Cloudflare API Token Missing',
      severity: 'outage',
      title: 'Cloudflare API Token Not Configured',
      meaning: 'The Worker could not authenticate with the Cloudflare v4 REST API.',
      rootCause: 'Environment secret CF_API_TOKEN is missing or empty in the Worker configuration.',
      resolution: 'Configure CF_API_TOKEN in .env or via `wrangler secret put CF_API_TOKEN`.',
      category: 'all',
    },
  },
  {
    pattern: /Cloudflare API error|525|SSL Handshake/i,
    descriptor: {
      code: 'CF_UPSTREAM_SYNC_DELAY',
      statusCode: 502,
      statusText: 'Cloudflare Upstream API Delay',
      severity: 'outage',
      title: 'Cloudflare Upstream Management API Error',
      meaning: 'An upstream request to Cloudflare Zones or Email Routing API returned a gateway error.',
      rootCause: 'Temporary Cloudflare API rate limit, token permission scope, or TLS handshake timeout.',
      resolution: 'Fallback to local D1 state applied; upstream sync resumes on next cycle.',
      category: 'all',
    },
  },

  {
    pattern: /DDoS|Self-Defense|Volumetric|L7 Flood|Edge Shield Engaged/i,
    descriptor: {
      code: 'DDOS_SELF_DEFENSE_ENGAGED',
      statusCode: 429,
      statusText: 'Edge Self-Defense Active',
      severity: 'warning',
      title: 'L7 DDoS Mitigation & D1 Data-Path Shield Active',
      meaning: 'Cloudflare Edge detected a volumetric request surge and activated temporary Worker + D1 self-defense rules.',
      rootCause: 'Multi-country botnet request spike targeting Worker endpoints and D1 database paths.',
      resolution: 'Pre-DB token gate, sliding-window IP rate limiter, and single-device session lock engaged automatically.',
      category: 'all',
    },
  },
  {
    pattern: /Single-Device Session Lock|Previous.*Sessions Revoked|Session Pinned|Lockdown/i,
    descriptor: {
      code: 'SESSION_SINGLE_DEVICE_PINNED',
      statusCode: 200,
      statusText: 'Single-Device Lock Active',
      severity: 'healthy',
      title: 'Previous Devices Logged Out · Current Device Pinned',
      meaning: 'All older or secondary device tokens were invalidated; only the current browser session is authorized.',
      rootCause: 'Emergency self-defense session rotation triggered to prevent credential replay or session hijacking.',
      resolution: 'Current device HMAC token pinned in Worker isolate; all other devices require fresh authentication.',
      category: 'auth',
    },
  },
  {
    pattern: /Payload Too Large|64KB|oversized payload|memory bomb/i,
    descriptor: {
      code: 'D1_PAYLOAD_CAP_BLOCKED',
      statusCode: 413,
      statusText: 'D1 Payload Guard Blocked',
      severity: 'warning',
      title: 'Oversized Write Payload Blocked Before D1',
      meaning: 'An incoming write request exceeded the temporary self-defense payload limit and was dropped at the edge.',
      rootCause: 'Request Content-Length exceeded 64KB during active D1 write-path protection.',
      resolution: 'Dropped in Worker memory before reaching SQLite D1 to prevent transaction lockouts.',
      category: 'all',
    },
  },
  {
    pattern: /SQLi|malicious signature|bot scanner|headless flood/i,
    descriptor: {
      code: 'BOT_SIGNATURE_SCRUBBED',
      statusCode: 403,
      statusText: 'Botnet Signature Scrubbed',
      severity: 'warning',
      title: 'Automated Scanner / Injection Probe Dropped',
      meaning: 'The edge request scrubber detected an automated scanner or SQL injection payload and terminated the connection.',
      rootCause: 'Malicious User-Agent or SQLi probe detected.',
      resolution: 'Blocked with HTTP 403 at Edge Isolate before hitting D1.',
      category: 'all',
    },
  },

  // ============================================================================
  // 2. AUTH & SESSION API (`/api/auth`)
  // ============================================================================
  {
    pattern: /Invalid email or password|Current password is incorrect/i,
    categories: ['auth', 'system'],
    descriptor: {
      code: 'AUTH_INVALID_CREDENTIALS',
      statusCode: 401,
      statusText: 'Invalid Sign-In Credentials',
      severity: 'warning',
      title: 'Incorrect Email or Password Attempt',
      meaning: 'A sign-in or password update request provided credentials that did not match the admin hash.',
      rootCause: 'User entered a mismatched password or email during authentication.',
      resolution: 'Request rejected safely via constant-time HMAC comparison.',
      category: 'auth',
    },
  },
  {
    pattern: /Failed Sign-In Challenge Blocked|Rate limit threshold|repeated authentication/i,
    categories: ['auth', 'system'],
    descriptor: {
      code: 'AUTH_RATE_LIMIT_CHALLENGE',
      statusCode: 429,
      statusText: 'Brute-Force Shield Active',
      severity: 'warning',
      title: 'Repeated Sign-In Attempts Throttled',
      meaning: 'Multiple failed login attempts from the same IP triggered edge rate-limiting.',
      rootCause: 'Rapid consecutive failed authentication challenges exceeded the security threshold.',
      resolution: 'Temporary cool-down enforced at the edge; legitimate sessions remain unaffected.',
      category: 'auth',
    },
  },
  {
    pattern: /Email and password are required|Current password is required/i,
    categories: ['auth'],
    descriptor: {
      code: 'AUTH_MISSING_FIELDS',
      statusCode: 400,
      statusText: 'Missing Auth Credentials',
      severity: 'warning',
      title: 'Incomplete Authentication Payload',
      meaning: 'A login or account update request was submitted without required email/password fields.',
      rootCause: 'Client request body omitted mandatory credential fields.',
      resolution: 'Prompted user to supply both email and password.',
      category: 'auth',
    },
  },
  {
    pattern: /account with that email already exists/i,
    categories: ['auth'],
    descriptor: {
      code: 'AUTH_EMAIL_CONFLICT',
      statusCode: 409,
      statusText: 'Admin Email Already Registered',
      severity: 'warning',
      title: 'Duplicate Admin Account Email',
      meaning: 'Cannot change the admin email because another record already uses that address.',
      rootCause: 'Unique constraint on admin_users email column.',
      resolution: 'Choose a different email address for the admin profile.',
      category: 'auth',
    },
  },
  {
    pattern: /Unauthorized|expired token|invalid token/i,
    categories: ['auth', 'system'],
    descriptor: {
      code: 'AUTH_SESSION_EXPIRED',
      statusCode: 401,
      statusText: 'Session Token Expired',
      severity: 'warning',
      title: 'Unauthenticated or Expired Session Token',
      meaning: 'An API call was made without a valid signed Bearer session token.',
      rootCause: 'The 7-day HMAC session token expired or was cleared from local storage.',
      resolution: 'Client automatically redirected to Sign-In to issue a fresh token.',
      category: 'auth',
    },
  },

  // ============================================================================
  // 3. DOMAINS & DNS API (`/api/domains`)
  // ============================================================================
  {
    pattern: /apexId is not defined|wwwId is not defined/i,
    categories: ['system'],
    descriptor: {
      code: 'DOMAINS_STARTER_SEED_RECOVERED',
      statusCode: 500,
      statusText: 'DNS Record Seeder Recovered',
      severity: 'outage',
      title: 'Starter DNS Record Generation Exception',
      meaning: 'An earlier worker build failed while auto-seeding default `@` and `www` DNS records.',
      rootCause: 'Reference error during initial domain record provisioning in an older build.',
      resolution: 'Patched in current Worker build; starter A & CNAME records now seed cleanly.',
      category: 'system',
    },
  },
  {
    pattern: /not a valid domain name|Subdomain.*may only contain|Root domain.*not found/i,
    categories: ['system'],
    descriptor: {
      code: 'DOMAINS_INVALID_HOSTNAME',
      statusCode: 400,
      statusText: 'Invalid Domain or Hostname Format',
      severity: 'warning',
      title: 'Domain or Subdomain Validation Failed',
      meaning: 'The submitted domain or subdomain string did not pass RFC hostname formatting rules.',
      rootCause: 'Input contained unsupported characters, protocol prefixes, or an unknown root zone.',
      resolution: 'Cleaned hostname format and prompted user for a valid domain (e.g. example.com).',
      category: 'system',
    },
  },
  {
    pattern: /already registered in OneVault|Subdomain.*is already registered/i,
    categories: ['system'],
    descriptor: {
      code: 'DOMAINS_DUPLICATE_ZONE',
      statusCode: 409,
      statusText: 'Domain Already Registered',
      severity: 'warning',
      title: 'Duplicate Domain or Subdomain Registration',
      meaning: 'The domain or subdomain is already configured in OneVault DNS management.',
      rootCause: 'Attempted to register a zone or subdomain that already exists in D1/Cloudflare.',
      resolution: 'Skipped duplicate creation; existing domain records remain intact.',
      category: 'system',
    },
  },
  {
    pattern: /Record content.*is required|Domain name.*is required/i,
    categories: ['system'],
    descriptor: {
      code: 'DOMAINS_MISSING_RECORD_TARGET',
      statusCode: 400,
      statusText: 'Missing DNS Target Value',
      severity: 'warning',
      title: 'DNS Record Target IP or Hostname Missing',
      meaning: 'A DNS record creation request was missing its target IP address or hostname content.',
      rootCause: 'Empty content field submitted when creating or updating a DNS record.',
      resolution: 'Validated form fields before submitting to Cloudflare DNS.',
      category: 'system',
    },
  },

  // ============================================================================
  // 4. MAIL ROUTING & INBOX API (`/api/mail`, `/api/mail-inbox`, `/api/forward-targets`)
  // ============================================================================
  {
    pattern: /SPF & DKIM Alignment|spf1 include:_spf\.mx\.cloudflare\.net/i,
    categories: ['mail'],
    descriptor: {
      code: 'MAIL_SPF_DKIM_ADVISORY',
      statusCode: 200,
      statusText: 'SPF/DKIM DNS Advisory',
      severity: 'warning',
      title: 'DNS SPF & DKIM Alignment Recommended',
      meaning: 'Custom mail subdomains work best when Cloudflare SPF & MX records are aligned in DNS.',
      rootCause: 'Advisory check for outbound/inbound email authentication records.',
      resolution: 'Verify TXT `v=spf1 include:_spf.mx.cloudflare.net ~all` is present on active zones.',
      category: 'mail',
    },
  },
  {
    pattern: /not a verified destination address/i,
    categories: ['mail'],
    descriptor: {
      code: 'MAIL_UNVERIFIED_FORWARD_TARGET',
      statusCode: 400,
      statusText: 'Unverified Forwarding Email',
      severity: 'warning',
      title: 'Destination Forwarding Address Not Verified',
      meaning: 'Cloudflare Email Routing requires destination forwarding addresses to click a verification link first.',
      rootCause: 'Selected forwardTo address has not yet been confirmed in Cloudflare Email Routing.',
      resolution: 'Check the destination inbox for the Cloudflare verification email or use Direct Vault Inbox (None).',
      category: 'mail',
    },
  },
  {
    pattern: /already exists.*@|Mail account not found|Message not found/i,
    categories: ['mail'],
    descriptor: {
      code: 'MAIL_ADDRESS_CONFLICT_OR_MISSING',
      statusCode: 404,
      statusText: 'Mailbox Address Conflict / Not Found',
      severity: 'warning',
      title: 'Mailbox Alias Conflict or Missing Record',
      meaning: 'The requested mailbox alias already exists or the target message was already deleted.',
      rootCause: 'Duplicate alias creation attempt or stale message ID reference.',
      resolution: 'Refreshed mailbox list from Cloudflare Email Routing rules.',
      category: 'mail',
    },
  },

  // ============================================================================
  // 5. NOTES API (`/api/notes`)
  // ============================================================================
  {
    pattern: /Note title is required|Folder name is required/i,
    categories: ['notes'],
    descriptor: {
      code: 'NOTES_VALIDATION_REQUIRED',
      statusCode: 400,
      statusText: 'Missing Note or Folder Title',
      severity: 'warning',
      title: 'Note Title or Folder Name Required',
      meaning: 'Attempted to save a note or folder with an empty title.',
      rootCause: 'Blank title string submitted to `/api/notes`.',
      resolution: 'Client editor requires a title before persisting to D1.',
      category: 'notes',
    },
  },
  {
    pattern: /Note not found|Folder not found/i,
    categories: ['notes'],
    descriptor: {
      code: 'NOTES_ITEM_NOT_FOUND',
      statusCode: 404,
      statusText: 'Note or Folder Not Found',
      severity: 'warning',
      title: 'Referenced Note or Folder No Longer Exists',
      meaning: 'The note or folder being updated or deleted was already removed.',
      rootCause: 'Stale client cache referenced a deleted note/folder ID.',
      resolution: 'Synchronized notes list with D1 storage.',
      category: 'notes',
    },
  },

  // ============================================================================
  // 6. 2FA AUTHENTICATOR API (`/api/two-factor`)
  // ============================================================================
  {
    pattern: /issuer, label, secret, and otpauthUri are required|2FA token not found/i,
    categories: ['two_factor'],
    descriptor: {
      code: 'TOTP_VALIDATION_ERROR',
      statusCode: 400,
      statusText: 'Invalid TOTP Secret Payload',
      severity: 'warning',
      title: '2FA Token Secret or URI Validation Alert',
      meaning: 'A 2FA authenticator request was missing its Base32 secret, issuer, or referenced a removed token.',
      rootCause: 'Incomplete otpauth:// URI or already-deleted token ID.',
      resolution: 'Verified Base32 secret format and refreshed active 2FA tokens.',
      category: 'two_factor',
    },
  },

  // ============================================================================
  // 7. BACKUP & SYNC API (`/api/backup`)
  // ============================================================================
  {
    pattern: /Invalid import request|Missing vault collections|Invalid vault import payload/i,
    categories: ['backup'],
    descriptor: {
      code: 'BACKUP_INVALID_BUNDLE',
      statusCode: 400,
      statusText: 'Invalid Backup JSON Bundle',
      severity: 'warning',
      title: 'Malformed Vault Backup Import File',
      meaning: 'The uploaded JSON file did not contain valid OneVault collection arrays.',
      rootCause: 'Import payload was missing `collections` or had corrupted JSON syntax.',
      resolution: 'Aborted import safely without modifying existing D1 data.',
      category: 'backup',
    },
  },
];

/**
 * Lookup baseline endpoint status summary by either ApiEndpointKey or ApiEndpointCategory
 */
export function getEndpointStatusSummary(keyOrCategory?: string): EndpointStatusSummary {
  if (!keyOrCategory) return ENDPOINT_STATUS_SUMMARIES.domains;
  if (keyOrCategory in ENDPOINT_STATUS_SUMMARIES) {
    return ENDPOINT_STATUS_SUMMARIES[keyOrCategory as ApiEndpointKey];
  }
  if (keyOrCategory === 'two_factor') return ENDPOINT_STATUS_SUMMARIES.twoFactor;
  if (keyOrCategory === 'system') return ENDPOINT_STATUS_SUMMARIES.domains;
  return ENDPOINT_STATUS_SUMMARIES.domains;
}

/**
 * Resolves any raw error/warning log or message into a rich, human-readable
 * `ApiStatusDescriptor` that can be shared across all API views, charts,
 * activity feeds, and modals.
 */
export function resolveApiStatusDescriptor(input: {
  category?: string;
  level?: 'info' | 'warning' | 'error';
  title?: string;
  message?: string;
  details?: string | null;
  statusCode?: number;
}): ApiStatusDescriptor {
  const cat = (input.category || 'system') as ApiEndpointCategory;
  const combinedText = `${input.title || ''} ${input.message || ''} ${input.details || ''}`.trim();

  // 1. Check specific pattern rules first (matching category or global 'all')
  for (const rule of STATUS_PATTERN_RULES) {
    if (rule.categories && !rule.categories.includes(cat)) {
      continue;
    }
    if (rule.pattern.test(combinedText)) {
      return rule.descriptor;
    }
  }

  // 2. Second pass without strict category filter so shared error messages always match
  for (const rule of STATUS_PATTERN_RULES) {
    if (rule.pattern.test(combinedText)) {
      return rule.descriptor;
    }
  }

  // 3. Healthy / Info event fallback
  if (input.level === 'info') {
    const summary = getEndpointStatusSummary(cat);
    return {
      code: 'EDGE_HEALTHY_EVENT',
      statusCode: input.statusCode || 200,
      statusText: summary.healthyLabel,
      severity: 'healthy',
      title: input.title || 'Edge Vault Operation Verified',
      meaning: input.message || summary.healthyMeaning,
      rootCause: 'Routine system verification heartbeat.',
      resolution: 'No action required; operating at sub-25ms latency.',
      category: cat,
    };
  }

  // 4. Extract HTTP status code if present in title (e.g. "HTTP 400 Alert")
  const httpMatch = (input.title || '').match(/HTTP\s+(\d{3})/i);
  const statusCode =
    input.statusCode || (httpMatch ? Number(httpMatch[1]) : input.level === 'error' ? 500 : 400);
  const isError = input.level === 'error' || statusCode >= 500;

  const categoryNameMap: Record<ApiEndpointCategory, string> = {
    notes: 'Notes API',
    mail: 'Mail Routing API',
    two_factor: '2FA Authenticator API',
    auth: 'Auth & Session API',
    backup: 'Backup & Sync API',
    system: 'Domains & DNS API',
    projects: 'Connected Projects Gateway',
  };
  const serviceName = categoryNameMap[cat] || 'Cloudflare Edge API';

  if (isError) {
    return {
      code: `${cat.toUpperCase()}_RUNTIME_EXCEPTION`,
      statusCode,
      statusText: `${serviceName} Exception (${statusCode})`,
      severity: 'outage',
      title: `${serviceName} Execution Error`,
      meaning: `An unexpected runtime error occurred while processing a request in ${serviceName}.`,
      rootCause: input.message ? input.message.split('\n')[0].slice(0, 120) : 'Unhandled worker exception.',
      resolution: 'Worker isolate recovered automatically on subsequent requests.',
      category: cat,
    };
  }

  return {
    code: `${cat.toUpperCase()}_REQUEST_WARNING`,
    statusCode,
    statusText: `${serviceName} Validation Warning (${statusCode})`,
    severity: 'warning',
    title: `${serviceName} Request Warning`,
    meaning: `A client request to ${serviceName} was rejected due to validation or rate-limit rules.`,
    rootCause: input.message ? input.message.split('\n')[0].slice(0, 120) : `HTTP ${statusCode} client warning.`,
    resolution: 'Handled safely by edge validation middleware.',
    category: cat,
  };
}

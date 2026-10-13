import { cfFetch } from '../lib/cloudflare-api';
import { HttpError } from '../lib/http-error';
import type {
  CreateDomainInput,
  CreateRecordInput,
  DnsRecordType,
  DomainRecordDto,
  DomainSummaryDto,
  UpdateRecordInput,
} from '../types/domains.types';
import type { Env } from '../types/env.types';
import type {
  CreateSubdomainInput,
  DomainDto,
  SubdomainDto,
} from '../types/mail.types';

interface CfZone {
  id: string;
  name: string;
  status: string;
  name_servers?: string[];
  created_on?: string;
}

interface CfDnsRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  priority?: number;
  proxiable?: boolean;
  proxied?: boolean;
  ttl?: number;
  locked?: boolean;
  meta?: {
    auto_added?: boolean;
    managed_by_apps?: boolean;
    managed_by_argo_tunnel?: boolean;
    source?: string;
  };
  comment?: string;
  created_on?: string;
  modified_on?: string;
}

interface CustomDomainRow {
  id: string;
  zone_id: string | null;
  name: string;
  status: string;
  name_servers: string | null;
  created_at: string;
}

interface DomainDnsRecordRow {
  id: string;
  domain_name: string;
  zone_id: string | null;
  subdomain: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: number;
  priority?: number | null;
  comment: string | null;
  cf_record_id: string | null;
  created_at: string;
  updated_at: string;
}

const DOMAIN_NAME_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const SUBDOMAIN_PATTERN = /^[a-z0-9_*](?:[a-z0-9_.*-]{0,253}[a-z0-9_*])?$/i;

function cleanDomainName(raw: string): string {
  let cleaned = raw.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split(':')[0];
  return cleaned;
}

export const domainsService = {
  /** Ensure D1 custom_domains and domain_dns_records tables exist */
  async ensureTables(env: Env): Promise<void> {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS custom_domains (
          id TEXT PRIMARY KEY,
          zone_id TEXT,
          name TEXT NOT NULL UNIQUE,
          status TEXT DEFAULT 'active',
          name_servers TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS domain_dns_records (
          id TEXT PRIMARY KEY,
          domain_name TEXT NOT NULL,
          zone_id TEXT,
          subdomain TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          ttl INTEGER DEFAULT 1,
          proxied INTEGER DEFAULT 1,
          comment TEXT,
          cf_record_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch {
      // Ignore if database execution errors
    }
  },

  /** Lists root zones in Cloudflare */
  async listZones(env: Env): Promise<DomainDto[]> {
    try {
      const zones = await cfFetch<CfZone[]>(
        env,
        `/zones?account.id=${env.CF_ACCOUNT_ID}&per_page=50&status=active`
      );
      return zones.map((z) => ({ id: z.id, name: z.name.toLowerCase(), status: z.status }));
    } catch {
      return [];
    }
  },

  /** Lists rich summary of all domains (Cloudflare zones + OneVault custom domains) */
  async listSummary(env: Env): Promise<DomainSummaryDto[]> {
    await this.ensureTables(env);

    let cfZones: CfZone[] = [];
    try {
      cfZones = await cfFetch<CfZone[]>(
        env,
        `/zones?account.id=${env.CF_ACCOUNT_ID}&per_page=50`
      );
    } catch {
      cfZones = [];
    }

    let customRows: CustomDomainRow[] = [];
    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM custom_domains ORDER BY created_at DESC'
      ).all<CustomDomainRow>();
      customRows = results || [];
    } catch {
      customRows = [];
    }

    // Collect all record counts from D1
    const recordCounts = new Map<string, { total: number; subdomains: Set<string> }>();
    try {
      const { results: dnsRows } = await env.DB.prepare(
        'SELECT domain_name, subdomain FROM domain_dns_records'
      ).all<{ domain_name: string; subdomain: string }>();
      for (const row of dnsRows || []) {
        const dName = row.domain_name.toLowerCase();
        if (!recordCounts.has(dName)) {
          recordCounts.set(dName, { total: 0, subdomains: new Set() });
        }
        const item = recordCounts.get(dName)!;
        item.total += 1;
        if (row.subdomain && row.subdomain !== '@') {
          item.subdomains.add(row.subdomain.toLowerCase());
        }
      }
    } catch {
      // Ignore
    }

    // Also include mail_subdomains
    try {
      const { results: mailSubs } = await env.DB.prepare(
        'SELECT root_domain, subdomain FROM mail_subdomains'
      ).all<{ root_domain: string; subdomain: string }>();
      for (const sub of mailSubs || []) {
        const rName = sub.root_domain.toLowerCase();
        if (!recordCounts.has(rName)) {
          recordCounts.set(rName, { total: 0, subdomains: new Set() });
        }
        const item = recordCounts.get(rName)!;
        item.subdomains.add(sub.subdomain.toLowerCase());
      }
    } catch {
      // Ignore
    }

    const domainMap = new Map<string, DomainSummaryDto>();

    // 1. Add Cloudflare Zones
    for (const z of cfZones) {
      const name = z.name.toLowerCase();
      const stats = recordCounts.get(name);
      domainMap.set(name, {
        id: z.id,
        name,
        status: z.status || 'active',
        nameServers: z.name_servers && z.name_servers.length > 0
          ? z.name_servers
          : ['felicity.ns.cloudflare.com', 'noor.ns.cloudflare.com'],
        recordCount: stats?.total ?? 0,
        subdomainCount: stats?.subdomains.size ?? 0,
        source: 'cloudflare',
        createdAt: z.created_on,
      });
    }

    // 2. Add or merge Custom Domains in D1
    for (const row of customRows) {
      const name = row.name.toLowerCase();
      const stats = recordCounts.get(name);
      const existing = domainMap.get(name);

      let ns: string[] = ['ns1.cloudflare.com', 'ns2.cloudflare.com'];
      if (row.name_servers) {
        try {
          ns = JSON.parse(row.name_servers);
        } catch {
          ns = row.name_servers.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      if (existing) {
        existing.recordCount = Math.max(existing.recordCount, stats?.total ?? 0);
        existing.subdomainCount = Math.max(existing.subdomainCount, stats?.subdomains.size ?? 0);
      } else {
        domainMap.set(name, {
          id: row.id,
          name,
          status: row.status || 'active',
          nameServers: ns,
          recordCount: stats?.total ?? 0,
          subdomainCount: stats?.subdomains.size ?? 0,
          source: 'local',
          createdAt: row.created_at,
        });
      }
    }

    return Array.from(domainMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  /** Registers a new domain for web hosting / DNS */
  async createDomain(env: Env, input: CreateDomainInput): Promise<DomainSummaryDto> {
    await this.ensureTables(env);
    const domainName = cleanDomainName(input.name);

    if (!domainName || !DOMAIN_NAME_REGEX.test(domainName)) {
      throw new HttpError(
        400,
        `"${input.name}" is not a valid domain name (e.g. example.com or app.mybrand.io).`
      );
    }

    // Check if domain already exists in D1 or CF
    const existingList = await this.listSummary(env);
    if (existingList.some((d) => d.name === domainName)) {
      throw new HttpError(409, `Domain "${domainName}" is already registered in OneVault.`);
    }

    let cfZoneId: string | null = null;
    let nameServers: string[] = ['ns1.cloudflare.com', 'ns2.cloudflare.com'];
    let status = 'active';

    // Attempt to register zone in Cloudflare
    try {
      const created = await cfFetch<CfZone>(env, '/zones', {
        method: 'POST',
        body: JSON.stringify({
          account: { id: env.CF_ACCOUNT_ID },
          name: domainName,
          type: 'full',
          jump_start: true,
        }),
      });
      if (created?.id) {
        cfZoneId = created.id;
        if (created.name_servers && created.name_servers.length > 0) {
          nameServers = created.name_servers;
        }
        status = created.status || 'pending';
      }
    } catch {
      // If Cloudflare fails (e.g. permission or plan constraint), fallback to local management seamlessly
    }

    const domainId = cfZoneId || crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO custom_domains (id, zone_id, name, status, name_servers, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        domainId,
        cfZoneId,
        domainName,
        status,
        JSON.stringify(nameServers),
        now
      )
      .run();

    // Automatically seed starter website records:
    // 1. Apex (@) A record -> 192.0.2.1 (example web IP)
    // 2. www CNAME record -> domainName
    const apexId = crypto.randomUUID();
    const wwwId = crypto.randomUUID();

    try {
      await env.DB.prepare(
        `INSERT INTO domain_dns_records (id, domain_name, zone_id, subdomain, name, type, content, ttl, proxied, comment, created_at, updated_at)
         VALUES (?, ?, ?, '@', ?, 'A', '192.0.2.1', 1, 1, 'Primary web server apex', ?, ?)`
      )
        .bind(apexId, domainName, cfZoneId, domainName, now, now)
        .run();

      await env.DB.prepare(
        `INSERT INTO domain_dns_records (id, domain_name, zone_id, subdomain, name, type, content, ttl, proxied, comment, created_at, updated_at)
         VALUES (?, ?, ?, 'www', ?, 'CNAME', ?, 1, 1, 'Standard www subdomain redirect', ?, ?)`
      )
        .bind(wwwId, domainName, cfZoneId, `www.${domainName}`, domainName, now, now)
        .run();
    } catch {
      // Ignore seeding errors
    }

    return {
      id: domainId,
      name: domainName,
      status,
      nameServers,
      recordCount: 2,
      subdomainCount: 1,
      source: cfZoneId ? 'cloudflare' : 'local',
      createdAt: now,
    };
  },

  /** Removes a domain and its DNS records */
  async deleteDomain(env: Env, domainIdentifier: string): Promise<{ ok: boolean }> {
    await this.ensureTables(env);
    const normalized = cleanDomainName(domainIdentifier);

    // Find zone
    let zoneId: string | null = null;
    try {
      const row = await env.DB.prepare(
        'SELECT id, zone_id FROM custom_domains WHERE name = ? OR id = ?'
      )
        .bind(normalized, domainIdentifier)
        .first<{ id: string; zone_id: string | null }>();
      if (row) {
        zoneId = row.zone_id;
      }
    } catch {
      // Ignore
    }

    // Try CF zone lookup if not in D1
    if (!zoneId) {
      const zones = await this.listZones(env);
      const match = zones.find((z) => z.name === normalized || z.id === domainIdentifier);
      if (match) zoneId = match.id;
    }

    // Try Cloudflare delete if allowed
    if (zoneId) {
      await cfFetch(env, `/zones/${zoneId}`, { method: 'DELETE' }).catch(() => undefined);
    }

    // Delete records from D1
    await env.DB.prepare('DELETE FROM custom_domains WHERE name = ? OR id = ?')
      .bind(normalized, domainIdentifier)
      .run()
      .catch(() => undefined);

    await env.DB.prepare('DELETE FROM domain_dns_records WHERE domain_name = ?')
      .bind(normalized)
      .run()
      .catch(() => undefined);

    return { ok: true };
  },

  /** Lists all DNS records & subdomains for a domain */
  async listRecords(env: Env, domainNameInput: string): Promise<DomainRecordDto[]> {
    await this.ensureTables(env);
    const domainName = cleanDomainName(domainNameInput);

    // Find zoneId if any
    let zoneId: string | null = null;
    const zones = await this.listZones(env);
    const cfZone = zones.find((z) => z.name === domainName);
    if (cfZone) {
      zoneId = cfZone.id;
    } else {
      const row = await env.DB.prepare(
        'SELECT zone_id FROM custom_domains WHERE name = ?'
      )
        .bind(domainName)
        .first<{ zone_id: string | null }>();
      zoneId = row?.zone_id || null;
    }

    // 1. Try to fetch from Cloudflare if zoneId is available
    if (zoneId) {
      try {
        const cfRecords = await cfFetch<CfDnsRecord[]>(
          env,
          `/zones/${zoneId}/dns_records?per_page=100`
        );
        if (Array.isArray(cfRecords) && cfRecords.length > 0) {
          return cfRecords.map((r) => {
            let subdomain = '@';
            const lowerName = r.name.toLowerCase();
            if (lowerName === domainName) {
              subdomain = '@';
            } else if (lowerName.endsWith(`.${domainName}`)) {
              subdomain = lowerName.slice(0, lowerName.length - domainName.length - 1);
            } else {
              subdomain = lowerName;
            }

            const lowerContent = r.content.toLowerCase();
            const isLocked = Boolean(
              r.locked ||
              r.meta?.auto_added ||
              r.meta?.managed_by_apps ||
              r.meta?.managed_by_argo_tunnel ||
              (r.type === 'MX' && lowerContent.includes('.mx.cloudflare.net')) ||
              (r.type === 'TXT' && lowerContent.includes('spf.mx.cloudflare.net')) ||
              lowerContent.includes('cf-email-verification') ||
              lowerName.includes('_cf-custom-hostname') ||
              (r.type === 'NS' && lowerContent.includes('.ns.cloudflare.net'))
            );

            return {
              id: r.id,
              domainName,
              zoneId: zoneId || undefined,
              subdomain,
              name: r.name,
              type: r.type as DnsRecordType,
              content: r.content,
              priority: r.priority,
              ttl: r.ttl ?? 1,
              proxied: Boolean(r.proxied),
              comment: r.comment || null,
              cfRecordId: r.id,
              locked: isLocked,
              createdAt: r.created_on,
              updatedAt: r.modified_on,
            };
          });
        }
      } catch {
        // Fallback to D1 records on Cloudflare auth or DNS permission error
      }
    }

    // 2. Fetch from D1 domain_dns_records
    const { results } = await env.DB.prepare(
      'SELECT * FROM domain_dns_records WHERE domain_name = ? ORDER BY type ASC, subdomain ASC'
    )
      .bind(domainName)
      .all<DomainDnsRecordRow>();

    if (results && results.length > 0) {
      return results.map((r) => ({
        id: r.id,
        domainName: r.domain_name,
        zoneId: r.zone_id || undefined,
        subdomain: r.subdomain,
        name: r.name,
        type: r.type as DnsRecordType,
        content: r.content,
        ttl: r.ttl,
        proxied: Boolean(r.proxied),
        comment: r.comment,
        cfRecordId: r.cf_record_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }

    // 3. If no records exist at all yet in D1, seed standard starter records for the website!
    const now = new Date().toISOString();
    const apexId = crypto.randomUUID();
    const wwwId = crypto.randomUUID();

    const defaultRecords: DomainRecordDto[] = [
      {
        id: apexId,
        domainName,
        zoneId: zoneId || undefined,
        subdomain: '@',
        name: domainName,
        type: 'A',
        content: '192.0.2.1',
        ttl: 1,
        proxied: true,
        comment: 'Primary apex web server',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: wwwId,
        domainName,
        zoneId: zoneId || undefined,
        subdomain: 'www',
        name: `www.${domainName}`,
        type: 'CNAME',
        content: domainName,
        ttl: 1,
        proxied: true,
        comment: 'Standard www subdomain',
        createdAt: now,
        updatedAt: now,
      },
    ];

    try {
      await env.DB.prepare(
        `INSERT INTO domain_dns_records (id, domain_name, zone_id, subdomain, name, type, content, ttl, proxied, comment, created_at, updated_at)
         VALUES (?, ?, ?, '@', ?, 'A', '192.0.2.1', 1, 1, 'Primary apex web server', ?, ?)`
      )
        .bind(apexId, domainName, zoneId, domainName, now, now)
        .run();

      await env.DB.prepare(
        `INSERT INTO domain_dns_records (id, domain_name, zone_id, subdomain, name, type, content, ttl, proxied, comment, created_at, updated_at)
         VALUES (?, ?, ?, 'www', ?, 'CNAME', ?, 1, 1, 'Standard www subdomain', ?, ?)`
      )
        .bind(wwwId, domainName, zoneId, `www.${domainName}`, domainName, now, now)
        .run();
    } catch {
      // Ignore background insert error
    }

    return defaultRecords;
  },

  /** Creates a new subdomain or DNS record */
  async createRecord(
    env: Env,
    domainNameInput: string,
    input: CreateRecordInput
  ): Promise<DomainRecordDto> {
    await this.ensureTables(env);
    const domainName = cleanDomainName(domainNameInput);

    let subdomain = (input.subdomain || '@').trim().toLowerCase();
    if (subdomain !== '@') {
      subdomain = subdomain.replace(/^\.+|\.+$/g, '');
      if (!SUBDOMAIN_PATTERN.test(subdomain)) {
        throw new HttpError(
          400,
          `Subdomain "${subdomain}" may only contain lowercase letters, numbers, and hyphens.`
        );
      }
    }

    const fullName = subdomain === '@' ? domainName : `${subdomain}.${domainName}`;
    const recordType = (input.type || 'A').toUpperCase() as DnsRecordType;
    const content = input.content.trim();
    if (!content) {
      throw new HttpError(400, 'Content (target IP or hostname) is required.');
    }

    const ttl = input.ttl ?? 1;
    const proxied = input.proxied !== undefined ? Boolean(input.proxied) : true;
    const comment = input.comment?.trim() || null;

    // Look up zoneId
    const zones = await this.listZones(env);
    const zone = zones.find((z) => z.name === domainName);
    const zoneId = zone?.id || null;

    let cfRecordId: string | null = null;
    if (zoneId) {
      try {
        const cfRecord = await cfFetch<CfDnsRecord>(
          env,
          `/zones/${zoneId}/dns_records`,
          {
            method: 'POST',
            body: JSON.stringify({
              type: recordType,
              name: fullName,
              content,
              priority: recordType === 'MX' ? (input.priority ?? 10) : undefined,
              ttl: proxied ? 1 : ttl,
              proxied: ['A', 'AAAA', 'CNAME'].includes(recordType) ? proxied : false,
              comment: comment || undefined,
            }),
          }
        );
        if (cfRecord?.id) {
          cfRecordId = cfRecord.id;
        }
      } catch {
        // Fallback to storing locally in D1
      }
    }

    const newId = cfRecordId || crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO domain_dns_records (id, domain_name, zone_id, subdomain, name, type, content, ttl, proxied, comment, cf_record_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        newId,
        domainName,
        zoneId,
        subdomain,
        fullName,
        recordType,
        content,
        ttl,
        proxied ? 1 : 0,
        comment,
        cfRecordId,
        now,
        now
      )
      .run();

    return {
      id: newId,
      domainName,
      zoneId: zoneId || undefined,
      subdomain,
      name: fullName,
      type: recordType,
      content,
      ttl,
      proxied,
      comment,
      cfRecordId,
      createdAt: now,
      updatedAt: now,
    };
  },

  /** Updates an existing DNS record / subdomain */
  async updateRecord(
    env: Env,
    domainNameInput: string,
    recordId: string,
    input: UpdateRecordInput
  ): Promise<DomainRecordDto> {
    await this.ensureTables(env);
    const domainName = cleanDomainName(domainNameInput);

    const existing = await env.DB.prepare(
      'SELECT * FROM domain_dns_records WHERE id = ? AND domain_name = ?'
    )
      .bind(recordId, domainName)
      .first<DomainDnsRecordRow>();

    const recordType = (input.type || existing?.type || 'A').toUpperCase() as DnsRecordType;
    let subdomain = input.subdomain !== undefined ? input.subdomain.trim().toLowerCase() : (existing?.subdomain || '@');
    if (subdomain !== '@') {
      subdomain = subdomain.replace(/^\.+|\.+$/g, '');
    }
    const fullName = subdomain === '@' ? domainName : `${subdomain}.${domainName}`;
    const content = input.content !== undefined ? input.content.trim() : (existing?.content || '');
    const ttl = input.ttl !== undefined ? input.ttl : (existing?.ttl ?? 1);
    const proxied = input.proxied !== undefined ? Boolean(input.proxied) : Boolean(existing?.proxied ?? 1);
    const comment = input.comment !== undefined ? (input.comment?.trim() || null) : (existing?.comment ?? null);
    const now = new Date().toISOString();

    // Try Cloudflare update if CF record ID exists
    const zoneId = existing?.zone_id || null;
    const cfRecordId = existing?.cf_record_id || null;
    if (zoneId && cfRecordId) {
      await cfFetch(env, `/zones/${zoneId}/dns_records/${cfRecordId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: recordType,
          name: fullName,
          content,
          priority: ['MX', 'SRV', 'URI'].includes(recordType)
            ? input.priority !== undefined
              ? input.priority
              : existing?.priority
            : undefined,
          ttl: proxied ? 1 : ttl,
          proxied: ['A', 'AAAA', 'CNAME'].includes(recordType) ? proxied : false,
          comment: comment || undefined,
        }),
      }).catch(() => undefined);
    }

    await env.DB.prepare(
      `UPDATE domain_dns_records
       SET subdomain = ?, name = ?, type = ?, content = ?, ttl = ?, proxied = ?, comment = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(
        subdomain,
        fullName,
        recordType,
        content,
        ttl,
        proxied ? 1 : 0,
        comment,
        now,
        recordId
      )
      .run();

    return {
      id: recordId,
      domainName,
      zoneId: zoneId || undefined,
      subdomain,
      name: fullName,
      type: recordType,
      content,
      ttl,
      proxied,
      comment,
      cfRecordId,
      createdAt: existing?.created_at || now,
      updatedAt: now,
    };
  },

  /** Deletes a DNS record / subdomain */
  async deleteRecord(
    env: Env,
    domainNameInput: string,
    recordId: string
  ): Promise<{ ok: boolean }> {
    await this.ensureTables(env);
    const domainName = cleanDomainName(domainNameInput);

    const existing = await env.DB.prepare(
      'SELECT zone_id, cf_record_id FROM domain_dns_records WHERE id = ? AND domain_name = ?'
    )
      .bind(recordId, domainName)
      .first<{ zone_id: string | null; cf_record_id: string | null }>();

    if (existing?.zone_id && existing.cf_record_id) {
      await cfFetch(
        env,
        `/zones/${existing.zone_id}/dns_records/${existing.cf_record_id}`,
        { method: 'DELETE' }
      ).catch(() => undefined);
    }

    await env.DB.prepare('DELETE FROM domain_dns_records WHERE id = ?')
      .bind(recordId)
      .run();

    return { ok: true };
  },

  /**
   * LEGACY COMPATIBILITY FOR MAIL VIEW:
   * Lists root domains plus any Email Routing subdomains
   */
  async list(env: Env): Promise<DomainDto[]> {
    const zones = await this.listZones(env);
    if (!zones.length) return [];

    const subdomainsByZone = new Map<string, Set<string>>();
    for (const z of zones) {
      subdomainsByZone.set(z.id, new Set<string>());
    }

    try {
      const { results: subRows } = await env.DB.prepare(
        'SELECT full_domain, zone_id FROM mail_subdomains'
      ).all<{ full_domain: string; zone_id: string }>();
      for (const row of subRows || []) {
        const domain = row.full_domain.trim().toLowerCase();
        const zone = zones.find((z) => z.id === row.zone_id);
        if (zone && domain !== zone.name && domain.endsWith(`.${zone.name}`)) {
          subdomainsByZone.get(zone.id)?.add(domain);
        }
      }
    } catch {
      // Ignore
    }

    const output: DomainDto[] = [];
    for (const zone of zones) {
      output.push(zone);
      const subs = Array.from(subdomainsByZone.get(zone.id) ?? []).sort();
      for (const sub of subs) {
        output.push({
          id: zone.id,
          name: sub,
          status: zone.status,
        });
      }
    }
    return output;
  },

  async findByName(env: Env, name: string): Promise<DomainDto | undefined> {
    const normalized = name.trim().toLowerCase();
    const zones = await this.listZones(env);
    const zone = zones.find(
      (d) => d.name === normalized || normalized.endsWith(`.${d.name}`)
    );
    return zone ? { id: zone.id, name: normalized, status: zone.status } : undefined;
  },

  async createSubdomain(
    env: Env,
    input: CreateSubdomainInput
  ): Promise<SubdomainDto> {
    const rootDomainInput = input.rootDomain.trim().toLowerCase();
    const subPart = input.subdomain.trim().toLowerCase();

    if (!SUBDOMAIN_PATTERN.test(subPart)) {
      throw new HttpError(
        400,
        'Subdomain may only contain lowercase letters, numbers, and hyphens.'
      );
    }

    const zones = await this.listZones(env);
    const zone = zones.find(
      (z) => z.name === rootDomainInput || rootDomainInput.endsWith(`.${z.name}`)
    );
    if (!zone) {
      throw new HttpError(400, `Root domain "${rootDomainInput}" was not found.`);
    }

    const fullDomain = `${subPart}.${zone.name}`;

    const existing = await env.DB.prepare(
      'SELECT id FROM mail_subdomains WHERE full_domain = ?'
    )
      .bind(fullDomain)
      .first<{ id: string }>();

    if (existing) {
      throw new HttpError(409, `Subdomain "${fullDomain}" is already registered.`);
    }

    const newId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO mail_subdomains (id, zone_id, root_domain, subdomain, full_domain, dns_status)
       VALUES (?, ?, ?, ?, ?, 'ready')`
    )
      .bind(newId, zone.id, zone.name, subPart, fullDomain)
      .run();

    return {
      id: newId,
      zoneId: zone.id,
      rootDomain: zone.name,
      subdomain: subPart,
      fullDomain,
      dnsStatus: 'ready',
      createdAt: new Date().toISOString(),
    };
  },

  async deleteSubdomain(
    env: Env,
    fullDomain: string
  ): Promise<{ deletedAccountsCount: number; deletedDnsRecordsCount: number }> {
    const normalized = fullDomain.trim().toLowerCase();
    await env.DB.prepare('DELETE FROM mail_subdomains WHERE full_domain = ?')
      .bind(normalized)
      .run()
      .catch(() => undefined);
    return { deletedAccountsCount: 0, deletedDnsRecordsCount: 0 };
  },
};

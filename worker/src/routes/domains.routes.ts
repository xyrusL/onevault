import { Hono } from 'hono';
import { HttpError } from '../lib/http-error';
import { domainsService } from '../services/domains.service';
import type {
  CreateDomainInput,
  CreateRecordInput,
  UpdateRecordInput,
} from '../types/domains.types';
import type { AppBindings } from '../types/env.types';
import type { CreateSubdomainInput } from '../types/mail.types';

export const domainsRoutes = new Hono<AppBindings>();

/**
 * GET /api/domains — lists domains.
 * If ?view=mail, returns flattened list including dedicated mail routing subdomains.
 * Otherwise returns rich DomainSummaryDto[] for domain management.
 */
domainsRoutes.get('/', async (c) => {
  const view = c.req.query('view');
  if (view === 'mail') {
    return c.json(await domainsService.list(c.env));
  }
  return c.json(await domainsService.listSummary(c.env));
});

/** POST /api/domains — register a new domain for web hosting & DNS */
domainsRoutes.post('/', async (c) => {
  const body = await c.req
    .json<Partial<CreateDomainInput>>()
    .catch(() => ({} as Partial<CreateDomainInput>));
  if (!body.name) {
    throw new HttpError(400, 'Domain name is required.');
  }
  const created = await domainsService.createDomain(c.env, { name: body.name });
  return c.json(created, 201);
});

/** DELETE /api/domains/:id — delete a domain and its DNS records */
domainsRoutes.delete('/:id', async (c) => {
  const idOrName = decodeURIComponent(c.req.param('id') || '');
  if (!idOrName) {
    throw new HttpError(400, 'Domain identifier is required.');
  }
  const result = await domainsService.deleteDomain(c.env, idOrName);
  return c.json(result);
});

/** GET /api/domains/:domainName/records — list all DNS records & subdomains for a domain */
domainsRoutes.get('/:domainName/records', async (c) => {
  const domainName = decodeURIComponent(c.req.param('domainName') || '');
  if (!domainName) {
    throw new HttpError(400, 'Domain name parameter is required.');
  }
  const records = await domainsService.listRecords(c.env, domainName);
  return c.json(records);
});

/** POST /api/domains/:domainName/records — create a new subdomain or DNS record */
domainsRoutes.post('/:domainName/records', async (c) => {
  const domainName = decodeURIComponent(c.req.param('domainName') || '');
  if (!domainName) {
    throw new HttpError(400, 'Domain name parameter is required.');
  }
  const body = await c.req
    .json<Partial<CreateRecordInput>>()
    .catch(() => ({} as Partial<CreateRecordInput>));
  if (!body.content) {
    throw new HttpError(400, 'Record content (IP or target host) is required.');
  }
  const record = await domainsService.createRecord(c.env, domainName, {
    subdomain: body.subdomain || '@',
    type: body.type || 'A',
    content: body.content,
    priority: body.priority !== undefined ? Number(body.priority) : undefined,
    ttl: body.ttl ?? 1,
    proxied: body.proxied !== undefined ? body.proxied : true,
    comment: body.comment,
  });
  return c.json(record, 201);
});

/** PUT /api/domains/:domainName/records/:recordId — update an existing DNS record */
domainsRoutes.put('/:domainName/records/:recordId', async (c) => {
  const domainName = decodeURIComponent(c.req.param('domainName') || '');
  const recordId = decodeURIComponent(c.req.param('recordId') || '');
  if (!domainName || !recordId) {
    throw new HttpError(400, 'Domain name and record ID are required.');
  }
  const body = await c.req
    .json<Partial<UpdateRecordInput>>()
    .catch(() => ({} as Partial<UpdateRecordInput>));
  const updated = await domainsService.updateRecord(c.env, domainName, recordId, {
    ...body,
    priority: body.priority !== undefined ? Number(body.priority) : undefined,
  });
  return c.json(updated);
});

/** DELETE /api/domains/:domainName/records/:recordId — delete a DNS record */
domainsRoutes.delete('/:domainName/records/:recordId', async (c) => {
  const domainName = decodeURIComponent(c.req.param('domainName') || '');
  const recordId = decodeURIComponent(c.req.param('recordId') || '');
  if (!domainName || !recordId) {
    throw new HttpError(400, 'Domain name and record ID are required.');
  }
  const result = await domainsService.deleteRecord(c.env, domainName, recordId);
  return c.json(result);
});

/** POST /api/domains/subdomains — legacy email routing subdomain creation */
domainsRoutes.post('/subdomains', async (c) => {
  const body = await c.req
    .json<Partial<CreateSubdomainInput>>()
    .catch(() => ({} as Partial<CreateSubdomainInput>));
  if (!body.rootDomain || !body.subdomain) {
    throw new HttpError(400, 'Both "rootDomain" and "subdomain" are required.');
  }
  const created = await domainsService.createSubdomain(c.env, {
    rootDomain: body.rootDomain,
    subdomain: body.subdomain,
  });
  return c.json(created, 201);
});

/** DELETE /api/domains/subdomains/:fullDomain — legacy email routing subdomain deletion */
domainsRoutes.delete('/subdomains/:fullDomain', async (c) => {
  const fullDomain = decodeURIComponent(c.req.param('fullDomain') || '');
  if (!fullDomain) {
    throw new HttpError(400, 'fullDomain parameter is required.');
  }
  await domainsService.deleteSubdomain(c.env, fullDomain);
  return c.json({ ok: true });
});

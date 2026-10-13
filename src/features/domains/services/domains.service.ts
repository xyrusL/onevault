import { apiRequest } from '../../../shared/services/api-client.service';
import type {
  CreateDomainPayload,
  CreateRecordPayload,
  DomainItem,
  DomainRecordItem,
  UpdateRecordPayload,
} from '../types/domains.types';

const CACHE_KEY = 'onevault.domains.cache.v1';

interface DomainsCache {
  domains: DomainItem[];
  recordsByDomain: Record<string, DomainRecordItem[]>;
}

let memoryCache: DomainsCache = (() => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : { domains: [], recordsByDomain: {} };
  } catch {
    return { domains: [], recordsByDomain: {} };
  }
})();

function persistCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
  } catch {
    // Ignore quota issues
  }
}

export const domainsService = {
  getCachedDomains(): DomainItem[] {
    return memoryCache.domains || [];
  },

  getCachedRecords(domainName: string): DomainRecordItem[] | null {
    return memoryCache.recordsByDomain?.[domainName.toLowerCase()] || null;
  },

  async listDomains(): Promise<DomainItem[]> {
    const domains = await apiRequest<DomainItem[]>('/domains');
    memoryCache.domains = domains;
    persistCache();
    return domains;
  },

  async createDomain(payload: CreateDomainPayload): Promise<DomainItem> {
    const created = await apiRequest<DomainItem>('/domains', {
      method: 'POST',
      body: payload,
    });
    memoryCache.domains = [created, ...memoryCache.domains.filter((d) => d.name !== created.name)];
    persistCache();
    return created;
  },

  async deleteDomain(idOrName: string): Promise<void> {
    await apiRequest<{ ok: boolean }>(`/domains/${encodeURIComponent(idOrName)}`, {
      method: 'DELETE',
    });
    memoryCache.domains = memoryCache.domains.filter(
      (d) => d.id !== idOrName && d.name !== idOrName
    );
    delete memoryCache.recordsByDomain[idOrName.toLowerCase()];
    persistCache();
  },

  async listRecords(domainName: string): Promise<DomainRecordItem[]> {
    const records = await apiRequest<DomainRecordItem[]>(
      `/domains/${encodeURIComponent(domainName)}/records`
    );
    if (!memoryCache.recordsByDomain) {
      memoryCache.recordsByDomain = {};
    }
    memoryCache.recordsByDomain[domainName.toLowerCase()] = records;
    persistCache();
    return records;
  },

  async createRecord(
    domainName: string,
    payload: CreateRecordPayload
  ): Promise<DomainRecordItem> {
    const created = await apiRequest<DomainRecordItem>(
      `/domains/${encodeURIComponent(domainName)}/records`,
      {
        method: 'POST',
        body: payload,
      }
    );
    const existing = memoryCache.recordsByDomain[domainName.toLowerCase()] || [];
    memoryCache.recordsByDomain[domainName.toLowerCase()] = [...existing, created];
    // update record count in cached domain
    const dom = memoryCache.domains.find((d) => d.name === domainName.toLowerCase());
    if (dom) {
      dom.recordCount += 1;
      if (created.subdomain && created.subdomain !== '@') {
        dom.subdomainCount += 1;
      }
    }
    persistCache();
    return created;
  },

  async updateRecord(
    domainName: string,
    recordId: string,
    payload: UpdateRecordPayload
  ): Promise<DomainRecordItem> {
    const updated = await apiRequest<DomainRecordItem>(
      `/domains/${encodeURIComponent(domainName)}/records/${encodeURIComponent(recordId)}`,
      {
        method: 'PUT',
        body: payload,
      }
    );
    const existing = memoryCache.recordsByDomain[domainName.toLowerCase()] || [];
    memoryCache.recordsByDomain[domainName.toLowerCase()] = existing.map((r) =>
      r.id === recordId ? updated : r
    );
    persistCache();
    return updated;
  },

  async deleteRecord(domainName: string, recordId: string): Promise<void> {
    await apiRequest<{ ok: boolean }>(
      `/domains/${encodeURIComponent(domainName)}/records/${encodeURIComponent(recordId)}`,
      {
        method: 'DELETE',
      }
    );
    const existing = memoryCache.recordsByDomain[domainName.toLowerCase()] || [];
    memoryCache.recordsByDomain[domainName.toLowerCase()] = existing.filter(
      (r) => r.id !== recordId
    );
    const dom = memoryCache.domains.find((d) => d.name === domainName.toLowerCase());
    if (dom && dom.recordCount > 0) {
      dom.recordCount -= 1;
    }
    persistCache();
  },
};

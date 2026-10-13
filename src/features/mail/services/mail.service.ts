import { apiRequest } from '../../../shared/services/api-client.service';
import {
  CreateMailPayload,
  ForwardTarget,
  MailAccountItem,
  MailDomain,
  NO_FORWARD,
  UpdateMailPayload,
} from '../types/mail.types';

interface MailAccountDto {
  id: string;
  localPart: string;
  domain: string;
  email: string;
  forwardTo: string | null;
  note: string | null;
  createdAt: string;
}

interface MailCacheSnapshot {
  accounts: MailAccountItem[];
  domains: MailDomain[];
  forwardTargets: ForwardTarget[];
}

const CACHE_STORAGE_KEY = 'onevault.mail.cache.v1';

let memoryCache: MailCacheSnapshot | null = (() => {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MailCacheSnapshot) : null;
  } catch {
    return null;
  }
})();

function persistCache(partial: Partial<MailCacheSnapshot>) {
  memoryCache = {
    accounts: partial.accounts ?? memoryCache?.accounts ?? [],
    domains: partial.domains ?? memoryCache?.domains ?? [],
    forwardTargets: partial.forwardTargets ?? memoryCache?.forwardTargets ?? [],
  };
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(memoryCache));
  } catch {
    // Ignore storage quota errors
  }
}

function toItem(dto: MailAccountDto): MailAccountItem {
  const created = new Date(dto.createdAt);
  return {
    id: dto.id,
    localPart: dto.localPart,
    domain: dto.domain,
    email: dto.email,
    forwardTo: !dto.forwardTo || dto.forwardTo === 'None' ? NO_FORWARD : dto.forwardTo,
    note: dto.note ?? '',
    createdDate: created.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    createdTime: created.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

const forwardValue = (forwardTo: string) =>
  !forwardTo || forwardTo === NO_FORWARD || forwardTo === 'None' ? null : forwardTo;

/** Talks to onevault-worker (`/api/mail`, `/api/domains`, `/api/forward-targets`). */
export const mailService = {
  /** Returns last known data synchronously so the UI never flashes a blank loading state. */
  getCached(): MailCacheSnapshot | null {
    return memoryCache;
  },

  async list(): Promise<MailAccountItem[]> {
    const rows = await apiRequest<MailAccountDto[]>('/mail');
    const items = rows.map(toItem);
    persistCache({ accounts: items });
    return items;
  },

  async create(payload: CreateMailPayload): Promise<MailAccountItem> {
    const dto = await apiRequest<MailAccountDto>('/mail', {
      method: 'POST',
      body: {
        ...payload,
        forwardTo: forwardValue(payload.forwardTo),
        note: payload.note?.trim() || null,
      },
    });
    const created = toItem(dto);
    persistCache({
      accounts: [created, ...(memoryCache?.accounts ?? [])],
    });
    return created;
  },

  async update(id: string, payload: UpdateMailPayload): Promise<MailAccountItem> {
    const dto = await apiRequest<MailAccountDto>(`/mail/${id}`, {
      method: 'PATCH',
      body: {
        forwardTo: forwardValue(payload.forwardTo),
        note: payload.note.trim() || null,
      },
    });
    const updated = toItem(dto);
    if (memoryCache) {
      persistCache({
        accounts: memoryCache.accounts.map((item) =>
          item.id === id ? updated : item
        ),
      });
    }
    return updated;
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/mail/${id}`, { method: 'DELETE' });
    if (memoryCache) {
      persistCache({
        accounts: memoryCache.accounts.filter((item) => item.id !== id),
      });
    }
  },

  /** Domains in the connected Cloudflare account. */
  async listDomains(): Promise<MailDomain[]> {
    const domains = await apiRequest<MailDomain[]>('/domains?view=mail');
    persistCache({ domains });
    return domains;
  },

  /** Verified Email Routing destination addresses. */
  async listForwardTargets(): Promise<ForwardTarget[]> {
    const all = await apiRequest<ForwardTarget[]>('/forward-targets');
    const verified = all.filter((t) => t.verified);
    persistCache({ forwardTargets: verified });
    return verified;
  },

  /** Registers a new dedicated email routing subdomain under a root domain. */
  async createSubdomain(payload: import('../types/mail.types').CreateSubdomainPayload): Promise<import('../types/mail.types').CreatedSubdomainItem> {
    const res = await apiRequest<import('../types/mail.types').CreatedSubdomainItem>(
      '/domains/subdomains',
      {
        method: 'POST',
        body: payload,
      }
    );
    const updatedDomains = await this.listDomains();
    persistCache({ domains: updatedDomains });
    return res;
  },

  /** Deletes a registered email routing subdomain, its Cloudflare DNS records, and any associated mail addresses. */
  async deleteSubdomain(fullDomain: string): Promise<{ deletedAccountsCount: number; deletedDnsRecordsCount: number }> {
    const res = await apiRequest<{ ok: boolean; deletedAccountsCount: number; deletedDnsRecordsCount: number }>(
      `/domains/subdomains/${encodeURIComponent(fullDomain)}`,
      { method: 'DELETE' }
    );
    const [updatedAccounts, updatedDomains] = await Promise.all([
      this.list(),
      this.listDomains(),
    ]);
    persistCache({ accounts: updatedAccounts, domains: updatedDomains });
    return res;
  },
};

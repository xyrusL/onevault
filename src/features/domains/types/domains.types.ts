export type DnsRecordType =
  | 'A'
  | 'AAAA'
  | 'CAA'
  | 'CERT'
  | 'CNAME'
  | 'DNSKEY'
  | 'DS'
  | 'HTTPS'
  | 'LOC'
  | 'MX'
  | 'NAPTR'
  | 'NS'
  | 'OPENPGPKEY'
  | 'PTR'
  | 'SMIMEA'
  | 'SRV'
  | 'SSHFP'
  | 'SVCB'
  | 'TLSA'
  | 'TXT'
  | 'URI'
  | (string & {});

export interface DomainItem {
  id: string;
  name: string;
  status: string;
  nameServers: string[];
  recordCount: number;
  subdomainCount: number;
  source: 'cloudflare' | 'local';
  createdAt?: string;
}

export interface DomainRecordItem {
  id: string;
  domainName: string;
  zoneId?: string;
  subdomain: string;
  name: string;
  type: DnsRecordType;
  content: string;
  priority?: number;
  ttl: number;
  proxied: boolean;
  comment?: string | null;
  cfRecordId?: string | null;
  locked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDomainPayload {
  name: string;
}

export interface CreateRecordPayload {
  subdomain: string;
  type: DnsRecordType;
  content: string;
  priority?: number;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
}

export interface UpdateRecordPayload {
  subdomain?: string;
  type?: DnsRecordType;
  content?: string;
  priority?: number;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
}

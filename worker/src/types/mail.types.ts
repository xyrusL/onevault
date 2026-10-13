export interface MailAccountRecord {
  id: string;
  local_part: string;
  domain: string;
  email: string;
  zone_id: string;
  routing_rule_id: string | null;
  forward_to: string | null;
  note: string | null;
  created_at: string;
}

/** Shape returned to the React site */
export interface MailAccountDto {
  id: string;
  localPart: string;
  domain: string;
  email: string;
  forwardTo: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreateMailInput {
  localPart: string;
  domain: string;
  forwardTo: string | null;
  note?: string | null;
}

export interface UpdateMailInput {
  forwardTo?: string | null;
  note?: string | null;
}

export interface DomainDto {
  id: string;
  name: string;
  status: string;
}

export interface ForwardTargetDto {
  email: string;
  verified: boolean;
}

export interface SubdomainDto {
  id: string;
  zoneId: string;
  rootDomain: string;
  subdomain: string;
  fullDomain: string;
  dnsStatus: string;
  createdAt: string;
}

export interface CreateSubdomainInput {
  rootDomain: string;
  subdomain: string;
}

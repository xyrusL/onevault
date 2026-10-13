/** Sentinel shown in the UI when an address routes internally to OneVault storage (D1) rather than an external email. */
export const NO_FORWARD = 'Vault';

export const isVaultDestination = (target?: string | null): boolean =>
  !target || target === 'Vault' || target === 'None';

export interface MailAccountItem {
  id: string;
  localPart: string;
  domain: string;
  email: string;
  /** `NO_FORWARD` when not forwarding */
  forwardTo: string;
  note: string;
  createdDate: string;
  createdTime: string;
}

export interface CreateMailPayload {
  localPart: string;
  domain: string;
  forwardTo: string;
  note?: string;
}

export interface UpdateMailPayload {
  forwardTo: string;
  note: string;
}

export interface MailDomain {
  id: string;
  name: string;
  status: string;
}

export interface ForwardTarget {
  email: string;
  verified: boolean;
}

export interface CreateSubdomainPayload {
  rootDomain: string;
  subdomain: string;
}

export interface CreatedSubdomainItem {
  id: string;
  zoneId: string;
  rootDomain: string;
  subdomain: string;
  fullDomain: string;
  dnsStatus: string;
  createdAt: string;
}

export type MailViewMode = 'all' | 'folders' | 'activity';

export interface MailFolderInfo {
  fullDomain: string;
  rootDomain: string;
  subdomainPart: string | null;
  isRoot: boolean;
  totalEmails: number;
}

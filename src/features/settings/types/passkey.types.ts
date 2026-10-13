export interface PasskeyItem {
  id: string;
  userId: string;
  name: string;
  deviceType?: string;
  backedUp: boolean;
  transports?: string[];
  aaguid?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

export interface PasskeyStatusResponse {
  hasPasskeys: boolean;
}

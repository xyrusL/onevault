export type ProjectStatus = 'active' | 'connecting' | 'disabled' | 'maintenance';

export interface ConcealedEndpoint {
  id: string;
  name: string;
  targetUrl: string;
  proxyPathPrefix: string;
  isSecret: boolean;
}

export interface ProjectShieldPolicy {
  antiBot: boolean;
  rateLimitPerMin: number;
  streamTokenSigning: boolean;
  tokenExpiryMinutes: number;
  originLock: boolean;
  stealth404: boolean;
  devMode?: boolean;
  concealedEndpoints?: ConcealedEndpoint[];
}

export interface ProjectStats {
  activeViewers: number;
  totalRequestsToday: number;
  blockedThreatsToday: number;
  avgLatencyMs: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  gatewayToken: string;
  domains: string[];
  upstreamApi: string;
  shieldPolicy: ProjectShieldPolicy;
  stats: ProjectStats;
  siteUrl?: string;
  iconUrl?: string;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  slug: string;
  description: string;
  domains: string[];
  upstreamApi: string;
  siteUrl?: string;
  gatewayToken?: string;
  shieldPolicy?: Partial<ProjectShieldPolicy>;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  domains?: string[];
  upstreamApi?: string;
  siteUrl?: string;
  gatewayToken?: string;
  shieldPolicy?: Partial<ProjectShieldPolicy>;
}

export interface InspectSiteResponse {
  ok: boolean;
  name: string;
  slug: string;
  description: string;
  domains: string[];
  siteUrl: string;
}

export interface HandshakeResponse {
  ok: boolean;
  project: string;
  status: ProjectStatus;
  verified: boolean;
  message: string;
}

export type DeviceType = 'pc' | 'mobile' | 'tablet' | 'smart_tv' | 'console' | 'unknown';

export type TelemetryEventType =
  | 'page_view'
  | 'stream_start'
  | 'stream_heartbeat'
  | 'stream_watch'
  | 'devtools_inspect'
  | '404_error'
  | 'player_error'
  | 'network_offline';

export interface TelemetryEventItem {
  id: string;
  projectSlug: string;
  eventType: TelemetryEventType | string;
  title?: string;
  path?: string;
  category?: string;
  mediaId?: string;
  season?: number;
  episode?: number;
  watchMinutes: number;
  deviceType: DeviceType | string;
  clientIp: string;
  country: string;
  city?: string;
  asnOrg?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface ProjectTelemetrySummary {
  summary: {
    activeViewers: number;
    totalWatchMinutes: number;
    totalPageViews: number;
    totalInspections: number;
    totalErrors: number;
    deviceBreakdown: {
      pc: number;
      mobile: number;
      tablet: number;
      smartTv: number;
    };
  };
  recentEvents: TelemetryEventItem[];
  topContent: Array<{
    title: string;
    category?: string;
    totalMinutes: number;
    views: number;
  }>;
  recentInspectors: TelemetryEventItem[];
  errorDiagnostics: TelemetryEventItem[];
}

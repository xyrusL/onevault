export interface DashboardVaultHealth {
  status: 'healthy' | 'degraded';
  cloudflareEdge: 'online';
  d1Database: 'connected';
  totalVaultItems: number;
  lastSyncedAt: string;
}

export interface DashboardMailStats {
  totalAccounts: number;
  forwardedAccounts: number;
  directInboxAccounts: number;
  forwardPercentage: number;
  directPercentage: number;
  totalReceivedMessages: number;
  unreadMessages: number;
  activeSubdomains: number;
  recentMessages: Array<{
    id: string;
    accountId: string;
    recipientEmail: string;
    sender: string;
    senderName: string;
    subject: string;
    receivedAt: string;
    isRead: boolean;
  }>;
  recentAccounts: Array<{
    id: string;
    email: string;
    forwardTo: string | null;
    createdAt: string;
  }>;
}

export interface DashboardTwoFactorStats {
  totalTokens: number;
  uniqueIssuers: number;
  topIssuers: Array<{ issuer: string; count: number }>;
  recentTokens: Array<{
    id: string;
    issuer: string;
    label: string;
    createdAt: string;
  }>;
}

export interface DashboardNotesStats {
  totalNotes: number;
  totalFolders: number;
  pinnedNotes: number;
  archivedNotes: number;
  colorBreakdown: Array<{ color: string; count: number }>;
  recentNotes: Array<{
    id: string;
    title: string;
    folderName: string | null;
    color: string;
    updatedAt: string;
  }>;
}

export interface DashboardAuditLogItem {
  id: string;
  level: 'info' | 'warning' | 'error';
  category: 'mail' | 'two_factor' | 'notes' | 'auth' | 'backup' | 'system';
  title: string;
  message: string;
  details?: string | null;
  statusCode?: number;
  statusText?: string;
  rootCause?: string;
  resolution?: string;
  createdAt: string;
}

export interface DashboardAuditStats {
  total: number;
  warnings: number;
  errors: number;
  recentLogs: DashboardAuditLogItem[];
}

export interface DashboardItemDistribution {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ApiEndpointHealth {
  key?: string;
  name: string;
  category: 'notes' | 'mail' | 'two_factor' | 'auth' | 'backup' | 'system';
  path: string;
  status: 'operational' | 'degraded' | 'down';
  statusText?: string;
  statusMeaning?: string;
  latencyMs: number;
  uptimePct: number;
  errorCount: number;
  color?: string;
  lastChecked: string;
}

export interface ApiLiveTelemetryPoint {
  time: string;
  latency: number;
  status: 'ok' | 'warning' | 'error';
  endpoint?: string;
  incidentDetails?: {
    type: 'outage' | 'warning' | 'degraded';
    title: string;
    description: string;
    statusText?: string;
    statusCode?: number;
    rootCause?: string;
    resolution?: string;
    timestamp: string;
    endpoint: string;
    latencyMs: number;
    resolved: boolean;
  };
  notes?: number;
  mail?: number;
  twoFactor?: number;
  auth?: number;
  backup?: number;
  domains?: number;
  [key: string]: string | number | boolean | object | undefined;
}

export interface ApiStatusDistribution {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DashboardApiHealthStats {
  overallStatus: 'operational' | 'degraded' | 'down';
  uptimePercentage: number;
  averageLatencyMs: number;
  endpoints: ApiEndpointHealth[];
  distribution: ApiStatusDistribution[];
  history: ApiLiveTelemetryPoint[];
}

export type DashboardViewMode = 'overview' | 'globe' | 'flatmap' | 'threat-defense';

export interface GlobalCountryNode {
  code: string;
  country: string;
  city: string;
  colo: string;
  continent: 'NA' | 'EU' | 'AS' | 'SA' | 'OC' | 'AF';
  lat: number;
  lng: number;
  requests: number;
  growthPct: number;
  latencyMs: number;
  status: 'normal' | 'busy' | 'threat' | 'sync';
}

export interface GlobalDomainInteraction {
  domain: string;
  mailboxes: number;
  signals: number;
  primaryColo: string;
  uptimePct: number;
  sparkline: number[];
}

export interface CloudflareFirewallEvent {
  id: string;
  action: string;
  clientCountryName: string;
  clientIP: string;
  clientAsn?: string;
  datetime: string;
  ruleId: string;
  source: string;
  host: string;
}

export interface CloudflareColoTraffic {
  coloCode: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  requests: number;
  bytes: number;
}

export interface CloudflareDailyMetric {
  date: string;
  requests: number;
  threats: number;
  bytes: number;
}

export interface CloudflareSecurityTelemetry {
  totalThreats7d: number;
  totalRequests7d: number;
  totalFirewallEvents: number;
  mitigationsByAction: Record<string, number>;
  topThreatCountries: Array<{
    countryCode: string;
    countryName: string;
    threats: number;
    lat: number;
    lng: number;
  }>;
  recentFirewallEvents: CloudflareFirewallEvent[];
  topColos: CloudflareColoTraffic[];
  dailyMetrics: CloudflareDailyMetric[];
  hasLiveCloudflareData: boolean;
  liveAttackCount?: number;
  liveThreatCountries?: Array<{
    countryCode: string;
    countryName: string;
    action: string;
    datetime: string;
    lat: number;
    lng: number;
  }>;
}

export interface DashboardGlobalEdgeStats {
  viewerCountry: string;
  viewerCity: string;
  viewerColo: string;
  viewerLat: number;
  viewerLng: number;
  viewerRegion?: string;
  viewerAsn?: number;
  viewerAsOrg?: string;
  viewerTimezone?: string;
  clientTcpRttMs?: number;
  tlsVersion: string;
  httpProtocol: string;
  totalGlobalSignals: number;
  cacheHitRatio: number;
  globalAvgLatencyMs: number;
  domains: GlobalDomainInteraction[];
  countries: GlobalCountryNode[];
  continentShares: Array<{
    code: string;
    name: string;
    signals: number;
    percentage: number;
    growth: string;
    color: string;
  }>;
  securityTelemetry?: CloudflareSecurityTelemetry;
}

export interface DdosCountryTrafficItem {
  countryCode: string;
  countryName: string;
  asnOrg: string;
  requestsPerSec: number;
  totalIncomingRequests: number;
  blockedRequests: number;
  blockedPct: number;
  attackVector: string;
  mitigationStatus: 'Blocked at Edge' | 'Rate-Limited (429)' | 'WAF Challenged' | 'Verified Admin';
  severity: 'critical' | 'high' | 'medium' | 'safe';
}

export interface DdosProtectedPathItem {
  id: string;
  name: string;
  path: string;
  targetLayer: 'Worker Isolate' | 'D1 SQLite' | 'Edge Auth' | 'DNS & Mail';
  protectionMethod: string;
  statusText: string;
  blockedProbes: number;
  latencyMs: number;
  status: 'shielded' | 'throttling';
}

export interface DdosDefenseLayerItem {
  id:
    | 'zeroD1Gate'
    | 'singleDeviceLock'
    | 'slidingRateLimit'
    | 'd1PayloadCircuit'
    | 'botSignatureScrubber';
  name: string;
  shortBadge: string;
  description: string;
  impactMetric: string;
  enabled: boolean;
}

export interface DdosDefenseTelemetry {
  active: boolean;
  threatLevel: 'critical' | 'elevated' | 'guarded';
  attackSignature: string;
  detectedAt: string;
  temporaryUntil: string;
  edgeColo: string;
  viewerCountry: string;
  peakRps: number;
  normalBaselineRps: number;
  mitigationRatePct: number;
  totalIncomingAttackRequests: number;
  totalBlockedAtEdge: number;
  d1QueriesSaved: number;
  cloudflareSource: 'Cloudflare GraphQL + Edge Isolate' | 'Edge Isolate Real-Time Shield';
  sessionLockdown: {
    enabled: boolean;
    pinnedDeviceLabel: string;
    revokedPreviousSessions: number;
    lastPinnedAt: string;
    currentTokenPinned: boolean;
  };
  incomingCountries: DdosCountryTrafficItem[];
  protectedDataPaths: DdosProtectedPathItem[];
  defenseLayers: DdosDefenseLayerItem[];
}

export type ImmuneActionState =
  | 'ALLOW'
  | 'RATE_LIMITED'
  | 'TEMP_QUARANTINE'
  | 'PENETRATION_BLOCK';

export interface ImmuneActorRecord {
  id: string;
  actorIp: string;
  countryCode: string;
  countryName: string;
  asnOrg: string;
  userAgentSummary: string;
  riskScore: number;
  action: ImmuneActionState;
  detectionVector: string;
  targetPaths: string[];
  requestCount: number;
  distinct404Count: number;
  quarantineExpiresAt: string | null;
  lastSeenAt: string;
  isAuthenticatedUser: boolean;
}

export interface ImmuneAntibodyRule {
  id: string;
  layerNumber: number;
  name: string;
  category:
    | 'Page Scanner Guard'
    | 'Canary Honeypot'
    | 'Payload Antibody'
    | 'Adaptive Rate Guard'
    | 'Self-Tolerance'
    | 'Console & Client-Side Malware Guard';
  triggerCondition: string;
  responseAction: string;
  falsePositiveGuard: string;
  interceptedCount: number;
  status: 'active' | 'learning';
}

export interface ImmuneTestCaseResult {
  id: string;
  category: 'legitimate_zero_fp' | 'malicious_threat';
  name: string;
  scenarioDescription: string;
  simulatedPath: string;
  expectedOutcome: ImmuneActionState;
  actualOutcome: ImmuneActionState;
  riskScore: number;
  passed: boolean;
  executionTimeMs: number;
  explanation: string;
}

export interface ImmuneVerificationSuiteSummary {
  lastRunAt: string;
  totalTests: number;
  passedTests: number;
  legitimateTestsPassed: number;
  legitimateTestsTotal: number;
  maliciousTestsPassed: number;
  maliciousTestsTotal: number;
  falsePositiveRatePct: number;
  detectionAccuracyPct: number;
  surgicalIsolationVerified: boolean;
  results: ImmuneTestCaseResult[];
}

export interface ImmuneSystemTelemetry {
  status: 'active_monitoring' | 'surgical_mitigation';
  engineVersion: string;
  modeDescription: string;
  totalMonitoredActors: number;
  legitimateActorsAllowed: number;
  activeQuarantinedIps: number;
  activeRateLimitedIps: number;
  penetrationAttemptsBlocked: number;
  pageScansIntercepted: number;
  honeypotTrapsTriggered: number;
  falsePositiveCount: number;
  falsePositiveRatePct: number;
  humanTypoForgivenessLimit: number;
  scannerDistinct404Threshold: number;
  antibodyRules: ImmuneAntibodyRule[];
  recentActors: ImmuneActorRecord[];
  verificationSuite: ImmuneVerificationSuiteSummary;
}

export interface DashboardStats {
  vault: DashboardVaultHealth;
  mail: DashboardMailStats;
  twoFactor: DashboardTwoFactorStats;
  notes: DashboardNotesStats;
  auditLogs: DashboardAuditStats;
  distribution: DashboardItemDistribution[];
  apiHealth?: DashboardApiHealthStats;
  globalEdge?: DashboardGlobalEdgeStats;
  ddosDefense?: DdosDefenseTelemetry;
  immuneSystem?: ImmuneSystemTelemetry;
}



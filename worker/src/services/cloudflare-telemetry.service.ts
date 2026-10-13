import type { Env } from '../types/env.types';
import { cfFetch } from '../lib/cloudflare-api';
import {
  resolveColoAndCountryGeo,
  resolveCountryGeo,
} from '../../../src/features/dashboard/utils/flat-map-geo.utils';

export interface CloudflareFirewallEventDto {
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

export interface CloudflareColoTrafficDto {
  coloCode: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  requests: number;
  bytes: number;
}

export interface CloudflareDailyMetricDto {
  date: string;
  requests: number;
  threats: number;
  bytes: number;
}

export interface CloudflareSecurityTelemetryDto {
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
  recentFirewallEvents: CloudflareFirewallEventDto[];
  topColos: CloudflareColoTrafficDto[];
  dailyMetrics: CloudflareDailyMetricDto[];
  hasLiveCloudflareData: boolean;
  liveAttackCount: number;
  liveThreatCountries: Array<{
    countryCode: string;
    countryName: string;
    action: string;
    datetime: string;
    lat: number;
    lng: number;
  }>;
}

export const KNOWN_COLOS: Record<string, { city: string; country: string; lat: number; lng: number }> = {
  SYD: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  ICN: { city: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978 },
  MNL: { city: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  BOM: { city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 },
  CDG: { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  AMS: { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  HKG: { city: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  WAW: { city: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 },
  KIX: { city: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023 },
  NRT: { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  SJC: { city: 'San Jose', country: 'United States', lat: 37.3382, lng: -121.8863 },
  LHR: { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  FRA: { city: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821 },
  SIN: { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  YYZ: { city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  SEA: { city: 'Seattle', country: 'United States', lat: 47.6062, lng: -122.3321 },
  DFW: { city: 'Dallas', country: 'United States', lat: 32.7767, lng: -96.797 },
  MXP: { city: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.19 },
  LAX: { city: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
  ORD: { city: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  EWR: { city: 'Newark', country: 'United States', lat: 40.7357, lng: -74.1724 },
  IAD: { city: 'Washington DC', country: 'United States', lat: 38.9072, lng: -77.0369 },
  MIA: { city: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918 },
  GRU: { city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  JNB: { city: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  DXB: { city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  MAD: { city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  ZRH: { city: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  ARN: { city: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
  CPH: { city: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },
  MEL: { city: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  BNE: { city: 'Brisbane', country: 'Australia', lat: -27.4698, lng: 153.0251 },
  AKL: { city: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633 },
  TPE: { city: 'Taipei', country: 'Taiwan', lat: 25.033, lng: 121.5654 },
  BKK: { city: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  KUL: { city: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869 },
  CGK: { city: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  DEL: { city: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209 },
  DOH: { city: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.531 },
  CAI: { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  SCL: { city: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },
  EZE: { city: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  BOG: { city: 'Bogota', country: 'Colombia', lat: 4.711, lng: -74.0721 },
  LIM: { city: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },
  MEX: { city: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
};

export const KNOWN_COUNTRIES: Record<
  string,
  { name: string; lat: number; lng: number; continent: 'NA' | 'EU' | 'AS' | 'SA' | 'OC' | 'AF' }
> = {
  US: { name: 'United States', lat: 37.0902, lng: -95.7129, continent: 'NA' },
  AU: { name: 'Australia', lat: -25.2744, lng: 133.7751, continent: 'OC' },
  KR: { name: 'South Korea', lat: 35.9078, lng: 127.7669, continent: 'AS' },
  NL: { name: 'Netherlands', lat: 52.1326, lng: 5.2913, continent: 'EU' },
  PH: { name: 'Philippines', lat: 12.8797, lng: 121.774, continent: 'AS' },
  HK: { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, continent: 'AS' },
  CA: { name: 'Canada', lat: 56.1304, lng: -106.3468, continent: 'NA' },
  PL: { name: 'Poland', lat: 51.9194, lng: 19.1451, continent: 'EU' },
  SG: { name: 'Singapore', lat: 1.3521, lng: 103.8198, continent: 'AS' },
  DE: { name: 'Germany', lat: 51.1657, lng: 10.4515, continent: 'EU' },
  GB: { name: 'United Kingdom', lat: 55.3781, lng: -3.436, continent: 'EU' },
  FR: { name: 'France', lat: 46.2276, lng: 2.2137, continent: 'EU' },
  JP: { name: 'Japan', lat: 36.2048, lng: 138.2529, continent: 'AS' },
  IN: { name: 'India', lat: 20.5937, lng: 78.9629, continent: 'AS' },
  CN: { name: 'China', lat: 35.8617, lng: 104.1954, continent: 'AS' },
  BR: { name: 'Brazil', lat: -14.235, lng: -51.9253, continent: 'SA' },
  ZA: { name: 'South Africa', lat: -30.5595, lng: 22.9375, continent: 'AF' },
  AE: { name: 'United Arab Emirates', lat: 23.4241, lng: 53.8478, continent: 'AS' },
  TR: { name: 'Turkey', lat: 38.9637, lng: 35.2433, continent: 'AS' },
  IT: { name: 'Italy', lat: 41.8719, lng: 12.5674, continent: 'EU' },
  ES: { name: 'Spain', lat: 40.4637, lng: -3.7492, continent: 'EU' },
  NZ: { name: 'New Zealand', lat: -40.9006, lng: 174.886, continent: 'OC' },
  MX: { name: 'Mexico', lat: 23.6345, lng: -102.5528, continent: 'NA' },
  ID: { name: 'Indonesia', lat: -0.7893, lng: 113.9213, continent: 'AS' },
  TH: { name: 'Thailand', lat: 15.87, lng: 100.9925, continent: 'AS' },
  VN: { name: 'Vietnam', lat: 14.0583, lng: 108.2772, continent: 'AS' },
  MY: { name: 'Malaysia', lat: 4.2105, lng: 101.9758, continent: 'AS' },
  TW: { name: 'Taiwan', lat: 23.6978, lng: 120.9605, continent: 'AS' },
  SE: { name: 'Sweden', lat: 60.1282, lng: 18.6435, continent: 'EU' },
  CH: { name: 'Switzerland', lat: 46.8182, lng: 8.2275, continent: 'EU' },
  AT: { name: 'Austria', lat: 47.5162, lng: 14.5501, continent: 'EU' },
  BE: { name: 'Belgium', lat: 50.5039, lng: 4.4699, continent: 'EU' },
  IE: { name: 'Ireland', lat: 53.1424, lng: -7.6921, continent: 'EU' },
  NO: { name: 'Norway', lat: 60.472, lng: 8.4689, continent: 'EU' },
  DK: { name: 'Denmark', lat: 56.2639, lng: 9.5018, continent: 'EU' },
  FI: { name: 'Finland', lat: 61.9241, lng: 25.7482, continent: 'EU' },
  CZ: { name: 'Czech Republic', lat: 49.8175, lng: 15.473, continent: 'EU' },
  RO: { name: 'Romania', lat: 45.9432, lng: 24.9668, continent: 'EU' },
  UA: { name: 'Ukraine', lat: 48.3794, lng: 31.1656, continent: 'EU' },
  IL: { name: 'Israel', lat: 31.0461, lng: 34.8516, continent: 'AS' },
  EG: { name: 'Egypt', lat: 26.8206, lng: 30.8025, continent: 'AF' },
  NG: { name: 'Nigeria', lat: 9.082, lng: 8.6753, continent: 'AF' },
  KE: { name: 'Kenya', lat: -0.0236, lng: 37.9062, continent: 'AF' },
  AR: { name: 'Argentina', lat: -38.4161, lng: -63.6167, continent: 'SA' },
  CL: { name: 'Chile', lat: -35.6751, lng: -71.543, continent: 'SA' },
  CO: { name: 'Colombia', lat: 4.5709, lng: -74.2973, continent: 'SA' },
  PE: { name: 'Peru', lat: -9.19, lng: -75.0152, continent: 'SA' },
};

// In-memory cache in worker runtime to protect Cloudflare Free Tier & prevent rate-limiting
let cachedTelemetry: CloudflareSecurityTelemetryDto | null = null;
let lastTelemetryFetchMs = 0;
const TELEMETRY_CACHE_TTL_MS = 60000; // 60 seconds TTL

export const cloudflareTelemetryService = {
  async getSecurityTelemetry(env: Env): Promise<CloudflareSecurityTelemetryDto> {
    const now = Date.now();
    if (cachedTelemetry && now - lastTelemetryFetchMs < TELEMETRY_CACHE_TTL_MS) {
      return cachedTelemetry;
    }

    if (!env.CF_API_TOKEN) {
      return {
        totalThreats7d: 0,
        totalRequests7d: 0,
        totalFirewallEvents: 0,
        mitigationsByAction: {},
        topThreatCountries: [],
        recentFirewallEvents: [],
        topColos: [],
        dailyMetrics: [],
        hasLiveCloudflareData: false,
        liveAttackCount: 0,
        liveThreatCountries: [],
      };
    }

    try {
      // 1. Resolve Zone IDs: either from Cloudflare Zones REST API or known active zones
      let zoneTags: string[] = [];
      try {
        interface ZoneSummary {
          id: string;
        }
        const zones = await cfFetch<ZoneSummary[]>(
          env,
          `/zones?account.id=${env.CF_ACCOUNT_ID}&per_page=50&status=active`
        );
        zoneTags = zones.map((z) => z.id);
      } catch {
        // Fallback to known zones if zones REST endpoint errors
      }

      if (zoneTags.length === 0) {
        zoneTags = [
          '3d6bf35a0d76404bae731257d5ee8a58', // ainxe.com
          '0eac00bf795003fb6744685ae5c50e17', // dezely.com
          '60be8001944d6c2354d8ccedc81bf06a', // deze.me
        ];
      }

      const sevenDaysAgoDate = new Date(now - 7 * 86400000).toISOString().slice(0, 10);
      const sevenDaysAgoIso = new Date(now - 7 * 86400000).toISOString();

      const query = `
        query GetSecurityAndTraffic($zoneTags: [String!], $sinceDate: String!, $sinceDateTime: String!) {
          viewer {
            zones(filter: { zoneTag_in: $zoneTags }) {
              zoneTag
              httpRequests1dGroups(limit: 14, filter: { date_geq: $sinceDate }) {
                dimensions { date }
                sum { requests bytes threats pageViews }
              }
              firewallEventsAdaptive(limit: 100, filter: { datetime_geq: $sinceDateTime }) {
                action
                clientCountryName
                clientIP
                clientAsn
                datetime
                ruleId
                source
                clientRequestHTTPHost
              }
              httpRequestsAdaptiveGroups(limit: 100, filter: { datetime_geq: $sinceDateTime }) {
                count
                dimensions {
                  clientCountryName
                  coloCode
                }
                sum {
                  edgeResponseBytes
                  visits
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            zoneTags,
            sinceDate: sevenDaysAgoDate,
            sinceDateTime: sevenDaysAgoIso,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare GraphQL HTTP ${response.status}`);
      }

      interface GraphQLResponse {
        data?: {
          viewer?: {
            zones?: Array<{
              zoneTag: string;
              httpRequests1dGroups?: Array<{
                dimensions: { date: string };
                sum: { requests?: number; bytes?: number; threats?: number; pageViews?: number };
              }>;
              firewallEventsAdaptive?: Array<{
                action: string;
                clientCountryName: string;
                clientIP: string;
                clientAsn?: string;
                datetime: string;
                ruleId: string;
                source: string;
                clientRequestHTTPHost: string;
              }>;
              httpRequestsAdaptiveGroups?: Array<{
                count: number;
                dimensions: { clientCountryName: string; coloCode: string };
                sum: { edgeResponseBytes?: number; visits?: number };
              }>;
            }>;
          };
        };
        errors?: Array<{ message: string }>;
      }

      const body = (await response.json()) as GraphQLResponse;
      const zonesData = body.data?.viewer?.zones || [];

      let totalRequests7d = 0;
      let totalThreats7d = 0;
      const mitigationsByAction: Record<string, number> = {};
      const threatCountryCounts: Record<string, number> = {};
      const coloAggregates: Record<
        string,
        { count: number; bytes: number; country: string }
      > = {};
      const dailyMap: Record<string, { requests: number; threats: number; bytes: number }> = {};
      const allFirewallEvents: CloudflareFirewallEventDto[] = [];

      for (const zone of zonesData) {
        // Daily HTTP metrics
        for (const day of zone.httpRequests1dGroups || []) {
          const reqs = day.sum?.requests || 0;
          const threats = day.sum?.threats || 0;
          const bytes = day.sum?.bytes || 0;
          totalRequests7d += reqs;
          totalThreats7d += threats;

          const dKey = day.dimensions?.date;
          if (dKey) {
            if (!dailyMap[dKey]) {
              dailyMap[dKey] = { requests: 0, threats: 0, bytes: 0 };
            }
            dailyMap[dKey].requests += reqs;
            dailyMap[dKey].threats += threats;
            dailyMap[dKey].bytes += bytes;
          }
        }

        // Firewall adaptive events
        for (const evt of zone.firewallEventsAdaptive || []) {
          const act = evt.action || 'block';
          mitigationsByAction[act] = (mitigationsByAction[act] || 0) + 1;

          const cCountry = (evt.clientCountryName || 'XX').toUpperCase();
          threatCountryCounts[cCountry] = (threatCountryCounts[cCountry] || 0) + 1;

          allFirewallEvents.push({
            id: `cf-fw-${allFirewallEvents.length + 1}-${evt.datetime}`,
            action: act,
            clientCountryName: cCountry,
            clientIP: evt.clientIP,
            clientAsn: evt.clientAsn,
            datetime: evt.datetime,
            ruleId: evt.ruleId,
            source: evt.source,
            host: evt.clientRequestHTTPHost,
          });
        }

        // Colo edge routing groups
        for (const group of zone.httpRequestsAdaptiveGroups || []) {
          const colo = (group.dimensions?.coloCode || '').toUpperCase();
          if (colo) {
            if (!coloAggregates[colo]) {
              coloAggregates[colo] = {
                count: 0,
                bytes: 0,
                country: group.dimensions?.clientCountryName || 'US',
              };
            }
            coloAggregates[colo].count += group.count || 0;
            coloAggregates[colo].bytes += group.sum?.edgeResponseBytes || 0;
          }
        }
      }

      // Format top colos with resolved coordinates (never falling back to dummy [20, 0])
      const topColos: CloudflareColoTrafficDto[] = Object.entries(coloAggregates)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 16)
        .map(([coloCode, data]) => {
          const resolved = resolveColoAndCountryGeo({
            coloCode,
            country: data.country,
          });
          return {
            coloCode: resolved.coloCode,
            city: resolved.city,
            country: resolved.countryCode,
            lat: resolved.lat,
            lng: resolved.lng,
            requests: data.count,
            bytes: data.bytes,
          };
        });

      // Format top threat countries
      const topThreatCountries = Object.entries(threatCountryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([cCode, count]) => {
          const info = resolveCountryGeo(cCode);
          return {
            countryCode: info.code,
            countryName: info.name,
            threats: count,
            lat: info.lat,
            lng: info.lng,
          };
        });

      // Format daily metrics
      const dailyMetrics: CloudflareDailyMetricDto[] = Object.entries(dailyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, d]) => ({
          date,
          requests: d.requests,
          threats: d.threats,
          bytes: d.bytes,
        }));

      // Sort recent firewall events descending by datetime
      allFirewallEvents.sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
      );

      // A LIVE attack must be actively detected in the recent live window (last 15 minutes)
      const LIVE_ATTACK_WINDOW_MS = 15 * 60 * 1000;
      const liveEvents = allFirewallEvents.filter((evt) => {
        const t = new Date(evt.datetime).getTime();
        return !isNaN(t) && now - t <= LIVE_ATTACK_WINDOW_MS;
      });

      const liveAttackCount = liveEvents.length;
      const liveThreatCountryMap = new Map<
        string,
        {
          countryCode: string;
          countryName: string;
          action: string;
          datetime: string;
          lat: number;
          lng: number;
        }
      >();

      for (const evt of liveEvents) {
        const info = resolveCountryGeo(evt.clientCountryName || 'US');
        if (!liveThreatCountryMap.has(info.code)) {
          liveThreatCountryMap.set(info.code, {
            countryCode: info.code,
            countryName: info.name,
            action: evt.action,
            datetime: evt.datetime,
            lat: info.lat,
            lng: info.lng,
          });
        }
      }

      const liveThreatCountries = Array.from(liveThreatCountryMap.values());

      const result: CloudflareSecurityTelemetryDto = {
        totalThreats7d,
        totalRequests7d,
        totalFirewallEvents: allFirewallEvents.length,
        mitigationsByAction,
        topThreatCountries,
        recentFirewallEvents: allFirewallEvents.slice(0, 50),
        topColos,
        dailyMetrics,
        hasLiveCloudflareData: true,
        liveAttackCount,
        liveThreatCountries,
      };

      cachedTelemetry = result;
      lastTelemetryFetchMs = now;
      return result;
    } catch {
      // Fallback gracefully on any API error without breaking dashboard
      return (
        cachedTelemetry ?? {
          totalThreats7d: 0,
          totalRequests7d: 0,
          totalFirewallEvents: 0,
          mitigationsByAction: {},
          topThreatCountries: [],
          recentFirewallEvents: [],
          topColos: [],
          dailyMetrics: [],
          hasLiveCloudflareData: false,
          liveAttackCount: 0,
          liveThreatCountries: [],
        }
      );
    }
  },
};

import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import worldAtlasCountries from 'world-atlas/countries-110m.json';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Cube,
  FileText,
  Funnel,
  Globe,
  GlobeHemisphereWest,
  IdentificationBadge,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  Sparkle,
  X,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../shared/components/modals';
import type {
  DashboardGlobalEdgeStats,
  DashboardStats,
  GlobalCountryNode,
} from '../types/dashboard.types';
import {
  computeDynamicCountryMapLabels,
  resolveColoAndCountryGeo,
  resolveCountryGeo,
  type ObstacleBoxPct,
} from '../utils/flat-map-geo.utils';

interface GlobalFlatMapViewProps {
  stats: DashboardStats;
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 470;

// Precompute authentic Natural Earth country SVG paths once at module load
const projection = geoNaturalEarth1()
  .scale(178)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2 + 18]);

const pathGenerator = geoPath(projection);

interface CountryPathItem {
  id: string;
  d: string;
}

const REAL_WORLD_COUNTRY_PATHS: CountryPathItem[] = (() => {
  const topology = worldAtlasCountries as unknown as Topology<{
    countries: GeometryCollection;
  }>;
  const geo = feature(topology, topology.objects.countries);
  const paths: CountryPathItem[] = [];
  if (geo.type === 'FeatureCollection') {
    geo.features.forEach((f, idx) => {
      // Skip Antarctica (ISO 010) for a cleaner command-center flat map framing
      if (String(f.id) === '010') return;
      const d = pathGenerator(f);
      if (d) {
        paths.push({ id: String(f.id ?? idx), d });
      }
    });
  }
  return paths;
})();

function projectCoords(lat: number, lng: number): [number, number] {
  const pt = projection([lng, lat]);
  return pt ? [pt[0], pt[1]] : [MAP_WIDTH / 2, MAP_HEIGHT / 2];
}

// Primary Continental Hubs (matching the 6 glowing hubs + callout boxes in the reference mockup)
interface ContinentalHubSpec {
  id: string;
  title: string;
  codes: string[];
  lat: number;
  lng: number;
  cardX: number; // %
  cardY: number; // %
  countryCode: string;
  colo: string;
}

const CONTINENT_HUBS: ContinentalHubSpec[] = [
  {
    id: 'NA',
    title: 'NORTH AMERICA',
    codes: ['US', 'CA', 'MX'],
    lat: 37.5,
    lng: -98.0,
    cardX: 11.5,
    cardY: 28.0,
    countryCode: 'US',
    colo: 'SJC',
  },
  {
    id: 'SA',
    title: 'SOUTH AMERICA',
    codes: ['BR', 'CO', 'CL'],
    lat: -15.5,
    lng: -56.0,
    cardX: 20.5,
    cardY: 79.0,
    countryCode: 'BR',
    colo: 'GRU',
  },
  {
    id: 'EU',
    title: 'EUROPE',
    codes: ['UK', 'DE', 'FR'],
    lat: 49.5,
    lng: 10.5,
    cardX: 54.0,
    cardY: 16.5,
    countryCode: 'DE',
    colo: 'FRA',
  },
  {
    id: 'AF',
    title: 'AFRICA',
    codes: ['ZA', 'EG', 'NG'],
    lat: -26.0,
    lng: 28.0,
    cardX: 51.0,
    cardY: 77.5,
    countryCode: 'ZA',
    colo: 'JNB',
  },
  {
    id: 'AS',
    title: 'ASIA PACIFIC',
    codes: ['CN', 'SG', 'JP'],
    lat: 31.2,
    lng: 114.0,
    cardX: 83.5,
    cardY: 27.5,
    countryCode: 'SG',
    colo: 'SIN',
  },
  {
    id: 'OC',
    title: 'OCEANIA',
    codes: ['AU', 'NZ', 'FJ'],
    lat: -27.0,
    lng: 144.0,
    cardX: 91.5,
    cardY: 78.0,
    countryCode: 'AU',
    colo: 'SYD',
  },
];

// Secondary relay cities for rich multi-node routing network (matching reference mockup)
const RELAY_NODES: Array<{ id: string; lat: number; lng: number }> = [
  { id: 'NYC', lat: 40.7, lng: -74.0 },
  { id: 'MIA', lat: 25.7, lng: -80.2 },
  { id: 'BOG', lat: 4.7, lng: -74.1 },
  { id: 'LIM', lat: -12.0, lng: -77.0 },
  { id: 'EZE', lat: -34.6, lng: -58.4 },
  { id: 'LHR', lat: 51.5, lng: -0.1 },
  { id: 'CAI', lat: 30.0, lng: 31.2 },
  { id: 'SIN', lat: 1.35, lng: 103.8 },
  { id: 'NRT', lat: 35.7, lng: 139.7 },
  { id: 'MNL', lat: 14.6, lng: 121.0 },
];

// Live animated flight routes connecting hubs & relays across the globe
interface AnimatedRouteSpec {
  id: string;
  from: [number, number]; // [lat, lng]
  to: [number, number];   // [lat, lng]
  curveLift: number;
  durationSec: number;
  delaySec: number;
  primary?: boolean;
}

const ANIMATED_ROUTES: AnimatedRouteSpec[] = [
  // Primary trans-continental trunk routes
  { id: 'na-eu-1', from: [37.5, -98.0], to: [49.5, 10.5], curveLift: -75, durationSec: 3.4, delaySec: 0, primary: true },
  { id: 'na-eu-2', from: [40.7, -74.0], to: [51.5, -0.1], curveLift: -50, durationSec: 2.8, delaySec: 0.9, primary: true },
  { id: 'eu-as-1', from: [49.5, 10.5], to: [31.2, 114.0], curveLift: -70, durationSec: 3.6, delaySec: 0.3, primary: true },
  { id: 'eu-as-2', from: [49.5, 10.5], to: [35.7, 139.7], curveLift: -95, durationSec: 4.1, delaySec: 1.2, primary: true },
  { id: 'na-sa-1', from: [37.5, -98.0], to: [-15.5, -56.0], curveLift: -35, durationSec: 3.1, delaySec: 0.5, primary: true },
  { id: 'sa-eu-1', from: [-15.5, -56.0], to: [49.5, 10.5], curveLift: -45, durationSec: 3.8, delaySec: 1.5, primary: true },
  { id: 'eu-af-1', from: [49.5, 10.5], to: [-26.0, 28.0], curveLift: 30, durationSec: 3.2, delaySec: 0.7, primary: true },
  { id: 'af-as-1', from: [-26.0, 28.0], to: [31.2, 114.0], curveLift: 40, durationSec: 3.7, delaySec: 0.2, primary: true },
  { id: 'as-oc-1', from: [31.2, 114.0], to: [-27.0, 144.0], curveLift: 35, durationSec: 2.9, delaySec: 0.4, primary: true },
  // Regional mesh spokes
  { id: 'na-mia', from: [37.5, -98.0], to: [25.7, -80.2], curveLift: -15, durationSec: 2.2, delaySec: 0.1 },
  { id: 'sa-lim', from: [-15.5, -56.0], to: [-12.0, -77.0], curveLift: -15, durationSec: 2.1, delaySec: 0.6 },
  { id: 'sa-eze', from: [-15.5, -56.0], to: [-34.6, -58.4], curveLift: 15, durationSec: 2.3, delaySec: 1.1 },
  { id: 'as-nrt', from: [31.2, 114.0], to: [35.7, 139.7], curveLift: -20, durationSec: 2.0, delaySec: 0.3 },
  { id: 'as-sin', from: [31.2, 114.0], to: [1.35, 103.8], curveLift: -20, durationSec: 2.4, delaySec: 0.8 },
  { id: 'sin-oc', from: [1.35, 103.8], to: [-27.0, 144.0], curveLift: -25, durationSec: 2.7, delaySec: 1.4 },
];

function buildFallbackGlobalEdge(stats: DashboardStats): DashboardGlobalEdgeStats {
  const totalMail = Math.max(1, stats.mail.totalAccounts);
  const totalItems = Math.max(10, stats.vault.totalVaultItems);
  const baseSignals = totalItems * 1420 + stats.mail.totalReceivedMessages * 380;

  return {
    viewerCountry: 'US',
    viewerCity: 'San Jose',
    viewerColo: 'SJC',
    viewerLat: 37.3382,
    viewerLng: -121.8863,
    tlsVersion: 'TLSv1.3',
    httpProtocol: 'HTTP/3',
    totalGlobalSignals: baseSignals,
    globalAvgLatencyMs: 18,
    cacheHitRatio: 99.4,
    countries: [
      {
        code: 'DE',
        country: 'Germany',
        city: 'Frankfurt',
        continent: 'EU',
        colo: 'FRA',
        lat: 50.11,
        lng: 8.68,
        requests: Math.round(baseSignals * 0.24),
        growthPct: 24,
        latencyMs: 14,
        status: 'normal',
      },
      {
        code: 'US',
        country: 'United States',
        city: 'San Jose',
        continent: 'NA',
        colo: 'SJC',
        lat: 37.77,
        lng: -122.41,
        requests: Math.round(baseSignals * 0.22),
        growthPct: 21,
        latencyMs: 12,
        status: 'normal',
      },
      {
        code: 'GB',
        country: 'United Kingdom',
        city: 'London',
        continent: 'EU',
        colo: 'LHR',
        lat: 51.5,
        lng: -0.12,
        requests: Math.round(baseSignals * 0.18),
        growthPct: 16,
        latencyMs: 16,
        status: 'normal',
      },
      {
        code: 'AU',
        country: 'Australia',
        city: 'Sydney',
        continent: 'OC',
        colo: 'SYD',
        lat: -33.86,
        lng: 151.2,
        requests: Math.round(baseSignals * 0.14),
        growthPct: 22,
        latencyMs: 28,
        status: 'normal',
      },
      {
        code: 'SG',
        country: 'Singapore',
        city: 'Singapore',
        continent: 'AS',
        colo: 'SIN',
        lat: 1.35,
        lng: 103.82,
        requests: Math.round(baseSignals * 0.12),
        growthPct: 29,
        latencyMs: 15,
        status: 'normal',
      },
      {
        code: 'BR',
        country: 'Brazil',
        city: 'Sao Paulo',
        continent: 'SA',
        colo: 'GRU',
        lat: -23.55,
        lng: -46.63,
        requests: Math.round(baseSignals * 0.1),
        growthPct: 19,
        latencyMs: 24,
        status: 'normal',
      },
    ],
    domains: [
      {
        domain: 'onevault.edge',
        mailboxes: totalMail,
        signals: Math.round(baseSignals * 0.62),
        primaryColo: 'SJC',
        uptimePct: 99.8,
        sparkline: [38, 52, 44, 68, 74, 61, 85, 92, 78, 96],
      },
    ],
    continentShares: [
      { name: 'North America', code: 'NA', signals: Math.round(baseSignals * 0.44), percentage: 44, growth: '+18%', color: '#f97316' },
      { name: 'Europe', code: 'EU', signals: Math.round(baseSignals * 0.26), percentage: 26, growth: '+12%', color: '#fb923c' },
      { name: 'Asia Pacific', code: 'APAC', signals: Math.round(baseSignals * 0.22), percentage: 22, growth: '+29%', color: '#f59e0b' },
      { name: 'South America', code: 'SA', signals: Math.round(baseSignals * 0.08), percentage: 8, growth: '+14%', color: '#ea580c' },
    ],
  };
}

export const GlobalFlatMapView: React.FC<GlobalFlatMapViewProps> = ({
  stats,
}) => {
  const globalEdge = useMemo(
    () => stats.globalEdge ?? buildFallbackGlobalEdge(stats),
    [stats]
  );

  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedHubId, setSelectedHubId] = useState<string>('EU');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState<boolean>(false);
  const [domainSearchQuery, setDomainSearchQuery] = useState<string>('');
  const [isThreatModalOpen, setIsThreatModalOpen] = useState<boolean>(false);
  const [threatCategoryFilter, setThreatCategoryFilter] = useState<string>('ALL');
  const [threatSearchQuery, setThreatSearchQuery] = useState<string>('');

  const activeDomainObj = useMemo(() => {
    if (selectedDomain === 'ALL') return null;
    return globalEdge.domains.find((d) => d.domain === selectedDomain) ?? null;
  }, [globalEdge.domains, selectedDomain]);

  const domainScale = useMemo(() => {
    if (!activeDomainObj) return 1;
    const totalDomainSignals = globalEdge.domains.reduce(
      (acc, d) => acc + d.signals,
      0
    );
    return totalDomainSignals > 0
      ? Math.max(0.15, activeDomainObj.signals / totalDomainSignals)
      : 1;
  }, [activeDomainObj, globalEdge.domains]);

  const displayedTotalSignals = Math.round(
    globalEdge.totalGlobalSignals * domainScale
  );

  // Algorithmic Live Country Node & Non-Overlapping Label Generator
  const dynamicCountryLabels = useMemo(() => {
    const continentCardObstacles: ObstacleBoxPct[] = CONTINENT_HUBS.map((h) => ({
      x: h.cardX,
      y: h.cardY,
      w: 15.5,
      h: 12.5,
    }));

    return computeDynamicCountryMapLabels({
      globalEdge,
      projectCoords,
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      continentCardObstacles,
      domainScale,
    });
  }, [domainScale, globalEdge]);

  // Dynamically enrich the 6 Continental Hub specs with live requesting countries & coordinates
  const enrichedContinentHubs = useMemo(() => {
    return CONTINENT_HUBS.map((hub) => {
      const liveInContinent = dynamicCountryLabels.filter(
        (lbl) => lbl.continent === hub.id
      );
      const liveCodeSet = new Set(liveInContinent.map((l) => l.countryCode));
      const mergedCodes = Array.from(
        new Set([...liveInContinent.map((l) => l.countryCode), ...hub.codes])
      ).slice(0, 4);

      const primaryLive = liveInContinent[0];
      return {
        ...hub,
        codes: mergedCodes,
        liveCodeSet,
        hasLiveTraffic: liveInContinent.length > 0,
        lat: primaryLive ? primaryLive.lat : hub.lat,
        lng: primaryLive ? primaryLive.lng : hub.lng,
        countryCode: primaryLive ? primaryLive.countryCode : hub.countryCode,
        colo: primaryLive ? primaryLive.colo : hub.colo,
      };
    });
  }, [dynamicCountryLabels]);

  // Precompute curved SVG Bezier path strings for all animated routes (resolving real coordinates when live)
  const computedRoutes = useMemo(() => {
    const sec = globalEdge.securityTelemetry;
    let routes = ANIMATED_ROUTES;
    if (sec?.hasLiveCloudflareData && sec.topColos.length > 0) {
      const viewerResolved = resolveColoAndCountryGeo({
        coloCode: globalEdge.viewerColo,
        country: globalEdge.viewerCountry,
        city: globalEdge.viewerCity,
        lat: globalEdge.viewerLat,
        lng: globalEdge.viewerLng,
      });
      const vLat = viewerResolved.lat;
      const vLng = viewerResolved.lng;

      routes = sec.topColos.slice(0, 10).map((colo, idx) => {
        const targetGeo = resolveColoAndCountryGeo({
          coloCode: colo.coloCode,
          country: colo.country,
          city: colo.city,
          lat: colo.lat,
          lng: colo.lng,
        });
        return {
          id: `cf-route-${colo.coloCode}-${idx}`,
          from: [vLat, vLng] as [number, number],
          to: [targetGeo.lat, targetGeo.lng] as [number, number],
          curveLift: (idx % 2 === 0 ? -1 : 1) * (20 + idx * 6),
          durationSec: 2.6 + (idx % 3) * 0.4,
          delaySec: idx * 0.2,
          primary: idx < 4,
        };
      });
    }

    return routes.map((route) => {
      const [x1, y1] = projectCoords(route.from[0], route.from[1]);
      const [x2, y2] = projectCoords(route.to[0], route.to[1]);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2 + route.curveLift;
      const d = `M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
      return {
        ...route,
        x1,
        y1,
        x2,
        y2,
        d,
      };
    });
  }, [
    globalEdge.securityTelemetry,
    globalEdge.viewerCity,
    globalEdge.viewerColo,
    globalEdge.viewerCountry,
    globalEdge.viewerLat,
    globalEdge.viewerLng,
  ]);

  const activeHub = useMemo(
    () =>
      enrichedContinentHubs.find((h) => h.id === selectedHubId) ??
      enrichedContinentHubs[2],
    [enrichedContinentHubs, selectedHubId]
  );

  const activeCountryNode = useMemo<GlobalCountryNode>(() => {
    if (selectedCountryCode) {
      const fromDynamic = dynamicCountryLabels.find(
        (l) => l.countryCode === selectedCountryCode
      );
      if (fromDynamic) return fromDynamic.countryNode;
    }

    const fromHubDynamic = dynamicCountryLabels.find(
      (l) => l.countryCode === activeHub.countryCode
    );
    if (fromHubDynamic) return fromHubDynamic.countryNode;

    const found = globalEdge.countries.find(
      (c) => c.code === activeHub.countryCode
    );
    return (
      found ??
      dynamicCountryLabels[0]?.countryNode ??
      globalEdge.countries[0] ?? {
        code: 'DE',
        country: 'Germany',
        city: 'Frankfurt',
        continent: 'EU',
        colo: 'FRA',
        lat: 50.11,
        lng: 8.68,
        requests: 50500,
        growthPct: 18,
        latencyMs: 16,
        status: 'normal',
      }
    );
  }, [activeHub.countryCode, dynamicCountryLabels, globalEdge.countries, selectedCountryCode]);

  // Bottom-left Global Flow Overview chart data
  const flowOverviewData = useMemo(() => {
    const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'NOW'];
    const mults = [0.32, 0.54, 0.46, 0.72, 0.65, 0.88, 1.0];
    const peakBase = Math.max(1200, Math.round((displayedTotalSignals / 42) * 1));
    return labels.map((label, idx) => ({
      label,
      signals: Math.round(peakBase * mults[idx]),
    }));
  }, [displayedTotalSignals]);

  // Top Destinations percentage list (bottom-center-left card)
  const topDestinations = useMemo(() => {
    const sourceNodes =
      dynamicCountryLabels.length > 0
        ? dynamicCountryLabels.map((l) => l.countryNode)
        : globalEdge.countries;
    const totalReqs = Math.max(
      1,
      sourceNodes.reduce((acc, c) => acc + c.requests, 0)
    );
    return sourceNodes.slice(0, 5).map((c) => {
      const sharePct = +((c.requests / totalReqs) * 100).toFixed(1);
      return {
        ...c,
        sharePct,
      };
    });
  }, [dynamicCountryLabels, globalEdge.countries]);

  const filteredDomains = useMemo(() => {
    const q = domainSearchQuery.trim().toLowerCase();
    if (!q) return globalEdge.domains;
    return globalEdge.domains.filter(
      (d) =>
        d.domain.toLowerCase().includes(q) ||
        d.primaryColo.toLowerCase().includes(q)
    );
  }, [domainSearchQuery, globalEdge.domains]);

  const isContinentUnderLiveAttack = (hub: ContinentalHubSpec) => {
    const liveAttacks = globalEdge.securityTelemetry?.liveThreatCountries;
    if (!liveAttacks || liveAttacks.length === 0) return false;
    return liveAttacks.some((t) => {
      const resolvedCode = resolveCountryGeo(t.countryCode).code;
      return (
        hub.codes.includes(resolvedCode) ||
        hub.countryCode === resolvedCode
      );
    });
  };

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#08080a] text-zinc-100 p-4 sm:p-6 shadow-card overflow-hidden space-y-6">
      {/* Ambient Warm Radial Glows */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[680px] rounded-full opacity-15 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #f97316 0%, transparent 70%)',
        }}
      />

      {/* 1. TOP HERO & 4-COLUMN KPI STRIP (Matches Top of Reference Image 1) */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
        {/* Left Hero Typography + Domain Filter Trigger */}
        <div className="xl:col-span-5 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-orange-400">
              GLOBAL ANYCAST INFRASTRUCTURE
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-mono text-orange-300">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
              Live Edge: {globalEdge.viewerColo} ({globalEdge.viewerCity}, {globalEdge.viewerCountry}) · {globalEdge.httpProtocol}
            </span>
            {globalEdge.securityTelemetry?.hasLiveCloudflareData ? (
              (globalEdge.securityTelemetry.liveAttackCount || 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsThreatModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/40 px-2 py-0.5 text-[10px] font-mono text-red-400 font-bold cursor-pointer"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                  LIVE ATTACK: {globalEdge.securityTelemetry.liveAttackCount} Active
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsThreatModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-semibold cursor-pointer"
                >
                  <ShieldCheck size={11} weight="bold" />
                  Cloudflare Live: Clean (0 Live Attacks · 7D: {globalEdge.securityTelemetry.totalThreats7d} Mitigated)
                </button>
              )
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                <ShieldCheck size={11} weight="bold" />
                Free Tier Safe (0 Extra Worker Calls)
              </span>
            )}
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.12]">
            <span className="text-white block">Scale Globally.</span>
            <span className="bg-gradient-to-r from-orange-200 via-amber-300 to-orange-500 bg-clip-text text-transparent block">
              Route Predictably.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
            Real-time Cloudflare edge intelligence for cross-border domain routing,
            D1 zero-latency capture, and cryptographic vault sync.
          </p>

          {/* Compact Domain Filter Modal Trigger */}
          <div className="pt-1 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsDomainModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#131316] hover:bg-[#1a1a1f] border border-orange-500/35 hover:border-orange-400/60 px-3 py-1.5 text-xs font-mono text-orange-200 shadow-xs transition-all cursor-pointer"
            >
              <Funnel size={13} weight="duotone" className="text-orange-400" />
              <span>
                {selectedDomain === 'ALL'
                  ? `Domain Scope: All (${globalEdge.domains.length})`
                  : `Domain: @${selectedDomain}`}
              </span>
            </button>

            {selectedDomain !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedDomain('ALL')}
                className="inline-flex items-center gap-1 rounded-lg bg-orange-500/15 border border-orange-500/30 px-2 py-1 text-[11px] font-mono text-orange-300 hover:bg-orange-500/25 cursor-pointer"
              >
                <X size={11} weight="bold" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 4-Column KPI Strip Card (COUNTRIES · ROUTES · SUCCESS RATE · GUARANTEED) */}
        <div className="xl:col-span-7 rounded-2xl border border-white/10 bg-[#111114]/95 p-4 sm:p-5 shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 gap-4 sm:gap-0">
            {/* KPI 1: COUNTRIES */}
            <div className="sm:px-4 first:pl-0 space-y-1.5">
              <div className="h-7 w-7 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
                <Globe size={15} weight="duotone" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pt-1">
                COUNTRIES
              </div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                195
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                <span className="text-orange-400">+</span> Anycast Coverage
              </div>
            </div>

            {/* KPI 2: ROUTES / SIGNALS */}
            <div className="sm:px-4 space-y-1.5 pt-3 sm:pt-0">
              <div className="h-7 w-7 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
                <Cube size={15} weight="duotone" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pt-1">
                EDGE SIGNALS
              </div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {displayedTotalSignals >= 1000
                  ? `${(displayedTotalSignals / 1000).toFixed(1)}K`
                  : displayedTotalSignals}
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                <span className="text-orange-400">+</span> Active Streams
              </div>
            </div>

            {/* KPI 3: SUCCESS RATE */}
            <div className="sm:px-4 space-y-1.5 pt-3 sm:pt-0">
              <div className="h-7 w-7 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
                <Clock size={15} weight="duotone" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pt-1">
                SUCCESS RATE
              </div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {globalEdge.cacheHitRatio}%
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                <span className="text-orange-400">+</span> Delivered Edge
              </div>
            </div>

            {/* KPI 4: THREAT MITIGATION / ATTACK STATUS */}
            <div className="sm:pl-4 space-y-1.5 pt-3 sm:pt-0">
              <button
                type="button"
                onClick={() => setIsThreatModalOpen(true)}
                title="View Live Stream Telemetry"
                aria-label="View Live Stream Telemetry"
                className={`relative h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 ${
                  (globalEdge.securityTelemetry?.liveAttackCount || 0) > 0
                    ? 'bg-red-500/15 border border-red-500/35 text-red-400 hover:bg-red-500/25'
                    : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                <ShieldCheck size={15} weight="duotone" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-[#0e0e12]" />
              </button>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pt-1">
                {globalEdge.securityTelemetry?.hasLiveCloudflareData
                  ? (globalEdge.securityTelemetry.liveAttackCount || 0) > 0
                    ? 'LIVE ATTACK STATUS'
                    : 'ATTACK STATUS'
                  : 'GUARANTEED'}
              </div>
              <div
                className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  (globalEdge.securityTelemetry?.liveAttackCount || 0) > 0
                    ? 'text-red-400'
                    : 'text-white'
                }`}
              >
                {globalEdge.securityTelemetry?.hasLiveCloudflareData
                  ? (globalEdge.securityTelemetry.liveAttackCount || 0) > 0
                    ? `${globalEdge.securityTelemetry.liveAttackCount} ATTACK${(globalEdge.securityTelemetry.liveAttackCount || 0) > 1 ? 'S' : ''}`
                    : '0 (CLEAN)'
                  : '100%'}
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                <span className="text-emerald-400">+</span> Zero-Knowledge
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REAL NATURAL EARTH WORLD MAP + LIVE ANIMATED FLOWING ARCS & GLOWING HUB BEACONS */}
      <div className="relative z-10 w-full rounded-2xl bg-[#070709] border border-white/5 py-2 px-1 sm:px-3 overflow-hidden">
        <div className="relative w-full aspect-[1000/470] min-h-[280px]">
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Intense Radial Orange Hub Flare */}
              <radialGradient id="intenseHubFlare" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff7ed" stopOpacity="1" />
                <stop offset="18%" stopColor="#fb923c" stopOpacity="0.88" />
                <stop offset="45%" stopColor="#f97316" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </radialGradient>

              {/* Soft Ambient Hub Aura */}
              <radialGradient id="ambientHubAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#ea580c" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </radialGradient>

              {/* Intense Radial Red Threat Flare (Only triggers if continent has active live attacks) */}
              <radialGradient id="threatHubFlare" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef2f2" stopOpacity="1" />
                <stop offset="20%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#dc2626" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
              </radialGradient>

              {/* Soft Ambient Red Threat Aura */}
              <radialGradient id="threatHubAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#dc2626" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
              </radialGradient>

              {/* Arc Glow Filter */}
              <filter id="arcGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 2A. Real Natural Earth Country Polygons (from world-atlas/countries-110m.json) */}
            <g>
              {REAL_WORLD_COUNTRY_PATHS.map((country) => (
                <path
                  key={country.id}
                  d={country.d}
                  fill="#18191e"
                  stroke="#262830"
                  strokeWidth="0.65"
                  strokeLinejoin="round"
                />
              ))}
            </g>

            {/* 2B. Ambient Radial Glow Under Each Major Continent Hub */}
            {enrichedContinentHubs.map((hub) => {
              const [hx, hy] = projectCoords(hub.lat, hub.lng);
              const isSelected = selectedHubId === hub.id;
              const isUnderAttack = isContinentUnderLiveAttack(hub);
              return (
                <circle
                  key={`aura-${hub.id}`}
                  cx={hx}
                  cy={hy}
                  r={isSelected ? 78 : 56}
                  fill={isUnderAttack ? 'url(#threatHubAura)' : 'url(#ambientHubAura)'}
                />
              );
            })}

            {/* 2C. Curved Orange Flight Arcs + Animated Comet Streams + Live Flowing Data Packets */}
            <g filter="url(#arcGlowFilter)">
              {computedRoutes.map((route) => (
                <g key={route.id}>
                  {/* Base static arc track */}
                  <path
                    id={`route-path-${route.id}`}
                    d={route.d}
                    fill="none"
                    stroke={
                      route.primary
                        ? 'rgba(249, 115, 22, 0.38)'
                        : 'rgba(251, 146, 60, 0.24)'
                    }
                    strokeWidth={route.primary ? '1.35' : '0.95'}
                    strokeDasharray={route.primary ? undefined : '3 3'}
                  />

                  {/* Animated flowing comet pulse along the arc */}
                  <path
                    d={route.d}
                    fill="none"
                    stroke="#fb923c"
                    strokeWidth={route.primary ? '2.1' : '1.4'}
                    strokeLinecap="round"
                    strokeDasharray="28 260"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="288"
                      to="0"
                      dur={`${route.durationSec}s`}
                      begin={`${route.delaySec}s`}
                      repeatCount="indefinite"
                    />
                  </path>

                  {/* Glowing orange-white data packet orb traveling along the Bezier curve */}
                  <circle
                    r={route.primary ? '2.8' : '2.0'}
                    fill="#fff7ed"
                    stroke="#f97316"
                    strokeWidth="1.2"
                  >
                    <animateMotion
                      dur={`${route.durationSec}s`}
                      begin={`${route.delaySec}s`}
                      repeatCount="indefinite"
                      path={route.d}
                    />
                  </circle>
                </g>
              ))}
            </g>

            {/* 2D. Secondary City Relay Nodes */}
            {RELAY_NODES.map((relay) => {
              const [rx, ry] = projectCoords(relay.lat, relay.lng);
              return (
                <g key={relay.id}>
                  <circle cx={rx} cy={ry} r="6" fill="rgba(249, 115, 22, 0.25)" />
                  <circle cx={rx} cy={ry} r="2.3" fill="#fdba74" />
                </g>
              );
            })}

            {/* 2D-Live. Auto-Generated Live Country Endpoint Beacons + Leader Lines */}
            {dynamicCountryLabels.map((lbl) => {
              const isSelectedCountry =
                activeCountryNode.code === lbl.countryCode;
              const strokeColor = lbl.isThreat
                ? 'rgba(239, 68, 68, 0.78)'
                : lbl.isViewerOrigin
                ? 'rgba(16, 185, 129, 0.78)'
                : isSelectedCountry
                ? 'rgba(251, 146, 60, 0.82)'
                : 'rgba(249, 115, 22, 0.45)';

              return (
                <g
                  key={`dyn-beacon-${lbl.id}`}
                  onClick={() => {
                    setSelectedHubId(lbl.continent);
                    setSelectedCountryCode(lbl.countryCode);
                  }}
                  className="cursor-pointer"
                >
                  {/* Leader line from live country coordinate to generated country label pill */}
                  <line
                    x1={lbl.nodeSvgX}
                    y1={lbl.nodeSvgY}
                    x2={lbl.labelSvgX}
                    y2={lbl.labelSvgY}
                    stroke={strokeColor}
                    strokeWidth={isSelectedCountry ? '1.2' : '0.85'}
                    strokeDasharray="2.5 2.5"
                  />

                  {/* Expanding pulse ring on active live country endpoint */}
                  <circle
                    cx={lbl.nodeSvgX}
                    cy={lbl.nodeSvgY}
                    r="5"
                    fill="none"
                    stroke={
                      lbl.isThreat
                        ? '#ef4444'
                        : lbl.isViewerOrigin
                        ? '#10b981'
                        : '#fb923c'
                    }
                    strokeWidth="1.2"
                  >
                    <animate
                      attributeName="r"
                      from="4"
                      to="16"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.85"
                      to="0"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Glowing endpoint core */}
                  <circle
                    cx={lbl.nodeSvgX}
                    cy={lbl.nodeSvgY}
                    r={isSelectedCountry ? 8.5 : 6.5}
                    fill={
                      lbl.isThreat
                        ? 'rgba(239, 68, 68, 0.35)'
                        : lbl.isViewerOrigin
                        ? 'rgba(16, 185, 129, 0.35)'
                        : 'rgba(249, 115, 22, 0.32)'
                    }
                  />
                  <circle
                    cx={lbl.nodeSvgX}
                    cy={lbl.nodeSvgY}
                    r={isSelectedCountry ? 3.5 : 2.8}
                    fill={
                      lbl.isThreat
                        ? '#fecaca'
                        : lbl.isViewerOrigin
                        ? '#a7f3d0'
                        : '#fff7ed'
                    }
                  />
                </g>
              );
            })}

            {/* 2E. Primary Continental Hub Beacons + Pulsing Rings + Leader Lines to Cards */}
            {enrichedContinentHubs.map((hub) => {
              const [hx, hy] = projectCoords(hub.lat, hub.lng);
              const cardSvgX = (hub.cardX / 100) * MAP_WIDTH;
              const cardSvgY = (hub.cardY / 100) * MAP_HEIGHT;
              const isSelected = selectedHubId === hub.id;
              const isUnderAttack = isContinentUnderLiveAttack(hub);

              return (
                <g
                  key={`beacon-${hub.id}`}
                  onClick={() => {
                    setSelectedHubId(hub.id);
                    setSelectedCountryCode(hub.countryCode);
                  }}
                  className="cursor-pointer"
                >
                  {/* Subtle Leader Line from Hub Flare to Floating Continent Card */}
                  <line
                    x1={hx}
                    y1={hy}
                    x2={cardSvgX}
                    y2={cardSvgY}
                    stroke={
                      isUnderAttack
                        ? 'rgba(239, 68, 68, 0.85)'
                        : isSelected
                        ? 'rgba(251, 146, 60, 0.75)'
                        : 'rgba(249, 115, 22, 0.35)'
                    }
                    strokeWidth={isSelected || isUnderAttack ? '1.3' : '0.9'}
                  />

                  {/* Concentric Ring Outlines */}
                  <circle
                    cx={hx}
                    cy={hy}
                    r={isSelected ? 22 : 17}
                    fill="none"
                    stroke={isUnderAttack ? 'rgba(239, 68, 68, 0.75)' : 'rgba(251, 146, 60, 0.45)'}
                    strokeWidth="1"
                  />

                  {/* Animated Expanding Pulse Ring */}
                  <circle
                    cx={hx}
                    cy={hy}
                    r="8"
                    fill="none"
                    stroke={isUnderAttack ? '#ef4444' : '#fb923c'}
                    strokeWidth="1.5"
                  >
                    <animate
                      attributeName="r"
                      from="6"
                      to="26"
                      dur="2.6s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.85"
                      to="0"
                      dur="2.6s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Intense Glowing Sunburst Core */}
                  <circle
                    cx={hx}
                    cy={hy}
                    r={isSelected ? 18 : 14}
                    fill={isUnderAttack ? 'url(#threatHubFlare)' : 'url(#intenseHubFlare)'}
                  />
                  <circle cx={hx} cy={hy} r="3.5" fill="#ffffff" />
                </g>
              );
            })}
          </svg>

          {/* 2F. Floating Glassmorphic Continent Callout Cards (Enriched with Live Requesting Country Codes) */}
          {enrichedContinentHubs.map((hub) => {
            const isSelected = selectedHubId === hub.id;
            const isUnderAttack = isContinentUnderLiveAttack(hub);
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => {
                  setSelectedHubId(hub.id);
                  setSelectedCountryCode(hub.countryCode);
                }}
                style={{
                  left: `${hub.cardX}%`,
                  top: `${hub.cardY}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-left transition-all cursor-pointer backdrop-blur-md ${
                  isUnderAttack
                    ? 'bg-[#200d0d]/95 border border-red-500/80 shadow-[0_8px_28px_rgba(239,68,68,0.35)] scale-105 z-20'
                    : isSelected
                    ? 'bg-[#181410]/95 border border-orange-400/80 shadow-[0_8px_28px_rgba(249,115,22,0.32)] scale-105 z-20'
                    : 'bg-[#121215]/88 border border-white/10 hover:border-orange-500/45 shadow-[0_6px_20px_rgba(0,0,0,0.7)] z-10'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-zinc-200 uppercase whitespace-nowrap">
                    {hub.title}
                  </span>
                  {isUnderAttack ? (
                    <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  ) : hub.hasLiveTraffic ? (
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                  ) : null}
                </div>
                <div className={`my-1 h-0.5 w-4 rounded-full ${isUnderAttack ? 'bg-red-500' : 'bg-orange-500'}`} />
                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-zinc-400">
                  {hub.codes.map((code) => {
                    const isCodeLive = hub.liveCodeSet.has(code);
                    return (
                      <span
                        key={code}
                        className={
                          isUnderAttack
                            ? 'text-red-300 font-semibold'
                            : isCodeLive
                            ? 'text-orange-300 font-bold underline decoration-orange-500/50 underline-offset-2'
                            : isSelected
                            ? 'text-orange-200 font-semibold'
                            : 'text-zinc-400'
                        }
                      >
                        {code}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}

          {/* 2G. Algorithmic Dynamic Country Labels (Automatically Generated for Every Active Live Country/Endpoint on the Map) */}
          {dynamicCountryLabels.map((lbl) => {
            const isSelectedCountry =
              activeCountryNode.code === lbl.countryCode;
            const formattedReqs =
              lbl.requests >= 1000
                ? `${(lbl.requests / 1000).toFixed(1)}K`
                : `${lbl.requests}`;

            return (
              <button
                key={lbl.id}
                type="button"
                onClick={() => {
                  setSelectedHubId(lbl.continent);
                  setSelectedCountryCode(lbl.countryCode);
                }}
                style={{
                  left: `${lbl.labelX}%`,
                  top: `${lbl.labelY}%`,
                }}
                title={`${lbl.countryName} (${lbl.city} · ${lbl.colo}) — ${lbl.requests.toLocaleString()} live signals`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-left transition-all cursor-pointer backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap ${
                  lbl.isThreat
                    ? 'bg-red-950/90 border border-red-500/75 text-red-200 shadow-[0_4px_16px_rgba(239,68,68,0.35)] z-30'
                    : lbl.isViewerOrigin
                    ? 'bg-emerald-950/90 border border-emerald-500/65 text-emerald-200 shadow-[0_4px_16px_rgba(16,185,129,0.28)] z-25'
                    : isSelectedCountry
                    ? 'bg-[#1f160e]/95 border border-orange-400/80 text-orange-100 shadow-[0_4px_18px_rgba(249,115,22,0.35)] scale-105 z-30'
                    : 'bg-[#101014]/90 border border-orange-500/35 hover:border-orange-400/70 text-zinc-200 shadow-[0_4px_14px_rgba(0,0,0,0.75)] z-20'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    lbl.isThreat
                      ? 'bg-red-400 animate-ping'
                      : lbl.isViewerOrigin
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-orange-400'
                  }`}
                />
                <span className="text-[9px] sm:text-[10px] font-mono font-extrabold tracking-tight text-white">
                  {lbl.countryCode}
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono text-zinc-300 max-w-[68px] sm:max-w-[84px] truncate">
                  {lbl.countryName}
                </span>
                <span
                  className={`rounded px-1 py-0.2 text-[8px] font-mono font-bold ${
                    lbl.isThreat
                      ? 'bg-red-500/25 text-red-300'
                      : lbl.isViewerOrigin
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-orange-500/20 text-orange-300'
                  }`}
                >
                  {lbl.colo !== lbl.countryCode ? lbl.colo : formattedReqs}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MIDDLE 4-STEP PIPELINE CARDS WITH ORANGE CONNECTOR ARROWS (Matches 01 -> 02 -> 03 -> 04 in Reference Image 1) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {/* Step 01: ORIGIN & EDGE DETECTION */}
        <div className="relative rounded-2xl border border-white/10 bg-[#111114] p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono font-bold text-orange-400">01</div>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
              <IdentificationBadge size={17} weight="duotone" />
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-white uppercase tracking-wide leading-snug">
              EDGE ORIGIN
              <br />
              DETECTION
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Identifies incoming request country, Anycast POP, and TLS cipher in
              real-time.
            </p>
          </div>

          <div className="rounded-xl bg-[#0b0b0d] border border-white/5 p-3 space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <MapPin size={14} className="text-orange-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-500">Live Edge Origin</div>
                <div className="font-semibold text-zinc-200">
                  {globalEdge.viewerCity}, {globalEdge.viewerCountry} ({globalEdge.viewerColo})
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Cube size={14} className="text-orange-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-500">Protocol &amp; TLS</div>
                <div className="font-mono font-semibold text-zinc-200">
                  {globalEdge.httpProtocol} · {globalEdge.tlsVersion}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <FileText size={14} className="text-orange-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-500">Domain Scope</div>
                <div className="font-mono font-semibold text-zinc-200 truncate max-w-[150px]">
                  {selectedDomain === 'ALL'
                    ? `All Domains (${globalEdge.domains.length})`
                    : `@${selectedDomain}`}
                </div>
              </div>
            </div>
          </div>

          {/* Floating Orange Connector Arrow to Step 02 (Desktop) */}
          <div className="hidden xl:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-orange-500 text-zinc-950 items-center justify-center shadow-[0_0_14px_rgba(249,115,22,0.6)]">
            <ArrowRight size={13} weight="bold" />
          </div>
        </div>

        {/* Step 02: REAL-TIME ROUTING CALCULATION */}
        <div className="relative rounded-2xl border border-white/10 bg-[#111114] p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono font-bold text-orange-400">02</div>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
              <Sparkle size={17} weight="duotone" />
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-white uppercase tracking-wide leading-snug">
              REAL-TIME RULE
              <br />
              EVALUATION
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Worker engine matches D1 email rules, forward targets, and security
              headers at the edge.
            </p>
          </div>

          <div className="rounded-xl bg-[#0b0b0d] border border-white/5 p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-zinc-400">Forwarded Rules</span>
              <span className="text-zinc-100 font-semibold">
                {stats.mail.forwardedAccounts} active
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-zinc-400">D1 Inbox Captures</span>
              <span className="text-zinc-100 font-semibold">
                {stats.mail.totalReceivedMessages} msgs
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-zinc-400">2FA &amp; Notes Synced</span>
              <span className="text-zinc-100 font-semibold">
                {stats.twoFactor.totalTokens + stats.notes.totalNotes} items
              </span>
            </div>
            <div className="flex justify-between pt-1 text-orange-400 font-bold">
              <span>Total Hub Signals</span>
              <span>
                {Math.round(activeCountryNode.requests * domainScale).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="hidden xl:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-orange-500 text-zinc-950 items-center justify-center shadow-[0_0_14px_rgba(249,115,22,0.6)]">
            <ArrowRight size={13} weight="bold" />
          </div>
        </div>

        {/* Step 03: GUARANTEED ZERO-QUOTA OVERHEAD */}
        <div className="relative rounded-2xl border border-white/10 bg-[#111114] p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono font-bold text-orange-400">03</div>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
              <ShieldCheck size={17} weight="duotone" />
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-white uppercase tracking-wide leading-snug">
              GUARANTEED
              <br />
              FREE-TIER SAFE
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero background polling overhead—telemetry is extracted from native
              Cloudflare cf request properties and cached client-side.
            </p>
          </div>

          <div className="rounded-xl bg-[#0b0b0d] border border-white/5 p-3 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              <ShieldCheck size={13} weight="fill" className="text-emerald-400" />
              <span>Guaranteed Free Tier Safe</span>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500">Extra Worker Polling Calls</div>
              <div className="font-display text-2xl font-extrabold text-emerald-400 tracking-tight">
                0.00 req/s
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <CheckCircle size={13} weight="fill" />
              <span>100% Client-Side Render (0 Worker Costs)</span>
            </div>
          </div>

          <div className="hidden xl:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-orange-500 text-zinc-950 items-center justify-center shadow-[0_0_14px_rgba(249,115,22,0.6)]">
            <ArrowRight size={13} weight="bold" />
          </div>
        </div>

        {/* Step 04: SMART ROUTING & DELIVERY */}
        <div className="rounded-2xl border border-white/10 bg-[#111114] p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono font-bold text-orange-400">04</div>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
              <Cube size={17} weight="duotone" />
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-white uppercase tracking-wide leading-snug">
              SMART ROUTING &amp;
              <br />
              DELIVERY
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Optimized Anycast routing for sub-20ms speed, reliability, and
              cryptographic verification.
            </p>
          </div>

          <div className="rounded-xl bg-[#0b0b0d] border border-white/5 p-3 space-y-2 text-xs">
            <div>
              <div className="text-[10px] text-zinc-500">Active Anycast Route</div>
              <div className="font-semibold text-zinc-200">
                {globalEdge.viewerColo} → {activeCountryNode.country} ({activeCountryNode.colo})
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500">Anycast Transit RTT</div>
              <div className="font-mono font-semibold text-zinc-200">
                {globalEdge.clientTcpRttMs ? `${globalEdge.clientTcpRttMs}ms TCP RTT` : `${activeCountryNode.latencyMs}ms – ${activeCountryNode.latencyMs + 6}ms`}
              </div>
            </div>
            <div className="pt-1 flex items-end justify-between gap-2">
              <div>
                <div className="text-[10px] text-zinc-500">Success Rate</div>
                <div className="font-mono font-bold text-orange-400">
                  {globalEdge.cacheHitRatio}%
                </div>
              </div>
              <svg className="h-6 w-20 overflow-visible" viewBox="0 0 80 24">
                <path
                  d="M 2 20 L 16 15 L 30 17 L 44 10 L 58 12 L 78 3"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM 4-CARD TELEMETRY ROW (GLOBAL FLOW OVERVIEW · TOP DESTINATIONS · CACHE ENGINE · COMPLIANCE) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-stretch">
        {/* Card 1 (Col 1-4): GLOBAL FLOW OVERVIEW */}
        <div className="xl:col-span-4 rounded-2xl border border-white/10 bg-[#111114] p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
              GLOBAL FLOW OVERVIEW
            </span>
            <span className="rounded bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-400">
              {(displayedTotalSignals / 1000).toFixed(1)}K peak
            </span>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={flowOverviewData}
                margin={{ top: 8, right: 6, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="flowOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload as {
                        label: string;
                        signals: number;
                      };
                      return (
                        <div className="rounded-lg bg-zinc-950 border border-orange-500/40 px-2.5 py-1 text-[10px] font-mono text-orange-300">
                          {pt.label} · <strong>{pt.signals.toLocaleString()} sigs</strong>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="signals"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#flowOrangeGrad)"
                  dot={{ r: 2.5, fill: '#fb923c', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#fff7ed', stroke: '#f97316', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2 (Col 5-7): TOP DESTINATIONS */}
        <div className="xl:col-span-3 rounded-2xl border border-white/10 bg-[#111114] p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
            TOP DESTINATIONS
          </div>

          <div className="space-y-3">
            {topDestinations.map((dest) => (
              <div key={dest.code} className="grid grid-cols-12 items-center gap-2 text-xs">
                <span className="col-span-5 text-zinc-300 truncate">
                  {dest.country}
                </span>
                <div className="col-span-4 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                    style={{ width: `${Math.min(100, dest.sharePct * 3.2)}%` }}
                  />
                </div>
                <span className="col-span-3 text-right font-mono font-semibold text-zinc-200">
                  {dest.sharePct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3 (Col 8-9): EDGE CACHE ENGINE DONUT */}
        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-[#111114] p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
            CACHE HIT ENGINE
          </div>

          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="25"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="25"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 25}
                  strokeDashoffset={
                    2 * Math.PI * 25 * (1 - globalEdge.cacheHitRatio / 100)
                  }
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-white">
                {Math.round(globalEdge.cacheHitRatio)}%
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 leading-snug">
              Edge Anycast hit ratio vs origin fallback
            </div>
          </div>

          <div>
            <div className="text-[10px] text-zinc-500">Signals Cached at Edge</div>
            <div className="font-display text-xl font-extrabold text-orange-400 tracking-tight">
              {displayedTotalSignals.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Card 4 (Col 10-12): COMPLIANCE & SECURITY */}
        <div className="xl:col-span-3 rounded-2xl border border-white/10 bg-[#111114] p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
              SECURITY &amp; FIREWALL
            </span>
            {globalEdge.securityTelemetry?.hasLiveCloudflareData && (
              <button
                type="button"
                onClick={() => setIsThreatModalOpen(true)}
                className="text-[10px] text-orange-400 hover:text-orange-300 underline font-bold cursor-pointer"
              >
                Inspect Feed ({globalEdge.securityTelemetry.totalFirewallEvents})
              </button>
            )}
          </div>

          <div className="divide-y divide-white/5 text-xs font-mono">
            <div className="py-1.5 flex items-center justify-between">
              <span className="text-zinc-400">CF Firewall Status</span>
              <span className="text-emerald-400 font-semibold">
                {globalEdge.securityTelemetry?.hasLiveCloudflareData ? 'Live Telemetry' : 'Active Edge'}
              </span>
            </div>
            <div className="py-1.5 flex items-center justify-between">
              <span className="text-zinc-400">WAF Blocks</span>
              <span className="text-red-400 font-semibold">
                {globalEdge.securityTelemetry?.hasLiveCloudflareData
                  ? `${globalEdge.securityTelemetry.mitigationsByAction.block || 0} events`
                  : '0 events'}
              </span>
            </div>
            <div className="py-1.5 flex items-center justify-between">
              <span className="text-zinc-400">Bot Challenges</span>
              <span className="text-amber-400 font-semibold">
                {globalEdge.securityTelemetry?.hasLiveCloudflareData
                  ? `${globalEdge.securityTelemetry.mitigationsByAction.managed_challenge || 0} challenges`
                  : 'Active'}
              </span>
            </div>
            <div className="py-1.5 flex items-center justify-between">
              <span className="text-zinc-400">7D Threats Mitigated</span>
              <span className="text-orange-400 font-bold">
                {globalEdge.securityTelemetry?.hasLiveCloudflareData
                  ? `${globalEdge.securityTelemetry.totalThreats7d}`
                  : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shared BaseModal: Searchable Domain Filter Dialog */}
      <BaseModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
        title="Filter Global Flat Map by Domain"
        subtitle={`${globalEdge.domains.length} active Cloudflare routing domain${globalEdge.domains.length === 1 ? '' : 's'}`}
        icon={<Funnel size={16} weight="duotone" className="text-orange-400" />}
        maxWidthClass="max-w-lg"
        footer={
          <>
            {selectedDomain !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDomain('ALL');
                  setIsDomainModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-default bg-surface hover:bg-elevated text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
              >
                Reset to All Domains
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDomainModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer"
            >
              Done
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlass
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
            />
            <input
              type="text"
              value={domainSearchQuery}
              onChange={(e) => setDomainSearchQuery(e.target.value)}
              placeholder="Search @domain or edge colo (e.g. SJC, SIN, FRA)..."
              className="w-full rounded-lg border border-default bg-input pl-8 pr-8 py-2 text-xs font-mono text-fg-primary placeholder:text-fg-placeholder focus:outline-none focus:border-focus"
            />
            {domainSearchQuery && (
              <button
                type="button"
                onClick={() => setDomainSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedDomain('ALL');
              setIsDomainModalOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
              selectedDomain === 'ALL'
                ? 'border-orange-500/50 bg-orange-500/10'
                : 'border-default bg-elevated/40 hover:bg-elevated'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400">
                <GlobeHemisphereWest size={16} weight="duotone" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-fg-primary flex items-center gap-2">
                  <span>All Domains (Aggregate View)</span>
                  <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-mono text-orange-400">
                    {globalEdge.domains.length} total
                  </span>
                </div>
                <div className="text-[11px] font-mono text-fg-secondary mt-0.5">
                  {stats.mail.totalAccounts} mailboxes · {globalEdge.totalGlobalSignals.toLocaleString()} edge signals
                </div>
              </div>
            </div>
            {selectedDomain === 'ALL' && (
              <CheckCircle size={18} weight="fill" className="text-orange-400 shrink-0" />
            )}
          </button>

          <div className="space-y-2 max-h-68 overflow-y-auto pr-1">
            {filteredDomains.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-fg-muted">
                No domains match &ldquo;{domainSearchQuery}&rdquo;
              </div>
            ) : (
              filteredDomains.map((dom) => {
                const isSelected = selectedDomain === dom.domain;
                return (
                  <button
                    key={dom.domain}
                    type="button"
                    onClick={() => {
                      setSelectedDomain(dom.domain);
                      setIsDomainModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500/50 bg-orange-500/10'
                        : 'border-default bg-surface hover:bg-elevated'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-fg-primary truncate">
                          @{dom.domain}
                        </span>
                        <span className="inline-flex items-center rounded bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-orange-400 shrink-0">
                          {dom.primaryColo}
                        </span>
                        <span className="text-[10px] font-mono text-fg-muted shrink-0">
                          {dom.uptimePct}% SLA
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-fg-secondary mt-1 flex items-center gap-3">
                        <span>{dom.mailboxes} mailboxes</span>
                        <span>·</span>
                        <span>{dom.signals.toLocaleString()} signals</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-end gap-0.5 h-5">
                        {dom.sparkline.map((v, idx) => (
                          <span
                            key={idx}
                            className="w-1 rounded-full bg-orange-400/80"
                            style={{ height: `${Math.max(20, Math.min(100, v))}%` }}
                          />
                        ))}
                      </div>
                      {isSelected && (
                        <CheckCircle size={18} weight="fill" className="text-orange-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </BaseModal>

      {/* Cloudflare Real-Time Threat Stream BaseModal */}
      <BaseModal
        isOpen={isThreatModalOpen}
        onClose={() => setIsThreatModalOpen(false)}
        title="Security & Threat Stream"
        subtitle="Edge firewall and threat interception telemetry"
        icon={<ShieldCheck size={16} weight="duotone" className="text-orange-400" />}
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-mono text-fg-muted">
              Source: Cloudflare GraphQL API · Real Threat Telemetry
            </span>
            <button
              type="button"
              onClick={() => setIsThreatModalOpen(false)}
              className="rounded-lg bg-surface hover:bg-elevated border border-default px-3 py-1.5 text-xs font-mono text-fg-primary cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Live Telemetry Header Bar, Categories & Search */}
          <div className="space-y-2.5 pb-2.5 border-b border-white/5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold tracking-wide">Live Stream Telemetry</span>
              </div>

              <div className="relative sm:w-56">
                <input
                  type="text"
                  placeholder="Search IP, host, country..."
                  value={threatSearchQuery}
                  onChange={(e) => setThreatSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-surface border border-default px-2.5 py-1 text-xs font-mono text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Clean Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {[
                { id: 'ALL', label: 'All Events' },
                { id: 'block', label: 'Blocks' },
                { id: 'managed_challenge', label: 'Challenges' },
                { id: 'link_maze_injected', label: 'Link Maze' },
              ].map((cat) => {
                const isSelected = threatCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setThreatCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-accent text-accent-fg font-semibold shadow-2xs'
                        : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated border border-default'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Stream List */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {(!globalEdge.securityTelemetry?.recentFirewallEvents ||
              globalEdge.securityTelemetry.recentFirewallEvents.length === 0) ? (
              <div className="py-8 text-center text-xs font-mono text-fg-muted">
                No security threat events recorded in this period.
              </div>
            ) : (
              globalEdge.securityTelemetry.recentFirewallEvents
                .filter((evt) => {
                  if (threatCategoryFilter !== 'ALL') {
                    if (threatCategoryFilter === 'managed_challenge') {
                      if (!evt.action.includes('challenge')) return false;
                    } else if (threatCategoryFilter === 'link_maze_injected') {
                      if (!evt.action.includes('maze')) return false;
                    } else if (evt.action !== threatCategoryFilter) {
                      return false;
                    }
                  }
                  if (!threatSearchQuery) return true;
                  const q = threatSearchQuery.toLowerCase();
                  return (
                    evt.clientIP.toLowerCase().includes(q) ||
                    evt.host.toLowerCase().includes(q) ||
                    evt.clientCountryName.toLowerCase().includes(q) ||
                    evt.ruleId.toLowerCase().includes(q) ||
                    evt.action.toLowerCase().includes(q)
                  );
                })
                .map((evt) => {
                  const isBlock = evt.action === 'block';
                  const isChallenge = evt.action === 'managed_challenge';
                  return (
                    <div
                      key={evt.id}
                      className="rounded-xl border border-default bg-surface hover:bg-elevated p-3 space-y-1.5 transition-colors font-mono text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                              isBlock
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isChallenge
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {evt.action.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-fg-primary">{evt.clientIP}</span>
                          {evt.clientAsn && (
                            <span className="text-[10px] text-fg-muted">
                              AS{evt.clientAsn}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-fg-muted">
                          {new Date(evt.datetime).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-fg-secondary">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-white/5 border border-white/10 px-1 text-[10px] font-bold text-fg-primary">
                            {evt.clientCountryName}
                          </span>
                          <span className="text-fg-primary font-semibold">{evt.host}</span>
                        </div>
                        <span className="text-[10px] text-fg-muted truncate max-w-[200px]" title={evt.ruleId}>
                          {evt.ruleId === 'bot_fight_mode'
                            ? 'Bot Fight Mode'
                            : evt.ruleId === 'link_maze'
                            ? 'Link Maze Defense'
                            : evt.ruleId}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

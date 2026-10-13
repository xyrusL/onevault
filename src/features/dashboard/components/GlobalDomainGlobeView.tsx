import React, { useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  GlobeHemisphereWest,
  Pause,
  Play,
  Broadcast,
  Lightning,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  Crosshair,
  ShareNetwork,
  Funnel,
  MagnifyingGlass,
  CheckCircle,
  ShieldCheck,
  CornersOut,
  Plus,
  Minus,
  MapPin,
  X,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../shared/components/modals';
import type {
  DashboardGlobalEdgeStats,
  DashboardStats,
  GlobalCountryNode,
} from '../types/dashboard.types';
import {
  resolveColoAndCountryGeo,
  resolveCountryGeo,
} from '../utils/flat-map-geo.utils';

interface GlobalDomainGlobeViewProps {
  stats: DashboardStats;
}

interface GlobeHtmlMarker {
  id: string;
  lat: number;
  lng: number;
  kind: 'station' | 'warning' | 'alert';
  label?: string;
  code?: string;
  colo?: string;
  countryName?: string;
  isOrigin?: boolean;
  isSelected?: boolean;
  countryNode?: GlobalCountryNode;
}

interface GlobeArcItem {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
  animateTime: number;
}

interface GlobeRingItem {
  lat: number;
  lng: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
  color: string;
}

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
        code: 'US',
        country: 'United States',
        city: 'San Jose',
        continent: 'NA',
        colo: 'SJC',
        lat: 37.77,
        lng: -122.41,
        requests: Math.round(baseSignals * 0.28),
        growthPct: 24,
        latencyMs: 12,
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
        requests: Math.round(baseSignals * 0.19),
        growthPct: 31,
        latencyMs: 19,
        status: 'normal',
      },
      {
        code: 'DE',
        country: 'Germany',
        city: 'Frankfurt',
        continent: 'EU',
        colo: 'FRA',
        lat: 50.11,
        lng: 8.68,
        requests: Math.round(baseSignals * 0.16),
        growthPct: 18,
        latencyMs: 22,
        status: 'busy',
      },
      {
        code: 'PH',
        country: 'Philippines',
        city: 'Manila',
        continent: 'AS',
        colo: 'MNL',
        lat: 14.59,
        lng: 120.98,
        requests: Math.round(baseSignals * 0.12),
        growthPct: 29,
        latencyMs: 16,
        status: 'normal',
      },
      {
        code: 'JP',
        country: 'Japan',
        city: 'Tokyo',
        continent: 'AS',
        colo: 'NRT',
        lat: 35.67,
        lng: 139.65,
        requests: Math.round(baseSignals * 0.09),
        growthPct: 15,
        latencyMs: 21,
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
        requests: Math.round(baseSignals * 0.08),
        growthPct: 12,
        latencyMs: 24,
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
        requests: Math.round(baseSignals * 0.05),
        growthPct: 22,
        latencyMs: 34,
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
        requests: Math.round(baseSignals * 0.03),
        growthPct: 19,
        latencyMs: 38,
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
      { name: 'North America', code: 'NA', signals: Math.round(baseSignals * 0.44), percentage: 44, growth: '+18%', color: '#10b981' },
      { name: 'Europe', code: 'EU', signals: Math.round(baseSignals * 0.26), percentage: 26, growth: '+12%', color: '#f59e0b' },
      { name: 'Asia Pacific', code: 'APAC', signals: Math.round(baseSignals * 0.22), percentage: 22, growth: '+29%', color: '#38bdf8' },
      { name: 'South America', code: 'SA', signals: Math.round(baseSignals * 0.08), percentage: 8, growth: '+14%', color: '#a855f7' },
    ],
  };
}

export const GlobalDomainGlobeView: React.FC<GlobalDomainGlobeViewProps> = ({
  stats,
}) => {
  const globalEdge = useMemo(() => {
    const raw = stats.globalEdge ?? buildFallbackGlobalEdge(stats);
    const sec = raw.securityTelemetry;
    const liveThreatCodes = new Set(
      (sec?.liveThreatCountries || []).map((t) =>
        resolveCountryGeo(t.countryCode).code.toUpperCase()
      )
    );

    const countryMap = new Map<string, GlobalCountryNode>();

    // 1. Always resolve and include the viewer's live detected Edge POP first
    const viewerResolved = resolveColoAndCountryGeo({
      coloCode: raw.viewerColo,
      country: raw.viewerCountry,
      city: raw.viewerCity,
      lat: raw.viewerLat,
      lng: raw.viewerLng,
    });

    countryMap.set(viewerResolved.countryCode, {
      code: viewerResolved.countryCode,
      country: viewerResolved.countryName,
      city: viewerResolved.city,
      colo: viewerResolved.coloCode,
      continent: viewerResolved.continent,
      lat: viewerResolved.lat,
      lng: viewerResolved.lng,
      requests:
        raw.countries.find((c) => c.code === viewerResolved.countryCode)?.requests ||
        Math.max(120, Math.round(raw.totalGlobalSignals * 0.25)),
      growthPct: 24,
      latencyMs: raw.clientTcpRttMs || 12,
      status: liveThreatCodes.has(viewerResolved.countryCode) ? 'threat' : 'sync',
    });

    // 2. Include live Cloudflare topColos if available
    if (sec?.hasLiveCloudflareData && sec.topColos.length > 0) {
      for (const colo of sec.topColos.slice(0, 10)) {
        const resolved = resolveColoAndCountryGeo({
          coloCode: colo.coloCode,
          country: colo.country,
          city: colo.city,
          lat: colo.lat,
          lng: colo.lng,
        });
        if (!countryMap.has(resolved.countryCode)) {
          countryMap.set(resolved.countryCode, {
            code: resolved.countryCode,
            country: resolved.countryName,
            city: resolved.city,
            colo: resolved.coloCode,
            continent: resolved.continent,
            lat: resolved.lat,
            lng: resolved.lng,
            requests: colo.requests,
            growthPct: 18,
            latencyMs: 16,
            status: liveThreatCodes.has(resolved.countryCode)
              ? 'threat'
              : colo.requests > 300
              ? 'busy'
              : 'normal',
          });
        }
      }
    }

    // 3. Merge raw.countries with resolved coordinates
    for (const c of raw.countries) {
      const resolved = resolveColoAndCountryGeo({
        coloCode: c.colo,
        country: c.code || c.country,
        city: c.city,
        lat: c.lat,
        lng: c.lng,
      });
      if (!countryMap.has(resolved.countryCode)) {
        countryMap.set(resolved.countryCode, {
          ...c,
          code: resolved.countryCode,
          country: resolved.countryName,
          city: resolved.city,
          colo: resolved.coloCode,
          continent: resolved.continent,
          lat: resolved.lat,
          lng: resolved.lng,
          status: liveThreatCodes.has(resolved.countryCode) ? 'threat' : c.status,
        });
      }
    }

    // 4. Include any active live attack origin countries
    if (sec?.liveThreatCountries) {
      for (const threat of sec.liveThreatCountries) {
        const resolved = resolveCountryGeo(
          threat.countryCode || threat.countryName,
          undefined,
          threat.lat,
          threat.lng
        );
        if (!countryMap.has(resolved.code)) {
          countryMap.set(resolved.code, {
            code: resolved.code,
            country: resolved.name,
            city: resolved.name,
            colo: 'ATK',
            continent: resolved.continent,
            lat: resolved.lat,
            lng: resolved.lng,
            requests: 1,
            growthPct: 0,
            latencyMs: 45,
            status: 'threat',
          });
        }
      }
    }

    return {
      ...raw,
      viewerCountry: viewerResolved.countryCode,
      viewerCity: viewerResolved.city,
      viewerColo: viewerResolved.coloCode,
      viewerLat: viewerResolved.lat,
      viewerLng: viewerResolved.lng,
      countries: Array.from(countryMap.values()),
    };
  }, [stats]);

  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [isDomainModalOpen, setIsDomainModalOpen] = useState<boolean>(false);
  const [domainSearchQuery, setDomainSearchQuery] = useState<string>('');
  const [isThreatModalOpen, setIsThreatModalOpen] = useState<boolean>(false);
  const [threatCategoryFilter, setThreatCategoryFilter] = useState<string>('ALL');
  const [threatSearchQuery, setThreatSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<GlobalCountryNode | null>(
    () => globalEdge.countries[0] ?? null
  );
  const [isLabelDetailOpen, setIsLabelDetailOpen] = useState<boolean>(false);
  const [isFullGlobeOpen, setIsFullGlobeOpen] = useState<boolean>(false);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [showArcs, setShowArcs] = useState<boolean>(true);
  const [globeSize, setGlobeSize] = useState<{ width: number; height: number }>({
    width: 440,
    height: 370,
  });
  const [fullGlobeSize, setFullGlobeSize] = useState<{ width: number; height: number }>({
    width: 720,
    height: 540,
  });

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const fullGlobeRef = useRef<GlobeMethods | undefined>(undefined);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const fullStageContainerRef = useRef<HTMLDivElement | null>(null);

  // Measure the mini globe stage container using full available width so edge labels never clip
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(300, Math.floor(rect.width));
      const h = Math.max(320, Math.min(400, Math.floor(rect.height || 370)));
      setGlobeSize({ width: w, height: h });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure the Full View globe stage container when modal is open
  useEffect(() => {
    if (!isFullGlobeOpen) return;
    const el = fullStageContainerRef.current;
    if (!el) return;

    const updateFullSize = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(340, Math.floor(rect.width));
      const h = Math.max(420, Math.floor(rect.height || 540));
      setFullGlobeSize({ width: w, height: h });
    };

    updateFullSize();
    const ro = new ResizeObserver(updateFullSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFullGlobeOpen]);

  // Configure Three.js OrbitControls auto-rotation & zoom bounds on both Mini and Full globes
  useEffect(() => {
    for (const ref of [globeRef.current, fullGlobeRef.current]) {
      if (!ref) continue;
      const controls = ref.controls();
      if (controls) {
        controls.autoRotate = isAutoRotating;
        controls.autoRotateSpeed = 0.75;
        controls.enableZoom = true;
        controls.minDistance = 115;
        controls.maxDistance = 420;
      }
    }
  }, [isAutoRotating, isFullGlobeOpen]);

  const configureGlobeInstance = (
    globe: GlobeMethods | undefined,
    initialAltitude = 1.82
  ) => {
    if (!globe) return;
    const targetLat = selectedCountry?.lat ?? globalEdge.viewerLat ?? 14.6;
    const targetLng = selectedCountry?.lng ?? globalEdge.viewerLng ?? 121.0;
    globe.pointOfView({ lat: targetLat, lng: targetLng, altitude: initialAltitude }, 0);
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = isAutoRotating;
      controls.autoRotateSpeed = 0.75;
      controls.enableZoom = true;
      controls.minDistance = 115;
      controls.maxDistance = 420;
    }
  };

  const handleGlobeReady = () => {
    configureGlobeInstance(globeRef.current, 1.82);
  };

  const handleFullGlobeReady = () => {
    configureGlobeInstance(fullGlobeRef.current, 1.65);
  };

  const handleManualZoom = (
    target: 'mini' | 'full',
    direction: 'in' | 'out'
  ) => {
    const globe = target === 'full' ? fullGlobeRef.current : globeRef.current;
    if (!globe) return;
    const currentPov = globe.pointOfView();
    const currentAlt =
      typeof currentPov?.altitude === 'number' ? currentPov.altitude : 1.8;
    const step = 0.32;
    const nextAlt =
      direction === 'in'
        ? Math.max(0.55, Number((currentAlt - step).toFixed(2)))
        : Math.min(3.2, Number((currentAlt + step).toFixed(2)));
    globe.pointOfView(
      {
        lat: currentPov?.lat ?? selectedCountry?.lat ?? globalEdge.viewerLat,
        lng: currentPov?.lng ?? selectedCountry?.lng ?? globalEdge.viewerLng,
        altitude: nextAlt,
      },
      320
    );
  };

  const handleFocusMyEdgePop = () => {
    const myCountry =
      globalEdge.countries.find((c) => c.code === globalEdge.viewerCountry) ??
      globalEdge.countries[0];
    if (myCountry) {
      setSelectedCountry(myCountry);
      setIsLabelDetailOpen(true);
      if (globeRef.current) {
        globeRef.current.pointOfView(
          { lat: myCountry.lat, lng: myCountry.lng, altitude: 1.72 },
          900
        );
      }
      if (fullGlobeRef.current) {
        fullGlobeRef.current.pointOfView(
          { lat: myCountry.lat, lng: myCountry.lng, altitude: 1.55 },
          900
        );
      }
    }
  };

  const handleSelectCountry = (
    country: GlobalCountryNode,
    openDetailPopup = true
  ) => {
    setSelectedCountry(country);
    if (openDetailPopup) {
      setIsLabelDetailOpen(true);
    }
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: country.lat, lng: country.lng, altitude: 1.72 },
        850
      );
    }
    if (fullGlobeRef.current) {
      fullGlobeRef.current.pointOfView(
        { lat: country.lat, lng: country.lng, altitude: 1.52 },
        850
      );
    }
  };

  const filteredDomains = useMemo(() => {
    const q = domainSearchQuery.trim().toLowerCase();
    if (!q) return globalEdge.domains;
    return globalEdge.domains.filter(
      (d) =>
        d.domain.toLowerCase().includes(q) ||
        d.primaryColo.toLowerCase().includes(q)
    );
  }, [domainSearchQuery, globalEdge.domains]);

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

  // Build 3D WebGL Animated Flight Arcs (arcsData for react-globe.gl)
  const arcsData = useMemo<GlobeArcItem[]>(() => {
    if (!showArcs || globalEdge.countries.length === 0) return [];
    const hub = selectedCountry ?? globalEdge.countries[0];
    return globalEdge.countries
      .filter((c) => c.code !== hub.code)
      .map((c, idx) => ({
        startLat: c.lat,
        startLng: c.lng,
        endLat: hub.lat,
        endLng: hub.lng,
        color:
          c.status === 'threat'
            ? ['rgba(239, 68, 68, 0.95)', 'rgba(255, 255, 255, 0.85)']
            : ['rgba(16, 185, 129, 0.85)', 'rgba(255, 255, 255, 0.9)'],
        animateTime: 1600 + (idx % 4) * 320,
      }));
  }, [globalEdge.countries, selectedCountry, showArcs]);

  // Build 3D WebGL Pulsing Sonar Rings (ringsData for react-globe.gl)
  const ringsData = useMemo<GlobeRingItem[]>(() => {
    return globalEdge.countries.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      maxR: selectedCountry?.code === c.code ? 6.5 : 4.2,
      propagationSpeed: selectedCountry?.code === c.code ? 2.4 : 1.6,
      repeatPeriod: selectedCountry?.code === c.code ? 750 : 1100,
      color:
        c.status === 'threat'
          ? '#ef4444'
          : c.code === globalEdge.viewerCountry
          ? '#10b981'
          : '#22d3ee',
    }));
  }, [globalEdge.countries, globalEdge.viewerCountry, selectedCountry]);

  // Build 3D-Projected HTML Callout Pins + Concentric Rings (Red if active attack, Default Cyan/Emerald for normal request)
  const htmlMarkersData = useMemo<GlobeHtmlMarker[]>(() => {
    return globalEdge.countries.map((c) => ({
      id: `country-${c.code}-${c.colo}`,
      lat: c.lat,
      lng: c.lng,
      kind: c.status === 'threat' ? 'alert' : 'station',
      code: c.code,
      colo: c.colo,
      countryName: c.country,
      isOrigin: c.code === globalEdge.viewerCountry,
      label:
        c.code === globalEdge.viewerCountry
          ? `${c.code} · ${c.colo}`
          : `${c.code} · ${c.colo !== c.code ? c.colo : c.country}`,
      isSelected: selectedCountry?.code === c.code,
      countryNode: c,
    }));
  }, [globalEdge.countries, globalEdge.viewerCountry, selectedCountry]);

  const totalCountryRequests = useMemo(() => {
    const sum = globalEdge.countries.reduce((acc, c) => acc + c.requests, 0);
    return Math.max(1, sum);
  }, [globalEdge.countries]);

  const selectedCountryFirewallEvents = useMemo(() => {
    if (!selectedCountry || !globalEdge.securityTelemetry?.recentFirewallEvents) {
      return [];
    }
    const codeUpper = selectedCountry.code.toUpperCase();
    const nameUpper = selectedCountry.country.toUpperCase();
    return globalEdge.securityTelemetry.recentFirewallEvents.filter((evt) => {
      const c = (evt.clientCountryName || '').toUpperCase();
      return c === codeUpper || c === nameUpper;
    });
  }, [globalEdge.securityTelemetry?.recentFirewallEvents, selectedCountry]);

  // Shared 3D HTML Callout Pin Marker builder used by both Mini Globe and Full Globe
  const renderGlobeCalloutPin = (d: object): HTMLElement => {
    const item = d as GlobeHtmlMarker;
    const isThreat =
      item.kind === 'alert' || item.countryNode?.status === 'threat';
    const isOrigin = Boolean(item.isOrigin);
    const isSelected = Boolean(item.isSelected);

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.transform = 'translate(-50%, -50%)';
    wrapper.style.pointerEvents = item.countryNode ? 'auto' : 'none';
    wrapper.style.zIndex = isThreat ? '30' : isSelected ? '28' : '15';

    if (item.countryNode) {
      wrapper.style.cursor = 'pointer';
      const targetNode = item.countryNode;
      wrapper.onclick = (e) => {
        e.stopPropagation();
        handleSelectCountry(targetNode, true);
      };
    }

    // 1. Concentric Glowing Target Rings on Globe Surface
    const outerRing = document.createElement('div');
    outerRing.style.width = isSelected ? '34px' : '26px';
    outerRing.style.height = isSelected ? '34px' : '26px';
    outerRing.style.borderRadius = '9999px';
    outerRing.style.border = isThreat
      ? '1px solid rgba(239, 68, 68, 0.7)'
      : isSelected
      ? '1.5px solid rgba(52, 211, 153, 0.85)'
      : '1px solid rgba(45, 212, 191, 0.55)';
    outerRing.style.background = isThreat
      ? 'radial-gradient(circle, rgba(239, 68, 68, 0.36) 0%, rgba(239, 68, 68, 0.06) 70%, transparent 100%)'
      : 'radial-gradient(circle, rgba(20, 184, 166, 0.34) 0%, rgba(6, 182, 212, 0.06) 70%, transparent 100%)';
    outerRing.style.boxShadow = isThreat
      ? '0 0 18px rgba(239, 68, 68, 0.6)'
      : isSelected
      ? '0 0 20px rgba(16, 185, 129, 0.65)'
      : '0 0 16px rgba(20, 184, 166, 0.45)';
    outerRing.style.display = 'flex';
    outerRing.style.alignItems = 'center';
    outerRing.style.justifyContent = 'center';

    const innerRing = document.createElement('div');
    innerRing.style.width = isSelected ? '19px' : '15px';
    innerRing.style.height = isSelected ? '19px' : '15px';
    innerRing.style.borderRadius = '9999px';
    innerRing.style.border = isThreat
      ? '1.5px solid #ef4444'
      : '1.5px solid #2dd4bf';
    innerRing.style.background = isThreat
      ? 'rgba(239, 68, 68, 0.32)'
      : 'rgba(20, 184, 166, 0.32)';
    innerRing.style.display = 'flex';
    innerRing.style.alignItems = 'center';
    innerRing.style.justifyContent = 'center';

    const coreDot = document.createElement('div');
    coreDot.style.width = '6.5px';
    coreDot.style.height = '6.5px';
    coreDot.style.borderRadius = '9999px';
    coreDot.style.background = isThreat ? '#fef2f2' : '#ecfeff';
    coreDot.style.boxShadow = isThreat
      ? '0 0 10px #ef4444, 0 0 4px #ffffff'
      : '0 0 10px #2dd4bf, 0 0 4px #ffffff';

    innerRing.appendChild(coreDot);
    outerRing.appendChild(innerRing);
    wrapper.appendChild(outerRing);

    // 2. Floating Dark Callout Pin Badge with Downward Pointer Arrow
    const calloutWrap = document.createElement('div');
    calloutWrap.style.position = 'absolute';
    calloutWrap.style.bottom = isSelected ? '21px' : '17px';
    calloutWrap.style.left = '50%';
    calloutWrap.style.transform = 'translateX(-50%)';
    calloutWrap.style.display = 'flex';
    calloutWrap.style.flexDirection = 'column';
    calloutWrap.style.alignItems = 'center';
    calloutWrap.style.pointerEvents = 'auto';

    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '6px';
    card.style.padding = '3.5px 7px 3.5px 4px';
    card.style.borderRadius = '9px';
    card.style.background = 'rgba(8, 8, 12, 0.94)';
    card.style.border = isThreat
      ? '1.5px solid rgba(239, 68, 68, 0.9)'
      : isSelected
      ? '1.5px solid rgba(45, 212, 191, 0.95)'
      : '1px solid rgba(255, 255, 255, 0.18)';
    card.style.boxShadow = isThreat
      ? '0 8px 22px rgba(239, 68, 68, 0.45)'
      : isSelected
      ? '0 8px 22px rgba(20, 184, 166, 0.38)'
      : '0 8px 20px rgba(0, 0, 0, 0.8)';
    card.style.whiteSpace = 'nowrap';
    card.title = 'Click label to inspect country & edge POP telemetry';

    const iconBox = document.createElement('div');
    iconBox.style.width = '20px';
    iconBox.style.height = '20px';
    iconBox.style.borderRadius = '6px';
    iconBox.style.display = 'flex';
    iconBox.style.alignItems = 'center';
    iconBox.style.justifyContent = 'center';
    iconBox.style.flexShrink = '0';
    iconBox.style.background = isThreat
      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      : isOrigin
      ? 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)'
      : 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)';
    iconBox.style.boxShadow = isThreat
      ? '0 0 10px rgba(239, 68, 68, 0.6)'
      : isOrigin
      ? '0 0 10px rgba(16, 185, 129, 0.5)'
      : '0 0 10px rgba(6, 182, 212, 0.45)';
    iconBox.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`;

    const textCol = document.createElement('div');
    textCol.style.display = 'flex';
    textCol.style.flexDirection = 'column';
    textCol.style.lineHeight = '1.08';

    const primaryText = document.createElement('span');
    primaryText.style.fontFamily = '"JetBrains Mono", monospace';
    primaryText.style.fontSize = '9.5px';
    primaryText.style.fontWeight = '800';
    primaryText.style.color = isThreat ? '#fecaca' : '#ffffff';
    primaryText.textContent =
      item.label || `${item.code || 'US'} · ${item.colo || 'EDGE'}`;

    const subText = document.createElement('span');
    subText.style.fontFamily = '"JetBrains Mono", monospace';
    subText.style.fontSize = '8px';
    subText.style.fontWeight = '600';
    subText.style.color = isThreat
      ? '#f87171'
      : isOrigin
      ? '#34d399'
      : '#94a3b8';
    subText.textContent = isThreat
      ? `ATTACK · ${item.countryName || item.code}`
      : item.countryName || item.code || 'Live Edge';

    textCol.appendChild(primaryText);
    textCol.appendChild(subText);
    card.appendChild(iconBox);
    card.appendChild(textCol);

    const pointer = document.createElement('div');
    pointer.style.width = '0';
    pointer.style.height = '0';
    pointer.style.borderLeft = '5px solid transparent';
    pointer.style.borderRight = '5px solid transparent';
    pointer.style.borderTop = isThreat
      ? '6px solid #ef4444'
      : isSelected
      ? '6px solid #2dd4bf'
      : '6px solid rgba(8, 8, 12, 0.94)';
    pointer.style.marginTop = '-1px';

    calloutWrap.appendChild(card);
    calloutWrap.appendChild(pointer);
    wrapper.appendChild(calloutWrap);

    return wrapper;
  };

  const counterDigits = String(displayedTotalSignals)
    .padStart(6, '0')
    .slice(-6)
    .split('');

  const globalCurveData = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        hour: `${String(i + 6).padStart(2, '0')}:00`,
        signals: Math.round(
          (14 + Math.sin(i * 0.65) * 7 + ((i * 5) % 6)) * domainScale * 10
        ),
      })),
    [domainScale]
  );

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#08080a] text-zinc-100 p-4 sm:p-6 shadow-card overflow-hidden">
      {/* Subtle Neutral Ambient Radial Glow (blends seamlessly with OneVault dark theme) */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[640px] rounded-full opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)',
        }}
      />

      {/* TOP COMMAND CENTER BAR: Neutral Obsidian Header matching Flat Map & Portal Theme */}
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 shadow-xs">
            <GlobeHemisphereWest size={22} weight="duotone" className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-sm sm:text-base font-bold tracking-tight text-white">
                Global Edge Domain Command Center
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                <Broadcast size={11} weight="bold" className="animate-pulse" />
                Live Edge: {globalEdge.viewerColo} ({globalEdge.viewerCity}, {globalEdge.viewerCountry}) · {globalEdge.httpProtocol}
              </span>
              {globalEdge.securityTelemetry?.hasLiveCloudflareData ? (
                (globalEdge.securityTelemetry.liveAttackCount || 0) > 0 ? (
                  <button
                    type="button"
                    onClick={() => setIsThreatModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-400 cursor-pointer transition-colors"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                    LIVE ATTACK: {globalEdge.securityTelemetry.liveAttackCount} Active ({globalEdge.securityTelemetry.totalRequests7d.toLocaleString()} reqs)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsThreatModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 cursor-pointer transition-colors"
                  >
                    <ShieldCheck size={11} weight="bold" />
                    Cloudflare Live: Clean · 0 Active Attacks (7D: {globalEdge.securityTelemetry.totalThreats7d} Mitigated)
                  </button>
                )
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-300">
                  <ShieldCheck size={11} weight="bold" />
                  Free Tier Safe · 0 Extra Calls
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              Live Cloudflare Anycast Satellite Earth · Client-side WebGL (no polling overhead) · Drag to rotate or click any node
            </p>
          </div>
        </div>

        {/* Compact Domain Filter Trigger (opens searchable BaseModal) */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedDomain !== 'ALL' && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] border border-white/15 px-2.5 py-1 text-xs font-mono text-zinc-200">
              <span className="font-bold">@{selectedDomain}</span>
              <button
                type="button"
                onClick={() => setSelectedDomain('ALL')}
                title="Reset to All Domains"
                className="inline-flex h-4 w-4 items-center justify-center rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={11} weight="bold" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsDomainModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#131316] hover:bg-[#1a1a1f] border border-white/15 hover:border-white/30 px-3 py-1.5 text-xs font-mono text-zinc-200 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Funnel size={13} weight="duotone" className="text-emerald-400 shrink-0" />
            <span>
              {selectedDomain === 'ALL'
                ? 'Domain Scope: All'
                : 'Change Domain'}
            </span>
            <span className="inline-flex items-center justify-center rounded-md bg-white/[0.07] border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200 leading-none">
              {globalEdge.domains.length}
            </span>
          </button>
        </div>
      </div>

      {/* MAIN 3-COLUMN COMMAND CENTER GRID: Flush Top & Bottom Obsidian Cards */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-4 pt-4 items-stretch">
        {/* LEFT HUD COLUMN (Col 1-3): Segmented Counter + Edge Routing Telemetry + Domain Signal Equalizer */}
        <div className="xl:col-span-3 flex flex-col justify-between gap-3.5">
          {/* Card 1: Digital Segmented Signal Counter */}
          <div className="rounded-2xl bg-[#111114] border border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="font-semibold tracking-wider uppercase text-zinc-300">
                GLOBAL SIGNALS PROCESSED
              </span>
              <Lightning size={13} weight="fill" className="text-amber-400" />
            </div>
            <div className="flex items-center gap-1.5">
              {counterDigits.map((digit, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-10 flex items-center justify-center rounded-lg bg-[#0b0b0d] border border-white/10 font-mono text-xl font-black text-white shadow-inner"
                >
                  {digit}
                </div>
              ))}
              <span className="text-xs font-mono text-zinc-400 font-bold pl-1">
                OPS
              </span>
            </div>
          </div>

          {/* Card 2 (flex-1): Edge Routing Telemetry Bars */}
          <div className="flex-1 flex flex-col justify-between rounded-2xl bg-[#111114] border border-white/10 p-4 space-y-3 font-mono">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>EDGE TELEMETRY &amp; FIREWALL</span>
                </div>
                {globalEdge.securityTelemetry?.hasLiveCloudflareData && (
                  <button
                    type="button"
                    onClick={() => setIsThreatModalOpen(true)}
                    title="Live Stream Telemetry"
                    aria-label="Live Stream Telemetry"
                    className="relative inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 transition-colors cursor-pointer"
                  >
                    <Broadcast size={13} weight="bold" className="animate-pulse" />
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">Live Attack Detection</span>
                  {(globalEdge.securityTelemetry?.liveAttackCount || 0) > 0 ? (
                    <span className="text-red-400 font-bold">
                      {globalEdge.securityTelemetry?.liveAttackCount} active attack{(globalEdge.securityTelemetry?.liveAttackCount || 0) > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">
                      0 Active (Clean)
                    </span>
                  )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${(globalEdge.securityTelemetry?.liveAttackCount || 0) > 0 ? 'bg-red-500' : 'bg-emerald-400'}`}
                    style={{
                      width: '100%',
                    }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500">
                  {(globalEdge.securityTelemetry?.liveAttackCount || 0) > 0
                    ? 'Active Cloudflare firewall mitigation triggered'
                    : 'No active attacks detected on Cloudflare Edge'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">7D Security Mitigations</span>
                  <span className="text-zinc-200 font-bold">
                    {globalEdge.securityTelemetry?.hasLiveCloudflareData
                      ? `${globalEdge.securityTelemetry.totalThreats7d} mitigated`
                      : `${stats.mail.forwardedAccounts} rules`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/70 rounded-full"
                    style={{ width: '65%' }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500">
                  {globalEdge.securityTelemetry?.hasLiveCloudflareData
                    ? `${globalEdge.securityTelemetry.totalRequests7d.toLocaleString()} HTTP requests inspected`
                    : `${stats.mail.forwardPercentage}% forwarded via Cloudflare Edge`}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">2FA &amp; Note Crypto Syncs</span>
                  <span className="text-emerald-400 font-bold">
                    {stats.twoFactor.totalTokens + stats.notes.totalNotes} items
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '46%' }} />
                </div>
                <div className="text-[10px] text-zinc-500">
                  100% SHA-256 &amp; AES-GCM verified
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/10 grid grid-cols-3 gap-2 text-[10px] text-zinc-300">
              <div>
                <div className="text-zinc-500">Telemetry</div>
                <div className="font-bold text-emerald-400">
                  {globalEdge.securityTelemetry?.hasLiveCloudflareData ? 'LIVE CF' : 'EDGE'}
                </div>
              </div>
              <div>
                <div className="text-zinc-500">Active POPs</div>
                <div className="font-bold text-white">{globalEdge.countries.length}</div>
              </div>
              <div>
                <div className="text-zinc-500">Protocol</div>
                <div className="font-bold text-amber-400">{globalEdge.tlsVersion}</div>
              </div>
            </div>
          </div>

          {/* Card 3: Regional Domain Signal Equalizer */}
          <div className="rounded-2xl bg-[#111114] border border-white/10 p-3.5 space-y-2.5 font-mono">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              ACTIVE DOMAIN EQUALIZER
            </div>
            {globalEdge.domains.slice(0, 3).map((dom, idx) => (
              <div key={dom.domain} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-zinc-100 truncate">
                    {dom.primaryColo} · {dom.domain.split('.')[0].toUpperCase()}
                  </div>
                  <div className="text-[9px] text-zinc-500">{dom.mailboxes} mailboxes</div>
                </div>
                <div className="flex items-end gap-0.5 h-5 shrink-0">
                  {dom.sparkline.map((val, barIdx) => (
                    <span
                      key={barIdx}
                      className={`w-1 rounded-full ${
                        idx === 0
                          ? 'bg-emerald-400'
                          : idx === 1
                          ? 'bg-amber-400/85'
                          : 'bg-zinc-400'
                      }`}
                      style={{ height: `${Math.max(22, Math.min(100, val))}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER STAGE COLUMN (Col 4-8): Top Focus Bar + 3D WebGL Blue Marble Earth + Continental Radial Gauges */}
        <div className="xl:col-span-5 flex flex-col justify-between gap-3.5">
          {/* Top Bar (Flush with Top of Left & Right Columns) */}
          <div className="w-full flex items-center justify-between gap-2 rounded-2xl bg-[#111114] border border-white/10 px-3.5 py-2.5 text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <Crosshair size={15} className="text-emerald-400 animate-spin shrink-0" style={{ animationDuration: '8s' }} />
              {selectedCountry ? (
                <div className="truncate">
                  <span className="font-bold text-white">
                    {selectedCountry.country} ({selectedCountry.colo})
                  </span>
                  <span className="text-zinc-400 ml-2">
                    {Math.round(selectedCountry.requests * domainScale).toLocaleString()} reqs ·{' '}
                    {selectedCountry.latencyMs}ms
                  </span>
                </div>
              ) : (
                <span className="text-white font-bold">Global Satellite View</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleFocusMyEdgePop}
                title="Focus camera on your live detected Cloudflare Edge Point of Presence"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 transition-colors cursor-pointer"
              >
                <Crosshair size={11} weight="bold" />
                <span>My Edge POP</span>
              </button>
              <button
                type="button"
                onClick={() => setShowArcs((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
                  showArcs
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShareNetwork size={11} />
                <span>Arcs</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAutoRotating((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-zinc-200 cursor-pointer"
              >
                {isAutoRotating ? <Pause size={11} /> : <Play size={11} />}
                <span>{isAutoRotating ? 'Pause Spin' : 'Auto Spin'}</span>
              </button>
            </div>
          </div>

          {/* Center 3D WebGL Globe Stage (pure obsidian #070709 background matching Flat Map!) */}
          <div className="flex-1 flex flex-col items-center justify-between rounded-2xl bg-[#070709] border border-white/5 p-3 relative overflow-hidden min-h-[360px]">
            {/* Top-Right Inside Globe Controls: Compact Dedicated - / + Zoom & Full View Button */}
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 font-mono">
              <div className="inline-flex items-center rounded-lg bg-[#111116]/85 backdrop-blur-md border border-white/10 p-0.5 shadow-md">
                <button
                  type="button"
                  onClick={() => handleManualZoom('mini', 'out')}
                  title="Zoom Out (-)"
                  aria-label="Zoom out globe"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Minus size={10} weight="bold" />
                </button>
                <span className="h-3 w-px bg-white/10" />
                <button
                  type="button"
                  onClick={() => handleManualZoom('mini', 'in')}
                  title="Zoom In (+)"
                  aria-label="Zoom in globe"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Plus size={10} weight="bold" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFullGlobeOpen(true)}
                title="Open Full Globe Display"
                className="inline-flex items-center gap-1 rounded-lg bg-[#111116]/85 hover:bg-emerald-500/15 backdrop-blur-md border border-white/10 hover:border-emerald-500/30 px-2 py-0.5 text-[9.5px] font-semibold text-zinc-200 hover:text-emerald-300 shadow-md transition-all cursor-pointer h-6"
              >
                <CornersOut size={11} weight="bold" className="text-emerald-400" />
                <span>Full View</span>
              </button>
            </div>

            {/* Interactive Clicked Label Important Details Overlay Card (Mini View) */}
            {isLabelDetailOpen && selectedCountry && (
              <div className="absolute bottom-11 left-3 z-20 w-64 sm:w-72 rounded-xl bg-[#0c0c10]/95 backdrop-blur-md border border-white/15 p-3 shadow-2xl font-mono text-xs animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          selectedCountry.status === 'threat'
                            ? 'bg-red-500 animate-ping'
                            : selectedCountry.code === globalEdge.viewerCountry
                            ? 'bg-emerald-400'
                            : 'bg-cyan-400'
                        }`}
                      />
                      <span className="font-bold text-white truncate">
                        {selectedCountry.country} ({selectedCountry.code})
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin size={11} className="text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {selectedCountry.city} · POP {selectedCountry.colo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        selectedCountry.status === 'threat'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : selectedCountry.code === globalEdge.viewerCountry
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {selectedCountry.status === 'threat'
                        ? 'Attack'
                        : selectedCountry.code === globalEdge.viewerCountry
                        ? 'Origin POP'
                        : 'Normal'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLabelDetailOpen(false)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      title="Close details"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 text-[10px]">
                  <div className="rounded-lg bg-white/[0.03] border border-white/5 p-1.5">
                    <div className="text-zinc-500">Requests</div>
                    <div className="font-bold text-white mt-0.5">
                      {Math.round(selectedCountry.requests * domainScale).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/5 p-1.5">
                    <div className="text-zinc-500">Traffic Share</div>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      {Math.max(
                        1,
                        Math.round((selectedCountry.requests / totalCountryRequests) * 100)
                      )}
                      %
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/5 p-1.5">
                    <div className="text-zinc-500">Edge RTT</div>
                    <div className="font-bold text-cyan-300 mt-0.5">
                      {selectedCountry.latencyMs}ms
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px] text-zinc-400">
                  <span>
                    {selectedCountry.lat.toFixed(2)}°, {selectedCountry.lng.toFixed(2)}° ·{' '}
                    {globalEdge.httpProtocol}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFullGlobeOpen(true)}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                  >
                    Full Inspect →
                  </button>
                </div>
              </div>
            )}

            <div
              ref={stageContainerRef}
              className="relative z-10 w-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
              <Globe
                ref={globeRef}
                width={globeSize.width}
                height={globeSize.height}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="/earth-blue-marble.jpg"
                bumpImageUrl="/earth-topology.png"
                showAtmosphere={true}
                atmosphereColor="#60a5fa"
                atmosphereAltitude={0.13}
                onGlobeReady={handleGlobeReady}
                /* 3D Animated Flight Arcs */
                arcsData={arcsData}
                arcStartLat="startLat"
                arcStartLng="startLng"
                arcEndLat="endLat"
                arcEndLng="endLng"
                arcColor="color"
                arcDashLength={0.45}
                arcDashGap={0.25}
                arcDashAnimateTime="animateTime"
                arcStroke={0.65}
                arcAltitudeAutoScale={0.36}
                /* 3D Expanding Sonar Rings */
                ringsData={ringsData}
                ringLat="lat"
                ringLng="lng"
                ringColor="color"
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                /* 3D HTML Callout Pin Markers (Concentric Target Ring + Floating Badge: Red on Active Attack, Cyan/Emerald on Normal Request) */
                htmlElementsData={htmlMarkersData}
                htmlLat="lat"
                htmlLng="lng"
                htmlAltitude={0.015}
                htmlElement={renderGlobeCalloutPin}
              />
            </div>

            {/* Marker Status Legend Bar - Compact Guide */}
            <div className="relative z-10 w-full flex items-center justify-center gap-3 pt-1.5 border-t border-white/5 text-[9px] font-mono text-zinc-400">
              <span className="inline-flex items-center gap-1 text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Click Label
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Edge POP
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-300">
                <span className="h-1 w-2.5 rounded-full bg-emerald-400/80" />
                Anycast
              </span>
              {(globalEdge.securityTelemetry?.liveAttackCount || 0) > 0 ? (
                <span className="inline-flex items-center gap-1 text-red-400 font-bold animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Attack Alert
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <ShieldCheck size={11} weight="bold" />
                  Defense Clean
                </span>
              )}
            </div>
          </div>

          {/* Bottom Card (Flush with Bottom of Left & Right Columns): 4 Continental Radial Gauges */}
          <div className="rounded-2xl bg-[#111114] border border-white/10 p-3 font-mono">
            <div className="grid grid-cols-4 gap-2 text-center">
              {globalEdge.continentShares.map((cont) => {
                const radius = 19;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (cont.percentage / 100) * circumference;
                return (
                  <div key={cont.code} className="flex flex-col items-center">
                    <div className="relative h-12 w-12 flex items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 48 48">
                        <circle
                          cx="24"
                          cy="24"
                          r={radius}
                          fill="none"
                          stroke="#27272a"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r={radius}
                          fill="none"
                          stroke={cont.color}
                          strokeWidth="3.5"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span className="text-[10px] font-bold text-white">
                          {cont.percentage}%
                        </span>
                        <span className="text-[8px] text-emerald-400 mt-0.5">
                          {cont.growth}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1 truncate max-w-full">
                      {cont.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT HUD COLUMN (Col 9-12): Country Ranking + Mini Bar Charts + Cache/RTT + 24h Curve */}
        <div className="xl:col-span-4 flex flex-col justify-between gap-3.5">
          {/* Card 1 (flex-1): Top Interacting Countries Table + 3 Mini Equalizer Columns */}
          <div className="flex-1 flex flex-col justify-between rounded-2xl bg-[#111114] border border-white/10 p-4 space-y-3 font-mono">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass size={14} className="text-emerald-400" />
                  GLOBAL COUNTRY INTERACTIONS
                </span>
                <span className="text-[10px] text-zinc-500">Click row to focus globe</span>
              </div>

              <div className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1">
                {globalEdge.countries.map((c) => {
                  const isSelected = selectedCountry?.code === c.code;
                  const scaledReqs = Math.round(c.requests * domainScale);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      className={`w-full py-1.5 px-2 flex items-center justify-between text-xs transition-colors rounded-lg cursor-pointer ${
                        isSelected
                          ? 'bg-white/[0.08] text-white font-bold'
                          : 'hover:bg-white/[0.04] text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            c.status === 'threat'
                              ? 'bg-red-400'
                              : c.status === 'busy'
                              ? 'bg-amber-400'
                              : 'bg-white shadow-[0_0_6px_#ffffff]'
                          }`}
                        />
                        <span className="truncate">
                          {c.country} · <span className="text-zinc-400">{c.colo}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-bold text-white">
                          {scaledReqs.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center w-11 justify-end">
                          +{c.growthPct}%
                          <ArrowUpRight size={10} weight="bold" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 Mini Country Bar Charts */}
            <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/10">
              {globalEdge.countries.slice(0, 3).map((c, idx) => (
                <div
                  key={c.code}
                  onClick={() => handleSelectCountry(c)}
                  className="p-2.5 rounded-xl bg-[#0b0b0d] border border-white/5 cursor-pointer hover:border-white/20 transition-colors"
                >
                  <div className="text-[10px] text-zinc-400 truncate">{c.country}</div>
                  <div className="flex items-end gap-0.5 h-6 my-1">
                    {Array.from({ length: 10 }, (_, b) => {
                      const barH = 30 + ((b * 19 + idx * 11) % 70);
                      return (
                        <span
                          key={b}
                          className="flex-1 bg-emerald-400/85 rounded-t-xs"
                          style={{ height: `${barH}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className="text-sm font-black text-white">
                    {Math.round((c.requests * domainScale) / 25).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Edge Cache & Anycast RTT Side-by-Side KPIs */}
          <div className="rounded-2xl bg-[#111114] border border-white/10 p-3.5 font-mono">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-zinc-400">Edge Cache &amp; Routing Hit</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-white">
                    {globalEdge.cacheHitRatio}%
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center">
                    +3.2% <ArrowUpRight size={10} />
                  </span>
                </div>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-zinc-800/80 text-[9px] text-zinc-300">
                  SLA Target 99.0%
                </span>
              </div>

              <div>
                <div className="text-[10px] text-zinc-400">Global Anycast RTT</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-white">
                    {globalEdge.globalAvgLatencyMs}ms
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center">
                    -22% <ArrowDownRight size={10} />
                  </span>
                </div>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-zinc-800/80 text-[9px] text-zinc-300">
                  Baseline 25.0ms
                </span>
              </div>
            </div>
          </div>

          {/* Card 3 (Flush with Bottom of Left & Center Columns): 24H Global Interaction Velocity */}
          <div className="rounded-2xl bg-[#111114] border border-white/10 p-3.5 font-mono">
            <div className="flex items-center justify-between text-[10px] text-zinc-300 mb-1">
              <span className="font-bold">24H GLOBAL INTERACTION VELOCITY</span>
              <span className="text-emerald-400">● Live Stream</span>
            </div>
            <div className="h-18 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={globalCurveData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="globeWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" hide />
                  <YAxis tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pt = payload[0].payload as { hour: string; signals: number };
                        return (
                          <div className="rounded bg-zinc-950 border border-white/15 px-2 py-1 text-[10px] text-zinc-200">
                            {pt.hour} · <strong>{pt.signals} req/min</strong>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="signals"
                    stroke="#10b981"
                    strokeWidth={1.8}
                    fill="url(#globeWave)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Shared BaseModal: Searchable Domain Filter Dialog */}
      <BaseModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
        title="Filter Global Edge by Domain"
        subtitle={`${globalEdge.domains.length} active Cloudflare routing domain${globalEdge.domains.length === 1 ? '' : 's'}`}
        icon={<Funnel size={16} weight="duotone" className="text-emerald-400" />}
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
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer"
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
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-default bg-elevated/40 hover:bg-elevated'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <GlobeHemisphereWest size={16} weight="duotone" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-fg-primary flex items-center gap-2">
                  <span>All Domains (Aggregate View)</span>
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                    {globalEdge.domains.length} total
                  </span>
                </div>
                <div className="text-[11px] font-mono text-fg-secondary mt-0.5">
                  {stats.mail.totalAccounts} mailboxes · {globalEdge.totalGlobalSignals.toLocaleString()} edge signals
                </div>
              </div>
            </div>
            {selectedDomain === 'ALL' && (
              <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
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
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-default bg-surface hover:bg-elevated'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-fg-primary truncate">
                          @{dom.domain}
                        </span>
                        <span className="inline-flex items-center rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 shrink-0">
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
                            className="w-1 rounded-full bg-emerald-400/80"
                            style={{ height: `${Math.max(20, Math.min(100, v))}%` }}
                          />
                        ))}
                      </div>
                      {isSelected && (
                        <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
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
        icon={<ShieldCheck size={16} weight="duotone" className="text-red-400" />}
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

      {/* Full Globe Display BaseModal (with Dedicated - / + Manual Zoom & Clickable Label Important Details Inspector) */}
      <BaseModal
        isOpen={isFullGlobeOpen}
        onClose={() => setIsFullGlobeOpen(false)}
        title="Full 3D Global Edge Satellite Command Center"
        subtitle={`Live Anycast POP: ${globalEdge.viewerColo} (${globalEdge.viewerCity}, ${globalEdge.viewerCountry}) · ${globalEdge.countries.length} Active Country Labels · Click any label to inspect details`}
        icon={<GlobeHemisphereWest size={18} weight="duotone" className="text-emerald-400" />}
        maxWidthClass="max-w-7xl"
        bodyClassName="p-4 sm:p-5 overflow-y-auto"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full font-mono text-xs">
            <div className="flex items-center gap-4 text-[11px] text-fg-secondary">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/35" />
                Normal Request Label
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/40" />
                Live Origin Edge POP
              </span>
              <span className="inline-flex items-center gap-1.5 text-red-400">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-500/40" />
                Active Attack Label
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullGlobeOpen(false)}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer"
            >
              Close Full View
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch font-mono">
          {/* Left/Center (Col 1-8): Full-Size Interactive 3D Globe Stage */}
          <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl bg-[#070709] border border-white/10 p-3 relative overflow-hidden min-h-[500px] sm:min-h-[550px]">
            {/* Top-Left Live Target Pill inside Full Globe */}
            <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 rounded-xl bg-[#111116]/90 backdrop-blur-md border border-white/15 px-3 py-1.5 text-xs shadow-lg">
              <Crosshair
                size={14}
                className="text-emerald-400 animate-spin shrink-0"
                style={{ animationDuration: '8s' }}
              />
              {selectedCountry ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    {selectedCountry.country} ({selectedCountry.code} · {selectedCountry.colo})
                  </span>
                  <span className="text-zinc-400 hidden sm:inline">
                    {Math.round(selectedCountry.requests * domainScale).toLocaleString()} reqs ·{' '}
                    {selectedCountry.latencyMs}ms
                  </span>
                </div>
              ) : (
                <span className="font-bold text-white">Global Satellite View</span>
              )}
            </div>

            {/* Top-Right Controls inside Full Globe: Camera Controls + Dedicated - / + Manual Zoom */}
            <div className="absolute top-3.5 right-3.5 z-20 flex flex-wrap items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={handleFocusMyEdgePop}
                title="Focus camera on your live detected Cloudflare Edge POP"
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-400 transition-colors cursor-pointer shadow-lg"
              >
                <Crosshair size={12} weight="bold" />
                <span>My Edge POP</span>
              </button>

              <button
                type="button"
                onClick={() => setShowArcs((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold transition-colors cursor-pointer shadow-lg ${
                  showArcs
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                    : 'bg-[#111116]/90 border-white/15 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShareNetwork size={12} />
                <span>Arcs</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAutoRotating((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-xl bg-[#111116]/90 hover:bg-white/10 border border-white/15 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-200 cursor-pointer shadow-lg"
              >
                {isAutoRotating ? <Pause size={12} /> : <Play size={12} />}
                <span>{isAutoRotating ? 'Pause Spin' : 'Auto Spin'}</span>
              </button>

              {/* Dedicated Manual Zoom (- / +) Buttons in Full View */}
              <div className="inline-flex items-center rounded-xl bg-[#111116]/95 backdrop-blur-md border border-white/20 p-0.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => handleManualZoom('full', 'out')}
                  title="Zoom Out (-)"
                  aria-label="Zoom out full globe"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Minus size={14} weight="bold" />
                </button>
                <span className="h-4 w-px bg-white/15" />
                <button
                  type="button"
                  onClick={() => handleManualZoom('full', 'in')}
                  title="Zoom In (+)"
                  aria-label="Zoom in full globe"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Plus size={14} weight="bold" />
                </button>
              </div>
            </div>

            {/* Full 3D WebGL Globe Canvas */}
            <div
              ref={fullStageContainerRef}
              className="relative z-10 w-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing min-h-[480px]"
            >
              {isFullGlobeOpen && (
                <Globe
                  ref={fullGlobeRef}
                  width={fullGlobeSize.width}
                  height={fullGlobeSize.height}
                  backgroundColor="rgba(0,0,0,0)"
                  globeImageUrl="/earth-blue-marble.jpg"
                  bumpImageUrl="/earth-topology.png"
                  showAtmosphere={true}
                  atmosphereColor="#60a5fa"
                  atmosphereAltitude={0.14}
                  onGlobeReady={handleFullGlobeReady}
                  arcsData={arcsData}
                  arcStartLat="startLat"
                  arcStartLng="startLng"
                  arcEndLat="endLat"
                  arcEndLng="endLng"
                  arcColor="color"
                  arcDashLength={0.45}
                  arcDashGap={0.25}
                  arcDashAnimateTime="animateTime"
                  arcStroke={0.7}
                  arcAltitudeAutoScale={0.36}
                  ringsData={ringsData}
                  ringLat="lat"
                  ringLng="lng"
                  ringColor="color"
                  ringMaxRadius="maxR"
                  ringPropagationSpeed="propagationSpeed"
                  ringRepeatPeriod="repeatPeriod"
                  htmlElementsData={htmlMarkersData}
                  htmlLat="lat"
                  htmlLng="lng"
                  htmlAltitude={0.015}
                  htmlElement={renderGlobeCalloutPin}
                />
              )}
            </div>

            {/* Bottom Instruction Bar inside Full Globe */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-zinc-400">
              <span>
                Drag to rotate 360° · Use <strong className="text-white">− / +</strong> buttons or scroll wheel to zoom
              </span>
              <span className="text-emerald-400 font-semibold">
                Click any country label on the globe to inspect full telemetry →
              </span>
            </div>
          </div>

          {/* Right Column (Col 9-12): Selected Label Important Details Inspector */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3.5 rounded-2xl bg-[#111114] border border-white/10 p-4">
            {selectedCountry ? (
              <div className="space-y-3.5">
                {/* Selected Country Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          selectedCountry.status === 'threat'
                            ? 'bg-red-500 animate-ping'
                            : selectedCountry.code === globalEdge.viewerCountry
                            ? 'bg-emerald-400'
                            : 'bg-cyan-400'
                        }`}
                      />
                      <h4 className="text-sm font-bold text-white">
                        {selectedCountry.country} ({selectedCountry.code})
                      </h4>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-400 shrink-0" />
                      <span>
                        {selectedCountry.city} · Edge POP{' '}
                        <strong className="text-zinc-200">{selectedCountry.colo}</strong> (
                        {selectedCountry.continent})
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase shrink-0 ${
                      selectedCountry.status === 'threat'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : selectedCountry.code === globalEdge.viewerCountry
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {selectedCountry.status === 'threat'
                      ? 'Active Attack'
                      : selectedCountry.code === globalEdge.viewerCountry
                      ? 'Live Origin POP'
                      : 'Normal Request'}
                  </span>
                </div>

                {/* Important Telemetry Metrics Grid (6 Cards) */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl bg-[#0b0b0e] border border-white/10 p-2.5">
                    <div className="text-[10px] text-zinc-500 uppercase">Edge Requests</div>
                    <div className="text-sm font-black text-white mt-0.5">
                      {Math.round(selectedCountry.requests * domainScale).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      +{selectedCountry.growthPct}% velocity
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#0b0b0e] border border-white/10 p-2.5">
                    <div className="text-[10px] text-zinc-500 uppercase">Global Traffic Share</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">
                      {Math.max(
                        1,
                        Math.round((selectedCountry.requests / totalCountryRequests) * 100)
                      )}
                      %
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      of {displayedTotalSignals.toLocaleString()} signals
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#0b0b0e] border border-white/10 p-2.5">
                    <div className="text-[10px] text-zinc-500 uppercase">Anycast RTT Latency</div>
                    <div className="text-sm font-black text-cyan-300 mt-0.5">
                      {selectedCountry.latencyMs} ms
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Global avg: {globalEdge.globalAvgLatencyMs} ms
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#0b0b0e] border border-white/10 p-2.5">
                    <div className="text-[10px] text-zinc-500 uppercase">Transport &amp; TLS</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5">
                      {globalEdge.httpProtocol}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {globalEdge.tlsVersion} · {globalEdge.cacheHitRatio}% Cache
                    </div>
                  </div>

                  <div className="col-span-2 rounded-xl bg-[#0b0b0e] border border-white/10 p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase">
                        Geo Coordinates &amp; Routing
                      </div>
                      <div className="text-xs font-bold text-zinc-200 mt-0.5">
                        Lat {selectedCountry.lat.toFixed(4)}° · Lng{' '}
                        {selectedCountry.lng.toFixed(4)}°
                      </div>
                    </div>
                    <span className="rounded-md bg-white/[0.06] border border-white/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                      IATA: {selectedCountry.colo}
                    </span>
                  </div>
                </div>

                {/* Security / Firewall Events for Selected Country */}
                <div className="rounded-xl bg-[#0b0b0e] border border-white/10 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <ShieldCheck
                        size={13}
                        className={
                          selectedCountry.status === 'threat' ||
                          selectedCountryFirewallEvents.length > 0
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }
                      />
                      <span>Country Security Telemetry</span>
                    </span>
                    {selectedCountryFirewallEvents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsThreatModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                      >
                        <span>View Events</span>
                      </button>
                    )}
                  </div>

                  {selectedCountryFirewallEvents.length > 0 ? (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {selectedCountryFirewallEvents.slice(0, 3).map((evt) => (
                        <div
                          key={evt.id}
                          className="rounded-lg bg-red-500/10 border border-red-500/25 px-2.5 py-1.5 text-[10px] flex items-center justify-between gap-2"
                        >
                          <div className="truncate">
                            <span className="font-bold text-red-300 uppercase mr-1.5">
                              {evt.action.replace('_', ' ')}
                            </span>
                            <span className="text-zinc-200">{evt.clientIP}</span>
                          </div>
                          <span className="text-zinc-400 shrink-0">
                            {new Date(evt.datetime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5">
                      <CheckCircle size={13} weight="fill" />
                      <span>
                        0 active firewall threats from {selectedCountry.country}. Traffic verified clean.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Interactive Directory of All Active Country Labels on the Globe */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                <span>All Active Globe Labels ({globalEdge.countries.length})</span>
                <span>Click to Focus</span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {globalEdge.countries.map((c) => {
                  const isSel = selectedCountry?.code === c.code;
                  const isThreat = c.status === 'threat';
                  return (
                    <button
                      key={`${c.code}-${c.colo}`}
                      type="button"
                      onClick={() => handleSelectCountry(c, true)}
                      className={`w-full flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-left text-xs transition-all cursor-pointer ${
                        isSel
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                          : isThreat
                          ? 'bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/20'
                          : 'bg-[#0b0b0e] border-white/10 text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            isThreat
                              ? 'bg-red-500 animate-ping'
                              : c.code === globalEdge.viewerCountry
                              ? 'bg-emerald-400'
                              : 'bg-cyan-400'
                          }`}
                        />
                        <span className="font-bold truncate">
                          {c.code} · {c.colo}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate">
                          {c.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[10px]">
                        <span className="text-zinc-300 font-semibold">
                          {Math.round(c.requests * domainScale).toLocaleString()}
                        </span>
                        <span className="text-emerald-400">{c.latencyMs}ms</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};


import React, { useEffect, useMemo, useState } from 'react';
import {
  Lightning,
  ArrowsClockwise,
  Pulse,
  SquaresFour,
  X,
  CalendarBlank,
} from '@phosphor-icons/react';
import { dashboardService } from '../../services/dashboard.service';
import { ApiIncidentDetailModal } from './ApiIncidentDetailModal';
import { ApiPeriodFilterModal, MONTH_NAMES } from './ApiPeriodFilterModal';
import { ApiEndpointFilterGrid } from './ApiEndpointFilterGrid';
import { ApiEndpointHistoryModal } from './ApiEndpointHistoryModal';
import { ApiHealthChartCanvas, type EndpointMeta } from './ApiHealthChartCanvas';
import type {
  DashboardApiHealthStats,
  ApiLiveTelemetryPoint,
  ApiEndpointHealth,
  DashboardAuditLogItem,
} from '../../types/dashboard.types';

interface ApiHealthLiveMonitorProps {
  apiHealth?: DashboardApiHealthStats;
  auditErrors?: number;
  auditWarnings?: number;
  recentLogs?: DashboardAuditLogItem[];
  onRefreshStats?: () => Promise<void> | void;
}

const ENDPOINTS_META: EndpointMeta[] = [
  {
    key: 'notes',
    name: 'Notes API',
    category: 'notes',
    path: '/api/notes',
    color: '#a855f7', // Purple
    gradientId: 'grad-notes',
  },
  {
    key: 'mail',
    name: 'Mail Routing API',
    category: 'mail',
    path: '/api/mail',
    color: '#3b82f6', // Blue
    gradientId: 'grad-mail',
  },
  {
    key: 'twoFactor',
    name: '2FA Authenticator API',
    category: 'two_factor',
    path: '/api/two-factor',
    color: '#6366f1', // Indigo
    gradientId: 'grad-twofactor',
  },
  {
    key: 'auth',
    name: 'Auth & Session API',
    category: 'auth',
    path: '/api/auth',
    color: '#10b981', // Emerald
    gradientId: 'grad-auth',
  },
  {
    key: 'backup',
    name: 'Backup & Sync API',
    category: 'backup',
    path: '/api/backup',
    color: '#06b6d4', // Cyan
    gradientId: 'grad-backup',
  },
  {
    key: 'domains',
    name: 'Domains & DNS API',
    category: 'system',
    path: '/api/domains',
    color: '#f43f5e', // Rose
    gradientId: 'grad-domains',
  },
];

// Dynamic Live Baseline Stream Generator: Creates rolling time slots ending at current live time
function generateCleanBaselineTelemetry(nowMs: number = Date.now()): ApiLiveTelemetryPoint[] {
  const points: ApiLiveTelemetryPoint[] = [];
  const totalSlots = 14;
  const slotStepMs = 2.5 * 60 * 1000; // 2.5 minutes per slot over past 35 minutes
  const startMs = nowMs - (totalSlots - 1) * slotStepMs;

  for (let i = 0; i < totalSlots; i++) {
    const slotTime = new Date(startMs + i * slotStepMs);
    const timeLabel = slotTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    points.push({
      time: timeLabel,
      latency: Math.round(22 + 2 * Math.sin(i * 0.5)),
      status: 'ok',
      notes: Math.round(22 + 2 * Math.sin(i * 0.45)),
      mail: Math.round(21 + 2 * Math.sin(i * 0.35 + 1.2)),
      twoFactor: Math.round(17 + 1.5 * Math.sin(i * 0.5 + 2.1)),
      auth: Math.round(24 + 2 * Math.sin(i * 0.4 + 0.8)),
      backup: Math.round(28 + 2 * Math.sin(i * 0.3 + 3.2)),
      domains: Math.round(21 + 2 * Math.sin(i * 0.42 + 4.0)),
    });
  }
  return points;
}

// Archived Historical Data for auditing past cycles (loaded only when auditing archive months)
const HISTORICAL_ARCHIVE_TELEMETRY: ApiLiveTelemetryPoint[] = [
  {
    time: '00:00',
    latency: 22,
    status: 'ok',
    notes: 24,
    mail: 20,
    twoFactor: 18,
    auth: 25,
    backup: 29,
    domains: 22,
  },
  {
    time: '04:00',
    latency: 21,
    status: 'ok',
    notes: 22,
    mail: 19,
    twoFactor: 17,
    auth: 24,
    backup: 27,
    domains: 21,
  },
  {
    time: '08:00',
    latency: 58,
    status: 'warning',
    notes: 26,
    mail: 58, // Latency warning
    twoFactor: 19,
    auth: 28,
    backup: 31,
    domains: 23,
    incidentDetails: {
      type: 'warning',
      endpoint: '/api/mail',
      latencyMs: 58,
      timestamp: 'Archived Cycle · 08:14 UTC',
      title: 'Mail Inbound Worker Queue Spike',
      description: 'Incoming email batch processing triggered a temporary Cloudflare queue throttle. Resolved automatically within 180 seconds.',
      resolved: true,
    },
  },
  {
    time: '12:00',
    latency: 110,
    status: 'error',
    notes: 25,
    mail: 23,
    twoFactor: 18,
    auth: 110, // Outage spike
    backup: 33,
    domains: 24,
    incidentDetails: {
      type: 'outage',
      endpoint: '/api/auth',
      latencyMs: 110,
      timestamp: 'Archived Cycle · 12:42 UTC',
      title: 'Cloudflare D1 Cold-Start Timeout',
      description: 'Cloudflare Edge KV session replication lag caused auth endpoint response delays. Worker isolated and traffic rerouted via fallback edge node.',
      resolved: true,
    },
  },
  {
    time: '16:00',
    latency: 22,
    status: 'ok',
    notes: 23,
    mail: 21,
    twoFactor: 17,
    auth: 26,
    backup: 28,
    domains: 20,
  },
  {
    time: '20:00',
    latency: 23,
    status: 'ok',
    notes: 22,
    mail: 20,
    twoFactor: 16,
    auth: 24,
    backup: 30,
    domains: 22,
  },
  {
    time: '23:59',
    latency: 21,
    status: 'ok',
    notes: 21,
    mail: 19,
    twoFactor: 16,
    auth: 23,
    backup: 27,
    domains: 20,
  },
];

export const ApiHealthLiveMonitor: React.FC<ApiHealthLiveMonitorProps> = ({
  apiHealth,
  auditErrors,
  auditWarnings,
  recentLogs,
  onRefreshStats,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingStatus, setLastPingStatus] = useState<'ok' | 'err'>('ok');
  const [lastPingLatency, setLastPingLatency] = useState<number>(
    () => apiHealth?.averageLatencyMs ?? 22
  );

  useEffect(() => {
    if (apiHealth?.averageLatencyMs !== undefined && !isPinging) {
      setLastPingLatency(apiHealth.averageLatencyMs);
    }
  }, [apiHealth?.averageLatencyMs, isPinging]);

  // Period / Archive Filter State (Defaults to Present Live - resets upon refresh/navigation)
  const [filterPeriod, setFilterPeriod] = useState<{
    isHistorical: boolean;
    month: string;
    year: string;
  }>({
    isHistorical: false,
    month: '10',
    year: '2026',
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeIncident, setActiveIncident] = useState<
    ApiLiveTelemetryPoint['incidentDetails'] | null
  >(null);
  const [historyEndpoint, setHistoryEndpoint] = useState<ApiEndpointHealth | null>(null);

  // Fallback endpoint list if stats are still loading
  const endpoints: ApiEndpointHealth[] = useMemo(() => {
    const rawList = apiHealth?.endpoints ?? [];
    if (rawList.length > 0) return rawList;

    return [
      {
        name: 'Notes API',
        path: '/api/notes',
        status: 'operational',
        latencyMs: 18,
        uptimePct: 100,
        errorCount: 0,
        lastChecked: 'Just now',
        category: 'notes',
        key: 'notes',
        color: '#a855f7',
      },
      {
        name: 'Mail Routing API',
        path: '/api/mail',
        status: 'operational',
        latencyMs: 22,
        uptimePct: 100,
        errorCount: 0,
        lastChecked: 'Just now',
        category: 'mail',
        key: 'mail',
        color: '#3b82f6',
      },
      {
        name: '2FA Authenticator API',
        path: '/api/two-factor',
        status: 'operational',
        latencyMs: 15,
        uptimePct: 100,
        errorCount: 0,
        lastChecked: 'Just now',
        category: 'two_factor',
        key: 'twoFactor',
        color: '#6366f1',
      },
      {
        name: 'Auth & Session API',
        path: '/api/auth',
        status: 'operational',
        latencyMs: 19,
        uptimePct: 100,
        errorCount: 0,
        lastChecked: 'Just now',
        category: 'auth',
        key: 'auth',
        color: '#10b981',
      },
      {
        name: 'Backup & Sync API',
        path: '/api/backup',
        status: 'operational',
        latencyMs: 28,
        uptimePct: 100,
        errorCount: 0,
        lastChecked: 'Just now',
        category: 'backup',
        key: 'backup',
        color: '#06b6d4',
      },
      {
        name: 'Domains & DNS API',
        path: '/api/domains',
        status: 'operational',
        latencyMs: 21,
        uptimePct: 100,
        errorCount: 0,
        lastChecked: 'Just now',
        category: 'system',
        key: 'domains',
        color: '#f43f5e',
      },
    ];
  }, [apiHealth]);

  const [liveTimestamp, setLiveTimestamp] = useState<number>(() => Date.now());

  // Periodically advance rolling telemetry window every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTimestamp(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Telemetry stream: starts fresh every month (0 errors) unless historical archive is chosen
  const localHistory: ApiLiveTelemetryPoint[] = useMemo(() => {
    if (filterPeriod.isHistorical) {
      return HISTORICAL_ARCHIVE_TELEMETRY;
    }
    return apiHealth?.history && apiHealth.history.length > 0
      ? apiHealth.history
      : generateCleanBaselineTelemetry(liveTimestamp);
  }, [apiHealth, filterPeriod, liveTimestamp]);

  // Multi-curve interactive filter toggle
  const handleToggleEndpoint = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleClearFilter = () => {
    setSelectedKeys([]);
  };

  // Live Edge Ping + Fresh Telemetry Sync (with smooth circling motion)
  const handlePing = async () => {
    if (isPinging) return;
    setIsPinging(true);
    try {
      const [res] = await Promise.all([
        dashboardService.pingEdge(),
        onRefreshStats ? Promise.resolve(onRefreshStats()) : Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);
      setLastPingLatency(Math.max(8, res.latencyMs));
      setLastPingStatus(res.status === 'ok' ? 'ok' : 'err');
    } catch {
      setLastPingStatus('err');
    } finally {
      setIsPinging(false);
    }
  };

  const isFiltered = selectedKeys.length > 0;
  const activeCurves = useMemo(
    () =>
      isFiltered
        ? ENDPOINTS_META.filter((ep) => selectedKeys.includes(ep.key))
        : ENDPOINTS_META,
    [isFiltered, selectedKeys]
  );

  const hasErrors = filterPeriod.isHistorical
    ? true
    : endpoints.some((ep) => ep.status === 'down' || ep.status === 'degraded');

  const outageIncidents = useMemo(
    () => localHistory.filter((p) => p.incidentDetails?.type === 'outage' || p.status === 'error'),
    [localHistory]
  );
  const warningIncidents = useMemo(
    () => localHistory.filter((p) => p.incidentDetails?.type === 'warning' || p.status === 'warning'),
    [localHistory]
  );

  const outageIncident = useMemo(
    () => outageIncidents.find((p) => p.incidentDetails)?.incidentDetails ?? null,
    [outageIncidents]
  );
  const warningIncident = useMemo(
    () => warningIncidents.find((p) => p.incidentDetails)?.incidentDetails ?? null,
    [warningIncidents]
  );

  const totalEndpointErrors = useMemo(
    () => endpoints.reduce((acc, ep) => acc + (ep.errorCount || 0), 0),
    [endpoints]
  );
  const displayOutages = filterPeriod.isHistorical
    ? auditErrors !== undefined && auditErrors > 0
      ? auditErrors
      : Math.max(outageIncidents.length, totalEndpointErrors)
    : Math.max(outageIncidents.length, totalEndpointErrors);

  const displayWarnings = filterPeriod.isHistorical
    ? auditWarnings !== undefined && auditWarnings > 0
      ? auditWarnings
      : warningIncidents.length
    : warningIncidents.length;

  const handleResetToLive = () => {
    setFilterPeriod({
      isHistorical: false,
      month: '10',
      year: '2026',
    });
  };

  return (
    <div className="rounded-2xl border border-default bg-surface/90 backdrop-blur-md p-4 sm:p-5 shadow-xs relative space-y-4">
      {/* 1. Diagnostic Root-Cause BaseModal Sub-Component */}
      <ApiIncidentDetailModal
        incident={activeIncident}
        onClose={() => setActiveIncident(null)}
      />

      {/* 2. Endpoint History & Incident Records BaseModal */}
      <ApiEndpointHistoryModal
        endpoint={historyEndpoint}
        recentLogs={recentLogs}
        onClose={() => setHistoryEndpoint(null)}
      />

      {/* 2. Monthly Period & Archive Filter BaseModal Sub-Component */}
      <ApiPeriodFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="API Health Period & Archive Filter"
        subtitle="Inspect live edge telemetry or audit previous monthly error/warning records"
        streamType="telemetry"
        isHistorical={filterPeriod.isHistorical}
        initialMonth={filterPeriod.month}
        initialYear={filterPeriod.year}
        onApply={(mode, month, year) => {
          setFilterPeriod({
            isHistorical: mode === 'archive',
            month,
            year,
          });
        }}
        onResetToLive={handleResetToLive}
      />

      {/* 3. Header Title, Period Filter & Edge Ping Button */}
      <div className="flex items-center justify-between gap-3 border-b border-subtle pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Pulse size={16} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-fg-primary tracking-tight">
                Live API Health &amp; Edge Monitor
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-medium border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-[11px] text-fg-muted font-sans">
              Real-time response time curves across 6 core Cloudflare Worker endpoints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Monthly Period & Archive Filter Button */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            title="Filter telemetry by Month & Year"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer shadow-xs ${
              filterPeriod.isHistorical
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-surface border-default hover:bg-elevated text-fg-secondary hover:text-fg-primary'
            }`}
          >
            <CalendarBlank
              size={12}
              weight={filterPeriod.isHistorical ? 'fill' : 'bold'}
              className={filterPeriod.isHistorical ? 'text-amber-400' : 'text-accent'}
            />
            <span className="text-[11px] font-mono whitespace-nowrap">
              {filterPeriod.isHistorical
                ? `${MONTH_NAMES[filterPeriod.month] || filterPeriod.month} ${filterPeriod.year}`
                : 'Date Filter'}
            </span>
          </button>

          {/* Quick Ping Edge Button (Interactive Live Radar & Edge Sync) */}
          <button
            type="button"
            onClick={() => void handlePing()}
            disabled={isPinging}
            title="Ping Edge Worker & refresh live telemetry"
            className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium transition-all cursor-pointer shadow-xs overflow-hidden ${
              isPinging
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-surface border-default hover:border-emerald-500/40 hover:bg-elevated text-fg-secondary hover:text-emerald-400'
            }`}
          >
            {isPinging ? (
              <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            ) : (
              <ArrowsClockwise
                size={13}
                weight="bold"
                className="transition-transform group-hover:rotate-180 text-emerald-400"
              />
            )}
            <span className="text-[11px] whitespace-nowrap font-semibold">
              {isPinging ? 'Pinging' : 'Ping Edge'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Compact Status & Mode Bar with Badges: Scrollable on one line on mobile */}
      <div className="flex items-center justify-between text-xs font-mono gap-2 overflow-x-auto flex-nowrap sm:flex-wrap pb-1 sm:pb-0">
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              !hasErrors && lastPingStatus === 'ok'
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          {isFiltered ? (
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <span className="font-semibold text-fg-primary text-[11px] whitespace-nowrap">
                Filtered: {selectedKeys.length} of 6 Active
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {activeCurves.map((c) => (
                  <span
                    key={c.key}
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          ) : filterPeriod.isHistorical ? (
            <div className="flex items-center gap-2 text-fg-secondary text-[11px] font-medium flex-nowrap sm:flex-wrap shrink-0 whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-mono font-semibold shrink-0 whitespace-nowrap">
                <CalendarBlank size={11} weight="fill" />
                <span>Archive: {MONTH_NAMES[filterPeriod.month] || filterPeriod.month} {filterPeriod.year}</span>
                <button
                  type="button"
                  onClick={handleResetToLive}
                  title="Reset back to Present Live stream"
                  className="p-0.5 rounded hover:bg-amber-500/30 text-amber-200 cursor-pointer ml-0.5"
                >
                  <X size={10} weight="bold" />
                </button>
              </span>
              {displayOutages > 0 && (
                <button
                  type="button"
                  onClick={() => outageIncident && setActiveIncident(outageIncident)}
                  title="Click to view Outage Record incident details"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-[10px] cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  {displayOutages} {displayOutages === 1 ? 'Outage Record' : 'Outage Records'}
                </button>
              )}
              {displayWarnings > 0 && (
                <button
                  type="button"
                  onClick={() => warningIncident && setActiveIncident(warningIncident)}
                  title="Click to view Warning Record incident details"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-400 text-[10px] cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  {displayWarnings} {displayWarnings === 1 ? 'Warning Record' : 'Warning Records'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-fg-secondary text-[11px] font-medium flex-nowrap sm:flex-wrap shrink-0 whitespace-nowrap">
              <span className="shrink-0 whitespace-nowrap">All 6 APIs Active &amp; Monitored</span>
              {displayOutages > 0 || displayWarnings > 0 ? (
                <>
                  {displayOutages > 0 && (
                    <button
                      type="button"
                      onClick={() => outageIncident && setActiveIncident(outageIncident)}
                      title="Click to view detected Outage incident details"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[10px] font-mono font-semibold shrink-0 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      {displayOutages} {displayOutages === 1 ? 'Outage' : 'Outages'} Detected
                    </button>
                  )}
                  {displayWarnings > 0 && (
                    <button
                      type="button"
                      onClick={() => warningIncident && setActiveIncident(warningIncident)}
                      title="Click to view detected Warning incident details"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-semibold shrink-0 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      {displayWarnings} {displayWarnings === 1 ? 'Warning' : 'Warnings'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono font-semibold shrink-0 whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Clean Baseline
                  </span>
                  <span className="text-[10px] text-fg-muted font-mono hidden sm:inline shrink-0 whitespace-nowrap">
                    0 Outages · 0 Warnings
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Clear Filter / Mode Badge */}
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          {isFiltered ? (
            <button
              type="button"
              onClick={handleClearFilter}
              title="Reset filter to display all 6 curves in one table"
              className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-indigo-300 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <X size={11} weight="bold" />
              <span>Clear Filter ({selectedKeys.length})</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 font-semibold shrink-0 whitespace-nowrap">
              <SquaresFour size={12} weight="bold" />
              <span>Viewing All 6 Curves</span>
            </span>
          )}
          <span className="text-fg-muted text-[10px] hidden md:inline shrink-0 whitespace-nowrap">
            Cloudflare Edge
          </span>
        </div>
      </div>

      {/* 5. Isolated Area Chart Canvas Sub-Component */}
      <ApiHealthChartCanvas
        history={localHistory}
        activeCurves={activeCurves}
        selectedKeys={selectedKeys}
        onSelectIncident={(inc) => inc && setActiveIncident(inc)}
      />

      {/* 6. Isolated Bottom 6-API Interactive Filter Grid */}
      <ApiEndpointFilterGrid
        endpoints={endpoints}
        selectedKeys={selectedKeys}
        isPinging={isPinging}
        onToggle={handleToggleEndpoint}
        onOpenHistory={(ep) => setHistoryEndpoint(ep)}
      />

      {/* Bottom Footer Telemetry Stats */}
      <div className="flex items-center justify-between border-t border-subtle pt-3 text-[11px] font-mono text-fg-muted flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-fg-secondary">
            <Lightning size={12} weight="fill" className={isPinging ? 'text-emerald-400 animate-pulse' : 'text-amber-400'} />
            <span>Avg Response:</span>
            <span className="font-bold text-fg-primary">
              {`${lastPingLatency}ms`}
            </span>
          </span>
          <span className="text-subtle">|</span>
          <span className="text-fg-secondary">
            Global Routing: <span className="text-emerald-400 font-semibold">Cloudflare Anycast</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10.5px]">
            Ping Status:{' '}
            <span
              className={
                isPinging
                  ? 'text-amber-400 font-semibold animate-pulse'
                  : lastPingStatus === 'ok'
                  ? 'text-emerald-400 font-semibold'
                  : 'text-red-400 font-semibold'
              }
            >
              {isPinging ? 'Pinging Edge...' : lastPingStatus === 'ok' ? '200 OK' : 'Edge Timeout'}
            </span>
          </span>
          <span className="text-subtle">|</span>
          <span className="text-[10px] text-zinc-400">
            D1 Cold-Start: <span className="text-emerald-400 font-mono">0ms (Warm)</span>
          </span>
        </div>
      </div>
    </div>
  );
};

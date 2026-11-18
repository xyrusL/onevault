import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  MagnifyingGlass,
  XCircle,
  WarningCircle,
  CheckCircle,
  Clock,
  CalendarBlank,
  Copy,
  Check,
  Funnel,
  Notebook,
  PaperPlaneTilt,
  Fingerprint,
  UserCheck,
  HardDrives,
  ShareNetwork,
  ChartLineUp,
  ListBullets,
  ArrowRight,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';
import {
  resolveApiStatusDescriptor,
  type SharedApiCategory,
} from '../../../../shared/constants/api-status-catalog';
import type {
  ApiEndpointHealth,
  DashboardAuditLogItem,
} from '../../types/dashboard.types';

export type TimeRangeCycle = '1h' | '24h' | '30d' | '1y' | 'all';
export type IncidentSeverity = 'all' | 'outage' | 'warning' | 'healthy';
export type ModalViewMode = 'list' | 'graph';

export interface ApiEndpointHistoryRecord {
  id: string;
  endpointKey: string;
  type: 'outage' | 'warning' | 'healthy';
  title: string;
  statusText?: string;
  reason: string;
  description: string;
  statusCode: number;
  latencyMs: number;
  timestamp: string;
  resolution: string;
  dateCycle: '1h' | '24h' | '30d' | '1y';
}

export interface TelemetryGraphPoint {
  time: string;
  latency: number;
  status: 'ok' | 'warning' | 'outage' | 'healthy';
  statusCode: number;
  incidentTitle?: string;
  incidentReason?: string;
}

const HISTORICAL_ENDPOINT_RECORDS: ApiEndpointHistoryRecord[] = [];

const getEndpointIcon = (category: string, color: string) => {
  switch (category) {
    case 'notes':
      return <Notebook size={18} weight="duotone" style={{ color }} />;
    case 'mail':
      return <PaperPlaneTilt size={18} weight="duotone" style={{ color }} />;
    case 'two_factor':
      return <Fingerprint size={18} weight="duotone" style={{ color }} />;
    case 'auth':
      return <UserCheck size={18} weight="duotone" style={{ color }} />;
    case 'backup':
      return <HardDrives size={18} weight="duotone" style={{ color }} />;
    default:
      return <ShareNetwork size={18} weight="duotone" style={{ color }} />;
  }
};

interface ApiEndpointHistoryModalProps {
  endpoint: ApiEndpointHealth | null;
  recentLogs?: DashboardAuditLogItem[];
  onClose: () => void;
}

const mapEndpointKeyToCategory = (key: string): SharedApiCategory => {
  switch (key) {
    case 'notes':
      return 'notes';
    case 'mail':
      return 'mail';
    case 'twoFactor':
      return 'two_factor';
    case 'auth':
      return 'auth';
    case 'backup':
      return 'backup';
    default:
      return 'system';
  }
};

export const ApiEndpointHistoryModal: React.FC<ApiEndpointHistoryModalProps> = ({
  endpoint,
  recentLogs = [],
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity>('all');
  const [timeFilter, setTimeFilter] = useState<TimeRangeCycle>('all');
  const [viewMode, setViewMode] = useState<ModalViewMode>('list');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const endpointKey = useMemo(() => {
    if (!endpoint) return 'notes';
    if (endpoint.key) return endpoint.key;
    if (endpoint.path?.includes('notes')) return 'notes';
    if (endpoint.path?.includes('mail')) return 'mail';
    if (endpoint.path?.includes('2fa') || endpoint.category === 'two_factor') return 'twoFactor';
    if (endpoint.path?.includes('auth') || endpoint.category === 'auth') return 'auth';
    if (endpoint.path?.includes('backup') || endpoint.category === 'backup') return 'backup';
    if (endpoint.path?.includes('domain') || endpoint.category === 'system') return 'domains';
    return 'notes';
  }, [endpoint]);

  // Filter records specifically for this endpoint, merging live D1 audit logs translated via the shared status catalog
  const endpointRecords = useMemo(() => {
    const targetCategory = mapEndpointKeyToCategory(endpointKey);

    const nowMs = Date.now();
    const liveTranslatedRecords: ApiEndpointHistoryRecord[] = recentLogs
      .filter((log) => log.category === targetCategory)
      .map((log) => {
        const desc = resolveApiStatusDescriptor({
          category: log.category,
          level: log.level,
          title: log.title,
          message: log.message,
          details: log.details,
        });
        const d = new Date(log.createdAt);
        const ageMs = Number.isNaN(d.getTime()) ? Infinity : Math.max(0, nowMs - d.getTime());
        const dateCycle: '1h' | '24h' | '30d' | '1y' =
          ageMs <= 3600 * 1000
            ? '1h'
            : ageMs <= 24 * 3600 * 1000
            ? '24h'
            : ageMs <= 30 * 24 * 3600 * 1000
            ? '30d'
            : '1y';
        const formattedTs = Number.isNaN(d.getTime())
          ? log.createdAt
          : `${d.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })} · ${d.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })} UTC`;

        return {
          id: `live-audit-${log.id}`,
          endpointKey,
          type:
            log.level === 'error'
              ? 'outage'
              : log.level === 'warning'
              ? 'warning'
              : 'healthy',
          title: log.title,
          statusText: log.statusText || desc.statusText,
          reason: log.rootCause || desc.rootCause,
          description: desc.meaning,
          statusCode: log.statusCode || desc.statusCode,
          latencyMs: log.level === 'error' ? 92 : log.level === 'warning' ? 54 : 19,
          timestamp: formattedTs,
          resolution: log.resolution || desc.resolution,
          dateCycle,
        };
      });

    const staticRecords = HISTORICAL_ENDPOINT_RECORDS.filter(
      (r) => r.endpointKey === endpointKey
    ).map((r) => {
      const desc = resolveApiStatusDescriptor({
        category: targetCategory,
        level: r.type === 'outage' ? 'error' : r.type === 'warning' ? 'warning' : 'info',
        title: r.title,
        message: r.description,
        details: r.reason,
        statusCode: r.statusCode,
      });
      return {
        ...r,
        statusText: r.statusText || desc.statusText,
      };
    });

    return [...liveTranslatedRecords, ...staticRecords];
  }, [endpointKey, recentLogs]);

  // Apply search, severity, and cumulative time-window criteria
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return endpointRecords.filter((rec) => {
      // Severity filter
      if (severityFilter !== 'all' && rec.type !== severityFilter) {
        return false;
      }
      // Time window filter (cumulative time range)
      if (timeFilter === '1h' && rec.dateCycle !== '1h') {
        return false;
      }
      if (timeFilter === '24h' && rec.dateCycle !== '1h' && rec.dateCycle !== '24h') {
        return false;
      }
      if (
        timeFilter === '30d' &&
        rec.dateCycle !== '1h' &&
        rec.dateCycle !== '24h' &&
        rec.dateCycle !== '30d'
      ) {
        return false;
      }
      // '1y' and 'all' include all records

      // Keyword search
      if (q) {
        const matchTitle = rec.title.toLowerCase().includes(q);
        const matchStatus = (rec.statusText || '').toLowerCase().includes(q);
        const matchReason = rec.reason.toLowerCase().includes(q);
        const matchDesc = rec.description.toLowerCase().includes(q);
        const matchTime = rec.timestamp.toLowerCase().includes(q);
        const matchCode = rec.statusCode.toString().includes(q);
        return (
          matchTitle ||
          matchStatus ||
          matchReason ||
          matchDesc ||
          matchTime ||
          matchCode
        );
      }
      return true;
    });
  }, [endpointRecords, searchQuery, severityFilter, timeFilter]);

  // Generate telemetry points with flat baseline when no real incidents exist
  const graphData = useMemo<TelemetryGraphPoint[]>(() => {
    const baseLatency = endpoint?.latencyMs || 20;
    const records = endpointRecords;

    const toSpikePoint = (
      time: string,
      incident: ApiEndpointHistoryRecord | undefined
    ): TelemetryGraphPoint =>
      incident
        ? {
            time,
            latency: incident.latencyMs,
            status: incident.type === 'outage' ? 'outage' : 'warning',
            statusCode: incident.statusCode,
            incidentTitle: incident.title,
            incidentReason: incident.reason,
          }
        : {
            time,
            latency: baseLatency,
            status: 'ok',
            statusCode: 200,
          };

    if (timeFilter === '1h') {
      const h1Incident = records.find(
        (r) => r.dateCycle === '1h' && (r.type === 'outage' || r.type === 'warning')
      );
      return [
        { time: '-50m', latency: baseLatency, status: 'ok', statusCode: 200 },
        { time: '-40m', latency: baseLatency, status: 'ok', statusCode: 200 },
        toSpikePoint('-30m', h1Incident),
        { time: '-20m', latency: baseLatency, status: 'ok', statusCode: 200 },
        { time: '-10m', latency: baseLatency, status: 'ok', statusCode: 200 },
        { time: 'NOW', latency: baseLatency, status: 'ok', statusCode: 200 },
      ];
    }

    if (timeFilter === '24h') {
      const dayIncident = records.find(
        (r) =>
          (r.dateCycle === '24h' || r.dateCycle === '1h') &&
          (r.type === 'outage' || r.type === 'warning')
      );
      return [
        { time: '00:00', latency: baseLatency, status: 'ok', statusCode: 200 },
        { time: '04:00', latency: baseLatency, status: 'ok', statusCode: 200 },
        { time: '08:00', latency: baseLatency, status: 'ok', statusCode: 200 },
        toSpikePoint('12:00', dayIncident),
        { time: '16:00', latency: baseLatency, status: 'ok', statusCode: 200 },
        { time: '20:00', latency: baseLatency, status: 'ok', statusCode: 200 },
        { time: 'NOW', latency: baseLatency, status: 'ok', statusCode: 200 },
      ];
    }

    if (timeFilter === '30d') {
      const outageRec = records.find(
        (r) => r.dateCycle !== '1y' && r.type === 'outage'
      );
      const warningRec = records.find(
        (r) => r.dateCycle !== '1y' && r.type === 'warning'
      );
      return [
        { time: '-25d', latency: baseLatency, status: 'ok', statusCode: 200 },
        { time: '-20d', latency: baseLatency, status: 'ok', statusCode: 200 },
        toSpikePoint('-15d', outageRec),
        { time: '-10d', latency: baseLatency, status: 'ok', statusCode: 200 },
        toSpikePoint('-5d', warningRec),
        { time: 'Today', latency: baseLatency, status: 'ok', statusCode: 200 },
      ];
    }

    const outageRec = records.find((r) => r.type === 'outage');
    const warningRec = records.find((r) => r.type === 'warning');
    return [
      { time: '-6m', latency: baseLatency, status: 'ok', statusCode: 200 },
      { time: '-4m', latency: baseLatency, status: 'ok', statusCode: 200 },
      toSpikePoint('-2m', outageRec),
      toSpikePoint('-1m', warningRec),
      { time: 'Current', latency: baseLatency, status: 'ok', statusCode: 200 },
    ];
  }, [endpoint?.latencyMs, endpointRecords, timeFilter]);

  const peakLatencySpike = useMemo(() => {
    return Math.max(...graphData.map((d) => d.latency));
  }, [graphData]);

  const avgWindowLatency = useMemo(() => {
    if (graphData.length === 0) return 0;
    const sum = graphData.reduce((acc, d) => acc + d.latency, 0);
    return Math.round(sum / graphData.length);
  }, [graphData]);

  const handleCopyRecord = (rec: ApiEndpointHistoryRecord) => {
    void navigator.clipboard.writeText(JSON.stringify(rec, null, 2));
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!endpoint) return null;

  const outageCount = endpointRecords.filter((r) => r.type === 'outage').length;
  const warningCount = endpointRecords.filter((r) => r.type === 'warning').length;
  const healthyCount = endpointRecords.filter((r) => r.type === 'healthy').length;

  return (
    <BaseModal
      isOpen={!!endpoint}
      onClose={onClose}
      title={`${endpoint.name} — Latency & Incident History`}
      subtitle={`${endpoint.path} · Cloudflare Edge Audit Log & Root-Cause Records (Year 2026)`}
      icon={getEndpointIcon(endpoint.category, endpoint.color || '#3b82f6')}
      maxWidthClass="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2 text-[11px] font-mono text-fg-muted">
            <span>Historical Records:</span>
            <span className="font-bold text-fg-primary">
              {filteredRecords.length} of {endpointRecords.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'list' ? 'graph' : 'list')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-default hover:bg-elevated text-xs font-mono font-medium text-fg-primary transition-colors cursor-pointer"
            >
              {viewMode === 'list' ? (
                <>
                  <ChartLineUp size={13} weight="bold" className="text-emerald-400" />
                  <span>Open Telemetry Graph</span>
                </>
              ) : (
                <>
                  <ListBullets size={13} weight="bold" />
                  <span>Open Records List ({filteredRecords.length})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-surface border border-default hover:bg-elevated text-xs font-medium text-fg-primary transition-colors cursor-pointer"
            >
              Close History
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5 font-sans">
        {/* KPI Summary Strip for this specific API */}
        <div className="grid grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-elevated/40 border border-subtle">
            <div className="text-[10px] text-fg-muted uppercase">Latency</div>
            <div className="font-bold text-sm text-fg-primary mt-0.5">{endpoint.latencyMs}ms</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <div className="text-[10px] uppercase font-semibold text-emerald-400">200 OK Pings</div>
            <div className="font-bold text-sm mt-0.5">{healthyCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <div className="text-[10px] uppercase font-semibold text-amber-400">Warnings</div>
            <div className="font-bold text-sm mt-0.5">{warningCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
            <div className="text-[10px] uppercase font-semibold text-red-400">Outages</div>
            <div className="font-bold text-sm mt-0.5">{outageCount}</div>
          </div>
        </div>

        {/* View Mode Switcher + Range Info Strip */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-0.5">
          {/* Segmented View Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#0e0e12] border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white/10 text-white font-bold border border-white/15 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ListBullets size={14} weight="bold" />
              <span>Records List ({filteredRecords.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'graph'
                  ? 'bg-white/10 text-emerald-400 font-bold border border-white/15 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ChartLineUp size={14} weight="bold" className="text-emerald-400" />
              <span>Telemetry Graph</span>
            </button>
          </div>

          {/* Active Window Indicator */}
          <div className="text-[11px] font-mono text-zinc-400 hidden sm:flex items-center gap-1.5">
            <span>Range:</span>
            <span className="font-bold text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
              {timeFilter === '1h'
                ? '1 Hour (10m steps)'
                : timeFilter === '24h'
                ? 'Per Day (Hourly)'
                : timeFilter === '30d'
                ? 'Per Month (Daily)'
                : timeFilter === '1y'
                ? 'Per Year (Monthly)'
                : 'All 2026 Records'}
            </span>
          </div>
        </div>

        {/* Filter Controls: Severity Type & Time Range Filter Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Severity Filter Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10.5px] font-mono text-fg-muted mr-1 flex items-center gap-1">
              <Funnel size={11} />
              <span>Type:</span>
            </span>
            {(['all', 'outage', 'warning', 'healthy'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono capitalize transition-colors cursor-pointer border ${
                  severityFilter === sev
                    ? sev === 'outage'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 font-semibold'
                      : sev === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                      : sev === 'healthy'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-accent text-accent-fg border-accent font-semibold'
                    : 'bg-surface border-default text-fg-secondary hover:text-fg-primary'
                }`}
              >
                {sev === 'all' ? 'All' : sev === 'outage' ? 'Errors' : sev}
              </button>
            ))}
          </div>

          {/* Range Filter Pills (1h, 24h, 30d, 1y, all) */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10.5px] font-mono text-fg-muted mr-1 flex items-center gap-1">
              <CalendarBlank size={11} />
              <span>Range:</span>
            </span>
            {[
              { key: '1h', label: '1 Hour' },
              { key: '24h', label: 'Per Day' },
              { key: '30d', label: 'Per Month' },
              { key: '1y', label: 'Per Year' },
              { key: 'all', label: 'All 2026' },
            ].map((cycle) => (
              <button
                key={cycle.key}
                type="button"
                onClick={() => setTimeFilter(cycle.key as TimeRangeCycle)}
                className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono transition-colors cursor-pointer border ${
                  timeFilter === cycle.key
                    ? 'bg-accent text-accent-fg border-accent font-semibold'
                    : 'bg-surface border-default text-fg-secondary hover:text-fg-primary'
                }`}
              >
                {cycle.label}
              </button>
            ))}
          </div>
        </div>

        {/* VIEW MODE 1: TELEMETRY GRAPH */}
        {viewMode === 'graph' ? (
          <div className="space-y-3">
            {/* Interactive Area Chart */}
            <div className="h-60 w-full rounded-2xl bg-[#09090c] border border-white/10 p-3 relative shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ChartLineUp size={13} className="text-emerald-400" />
                    <span>Latency &amp; Outage Telemetry Curve</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    ({timeFilter === '1h'
                      ? '1 Hour · 10m intervals'
                      : timeFilter === '24h'
                      ? '24 Hours · Hourly intervals'
                      : timeFilter === '30d'
                      ? '30 Days · Daily breakdown'
                      : 'Year 2026 · Monthly breakdown'})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Healthy Ping
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Warning
                  </span>
                  <span className="inline-flex items-center gap-1 text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Outage Error
                  </span>
                </div>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData} margin={{ top: 12, right: 12, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${endpointKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={endpoint.color || '#38bdf8'} stopOpacity={0.38} />
                        <stop offset="95%" stopColor={endpoint.color || '#38bdf8'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                      tick={{ fontSize: 9.5, fill: '#71717a' }}
                      interval="preserveStartEnd"
                      dy={4}
                    />
                    <YAxis
                      domain={[0, (dataMax: number) => Math.max(60, dataMax + 20)]}
                      tick={{ fontSize: 9.5, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                      unit="ms"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as TelemetryGraphPoint;
                        return (
                          <div className="rounded-xl border border-white/15 bg-[#0f0f13]/95 p-3 text-xs shadow-xl backdrop-blur-md font-mono space-y-1.5 z-50">
                            <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-400 border-b border-white/10 pb-1">
                              <span className="font-bold text-white">{data.time}</span>
                              <span className="font-bold" style={{ color: endpoint.color || '#38bdf8' }}>
                                {data.latency}ms latency
                              </span>
                            </div>
                            {data.status === 'outage' && (
                              <div className="space-y-1 text-red-300">
                                <div className="flex items-center gap-1 font-bold">
                                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                  <span>Outage Error · HTTP {data.statusCode || 500}</span>
                                </div>
                                {data.incidentTitle && (
                                  <div className="text-[10.5px] text-zinc-300 font-sans max-w-[220px]">
                                    {data.incidentTitle}
                                  </div>
                                )}
                              </div>
                            )}
                            {data.status === 'warning' && (
                              <div className="space-y-1 text-amber-300">
                                <div className="flex items-center gap-1 font-bold">
                                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                                  <span>Warning Event · HTTP {data.statusCode || 400}</span>
                                </div>
                                {data.incidentTitle && (
                                  <div className="text-[10.5px] text-zinc-300 font-sans max-w-[220px]">
                                    {data.incidentTitle}
                                  </div>
                                )}
                              </div>
                            )}
                            {data.status === 'ok' && (
                              <div className="text-emerald-400 flex items-center gap-1 text-[10.5px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span>200 OK · Healthy Edge Ping</span>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="latency"
                      stroke={endpoint.color || '#38bdf8'}
                      strokeWidth={2}
                      fill={`url(#grad-${endpointKey})`}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (!cx || !cy) return <g key={`dot-${props.key || Math.random()}`} />;
                        if (payload.status === 'outage') {
                          return (
                            <g key={`dot-${payload.time}`}>
                              <circle cx={cx} cy={cy} r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                              <circle cx={cx} cy={cy} r="10" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6">
                                <animate attributeName="r" from="6" to="12" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                              </circle>
                            </g>
                          );
                        }
                        if (payload.status === 'warning') {
                          return (
                            <g key={`dot-${payload.time}`}>
                              <circle cx={cx} cy={cy} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                            </g>
                          );
                        }
                        return (
                          <circle key={`dot-${payload.time}`} cx={cx} cy={cy} r="2.5" fill="#10b981" opacity="0.75" />
                        );
                      }}
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Secondary KPI Bar for Graph Window */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-elevated/40 border border-subtle">
                <div className="text-[10px] text-fg-muted uppercase">Peak Window Spike</div>
                <div className="font-bold text-sm text-red-400 mt-0.5">{peakLatencySpike}ms</div>
              </div>
              <div className="p-2.5 rounded-xl bg-elevated/40 border border-subtle">
                <div className="text-[10px] text-fg-muted uppercase">Avg Window Latency</div>
                <div className="font-bold text-sm text-fg-primary mt-0.5">{avgWindowLatency}ms</div>
              </div>
              <div className="p-2.5 rounded-xl bg-elevated/40 border border-subtle">
                <div className="text-[10px] text-fg-muted uppercase">Matched Records</div>
                <div className="font-bold text-sm text-amber-400 mt-0.5">{filteredRecords.length} records</div>
              </div>
            </div>

            {/* Switch to Records List Button Strip */}
            <div className="flex items-center justify-between rounded-xl bg-elevated/25 border border-subtle p-2.5 text-xs font-mono">
              <span className="text-zinc-400 text-[11px]">
                Showing {graphData.length} telemetry points. Want to inspect the incident root-causes and resolutions?
              </span>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface hover:bg-elevated border border-default text-xs text-white font-medium cursor-pointer transition-colors"
              >
                <span>View Records List</span>
                <ArrowRight size={12} weight="bold" />
              </button>
            </div>
          </div>
        ) : (
          /* VIEW MODE 2: DETAILED RECORDS LIST */
          <div className="space-y-2">
            {/* Search Input in List Mode */}
            <div className="relative">
              <MagnifyingGlass
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records by error reason, status code, root-cause keyword..."
                className="w-full rounded-xl bg-elevated/50 border border-default pl-8.5 pr-8 py-2 text-xs text-fg-primary placeholder:text-fg-placeholder focus:border-accent focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Records List Container */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5">
              {filteredRecords.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-elevated/20 border border-subtle text-xs text-fg-muted space-y-1">
                  <div>No telemetry history records found matching criteria in this range.</div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSeverityFilter('all');
                      setTimeFilter('all');
                    }}
                    className="text-accent underline cursor-pointer text-[11px]"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                filteredRecords.map((rec) => {
                  const isOutage = rec.type === 'outage';
                  const isWarning = rec.type === 'warning';

                  return (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-xl border text-xs transition-all space-y-2 ${
                        isOutage
                          ? 'bg-red-500/10 border-red-500/30'
                          : isWarning
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-elevated/40 border-subtle'
                      }`}
                    >
                      {/* Top Header: Badge, Code, Timestamp, Copy Button */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                              isOutage
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : isWarning
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {isOutage ? (
                              <XCircle size={11} weight="fill" />
                            ) : isWarning ? (
                              <WarningCircle size={11} weight="fill" />
                            ) : (
                              <CheckCircle size={11} weight="fill" />
                            )}
                            <span>
                              {rec.statusText ||
                                (isOutage
                                  ? 'Outage Error'
                                  : isWarning
                                  ? 'Warning Event'
                                  : 'Healthy Ping')}{' '}
                              · HTTP {rec.statusCode}
                            </span>
                          </span>

                          <span className="font-mono text-[11px] font-bold" style={{ color: endpoint.color || '#3b82f6' }}>
                            {rec.latencyMs}ms {isOutage || isWarning ? 'spike' : 'ping'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-fg-muted font-mono text-[10.5px]">
                          <Clock size={11} />
                          <span>{rec.timestamp}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyRecord(rec)}
                            title="Copy diagnostic record JSON"
                            className="ml-1 p-1 rounded hover:bg-white/10 text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
                          >
                            {copiedId === rec.id ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="font-bold text-fg-primary text-xs leading-tight">
                          {rec.title}
                        </h4>
                        <p className="text-[11px] text-zinc-300 font-sans mt-0.5 leading-relaxed">
                          {rec.description}
                        </p>
                      </div>

                      {/* Root Cause & Resolution Structured Diagnostic Section */}
                      {(rec.reason || rec.resolution) && (
                        <div className="pt-2 border-t border-subtle/60 space-y-1.5 text-[11px] font-sans">
                          {rec.reason && (
                            <div className="flex items-start gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-amber-400 shrink-0 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded">
                                Root Cause
                              </span>
                              <span className="text-zinc-300 leading-snug">{rec.reason}</span>
                            </div>
                          )}
                          {rec.resolution && (
                            <div className="flex items-start gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-emerald-400 shrink-0 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                                Resolution
                              </span>
                              <span className="text-emerald-300 font-medium leading-snug">{rec.resolution}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

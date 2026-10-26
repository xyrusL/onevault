import React, { useState, useEffect } from 'react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import {
  ChartLineUp,
  Television,
  DeviceMobile,
  Desktop,
  DeviceTablet,
  Eye,
  Clock,
  Warning,
  ShieldWarning,
  ArrowsClockwise,
  MagnifyingGlass,
  CheckCircle,
  FilmReel,
  Globe,
  Terminal,
} from '@phosphor-icons/react';
import { projectsService } from '../services/projects.service';
import type {
  ProjectItem,
  ProjectTelemetrySummary,
  TelemetryEventItem,
} from '../types/projects.types';

export interface ProjectTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem | null;
}

type TabKey = 'overview' | 'watch_time' | 'visitors' | 'devtools' | 'errors';

export const ProjectTelemetryModal: React.FC<ProjectTelemetryModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [telemetry, setTelemetry] = useState<ProjectTelemetrySummary | null>(null);

  const fetchTelemetry = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const data = await projectsService.getProjectTelemetry(project.slug || project.id);
      setTelemetry(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      void fetchTelemetry();
    }
  }, [isOpen, project]);

  if (!project) return null;

  const summary = telemetry?.summary || {
    activeViewers: project.stats.activeViewers || 1,
    totalWatchMinutes: 0,
    totalPageViews: project.stats.totalRequestsToday || 0,
    totalInspections: 0,
    totalErrors: 0,
    deviceBreakdown: { pc: 1, mobile: 0, tablet: 0, smartTv: 0 },
  };

  const totalDevices =
    (summary.deviceBreakdown.pc || 0) +
    (summary.deviceBreakdown.mobile || 0) +
    (summary.deviceBreakdown.tablet || 0) +
    (summary.deviceBreakdown.smartTv || 0) || 1;

  const pcPercent = Math.round(((summary.deviceBreakdown.pc || 0) / totalDevices) * 100);
  const mobilePercent = Math.round(((summary.deviceBreakdown.mobile || 0) / totalDevices) * 100);
  const tabletPercent = Math.round(((summary.deviceBreakdown.tablet || 0) / totalDevices) * 100);
  const tvPercent = Math.round(((summary.deviceBreakdown.smartTv || 0) / totalDevices) * 100);

  // Filter events based on search
  const filterEvents = (events: TelemetryEventItem[]) => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(
      (e) =>
        e.clientIp.toLowerCase().includes(q) ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.path && e.path.toLowerCase().includes(q)) ||
        (e.country && e.country.toLowerCase().includes(q)) ||
        (e.deviceType && e.deviceType.toLowerCase().includes(q))
    );
  };

  const getDeviceIcon = (devType?: string) => {
    const d = (devType || 'pc').toLowerCase();
    if (d === 'smart_tv' || d === 'tv') {
      return <Television size={13} className="text-purple-400" />;
    }
    if (d === 'tablet') {
      return <DeviceTablet size={13} className="text-sky-400" />;
    }
    if (d === 'mobile') {
      return <DeviceMobile size={13} className="text-emerald-400" />;
    }
    return <Desktop size={13} className="text-zinc-300" />;
  };

  const formatDeviceLabel = (devType?: string) => {
    const d = (devType || 'pc').toLowerCase();
    if (d === 'smart_tv' || d === 'tv') return 'Smart TV';
    if (d === 'tablet') return 'Tablet';
    if (d === 'mobile') return 'Mobile';
    return 'PC / Desktop';
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${project.name} • Live Telemetry & User Insights`}
      subtitle="Real-time watch minutes, unique viewers, device classification, DevTools detection, and error diagnostics."
      icon={<ChartLineUp size={18} className="text-sky-400" />}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top KPI Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Active Viewers */}
          <div className="p-3 rounded-xl bg-surface border border-default flex flex-col justify-between">
            <span className="text-[11px] text-fg-muted flex items-center gap-1">
              <Eye size={13} className="text-emerald-400" />
              <span>Active Viewers</span>
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold font-mono text-emerald-400">
                {summary.activeViewers}
              </span>
              <span className="text-[10px] text-emerald-500/80 font-semibold">Live Now</span>
            </div>
          </div>

          {/* Watch Time */}
          <div className="p-3 rounded-xl bg-surface border border-default flex flex-col justify-between">
            <span className="text-[11px] text-fg-muted flex items-center gap-1">
              <Clock size={13} className="text-sky-400" />
              <span>Total Watch Time</span>
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold font-mono text-fg-primary">
                {summary.totalWatchMinutes >= 60
                  ? `${(summary.totalWatchMinutes / 60).toFixed(1)}h`
                  : `${summary.totalWatchMinutes}m`}
              </span>
              <span className="text-[10px] text-fg-muted">streamed</span>
            </div>
          </div>

          {/* Device Distribution */}
          <div className="p-3 rounded-xl bg-surface border border-default flex flex-col justify-between">
            <span className="text-[11px] text-fg-muted flex items-center gap-1">
              <Desktop size={13} className="text-purple-400" />
              <span>Top Device</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-fg-primary font-bold">
              <span>
                {pcPercent >= mobilePercent && pcPercent >= tvPercent
                  ? `PC (${pcPercent}%)`
                  : mobilePercent >= tvPercent
                  ? `Mobile (${mobilePercent}%)`
                  : `TV (${tvPercent}%)`}
              </span>
            </div>
          </div>

          {/* DevTools Inspections */}
          <div className="p-3 rounded-xl bg-surface border border-default flex flex-col justify-between">
            <span className="text-[11px] text-fg-muted flex items-center gap-1">
              <ShieldWarning size={13} className="text-amber-400" />
              <span>Inspections Probed</span>
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-lg font-bold font-mono ${
                  summary.totalInspections > 0 ? 'text-amber-400' : 'text-fg-muted'
                }`}
              >
                {summary.totalInspections}
              </span>
              <span className="text-[10px] text-fg-muted">DevTools / 404</span>
            </div>
          </div>

          {/* Errors / Downtime */}
          <div className="p-3 rounded-xl bg-surface border border-default flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[11px] text-fg-muted flex items-center gap-1">
              <Warning size={13} className="text-rose-400" />
              <span>Player Errors</span>
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-lg font-bold font-mono ${
                  summary.totalErrors > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {summary.totalErrors}
              </span>
              <span className="text-[10px] text-fg-muted">
                {summary.totalErrors === 0 ? '0% Failures' : 'investigate'}
              </span>
            </div>
          </div>
        </div>

        {/* Device Breakdown Progress Bar */}
        <div className="p-2.5 rounded-xl bg-surface/50 border border-default space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-fg-secondary">Client Devices Breakdown</span>
            <div className="flex items-center gap-3 font-mono text-[10.5px]">
              <span className="flex items-center gap-1 text-zinc-300">
                <Desktop size={12} /> PC {pcPercent}%
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <DeviceMobile size={12} /> Mobile {mobilePercent}%
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <DeviceTablet size={12} /> Tablet {tabletPercent}%
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <Television size={12} /> Smart TV {tvPercent}%
              </span>
            </div>
          </div>

          {/* Multi-segmented Bar */}
          <div className="w-full h-2 rounded-full bg-canvas overflow-hidden flex">
            <div style={{ width: `${pcPercent}%` }} className="bg-zinc-400 h-full transition-all" />
            <div
              style={{ width: `${mobilePercent}%` }}
              className="bg-emerald-400 h-full transition-all"
            />
            <div style={{ width: `${tabletPercent}%` }} className="bg-sky-400 h-full transition-all" />
            <div
              style={{ width: `${tvPercent}%` }}
              className="bg-purple-400 h-full transition-all"
            />
          </div>
        </div>

        {/* Controls Toolbar: Tabs + Search + Refresh */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-default/70">
          <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-default overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30'
                  : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              Overview & Top Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('watch_time')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'watch_time'
                  ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30'
                  : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              <FilmReel size={12} />
              <span>Watch Telemetry ({telemetry?.recentEvents.filter((e) => e.eventType.includes('stream')).length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('visitors')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'visitors'
                  ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30'
                  : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              <Globe size={12} />
              <span>Visitors & Devices</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('devtools')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'devtools'
                  ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              <Terminal size={12} />
              <span>DevTools & Probes ({telemetry?.recentInspectors.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('errors')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'errors'
                  ? 'bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30'
                  : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              <Warning size={12} />
              <span>Errors & Diagnostics ({telemetry?.errorDiagnostics.length || 0})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlass
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
              />
              <input
                type="text"
                placeholder="Filter by IP, media, route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 pr-3 py-1 text-[11px] rounded-lg bg-surface border border-default text-fg-primary focus:border-sky-500 focus:outline-none w-48"
              />
            </div>
            <button
              type="button"
              onClick={fetchTelemetry}
              disabled={isLoading}
              title="Refresh Live Telemetry"
              className="p-1.5 rounded-lg bg-surface hover:bg-elevated border border-default text-fg-muted hover:text-fg-primary cursor-pointer transition-colors"
            >
              <ArrowsClockwise
                size={13}
                className={isLoading ? 'animate-spin text-sky-400' : ''}
              />
            </button>
          </div>
        </div>

        {/* Tab 1: Overview & Top Content */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-surface border border-default space-y-2">
              <h4 className="text-xs font-bold text-fg-primary flex items-center gap-1.5">
                <FilmReel size={14} className="text-emerald-400" />
                <span>Top Watched Media & Content Engagement</span>
              </h4>
              {telemetry?.topContent && telemetry.topContent.length > 0 ? (
                <div className="space-y-1.5">
                  {telemetry.topContent.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-canvas border border-default/70"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-fg-muted w-4">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-fg-primary">{item.title}</p>
                          <span className="text-[10px] text-fg-muted uppercase">
                            {item.category || 'Movie'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span className="text-emerald-400 font-bold">
                          {Math.round(item.totalMinutes)} mins
                        </span>
                        <p className="text-[10px] text-fg-muted">{item.views} sessions</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-fg-muted py-3 text-center">
                  No watch sessions recorded yet. Start watching media on GIGAMAXX to stream real-time watch minutes!
                </p>
              )}
            </div>

            {/* Recent 5 Events Teaser */}
            <div className="p-3 rounded-xl bg-surface border border-default space-y-2">
              <h4 className="text-xs font-bold text-fg-primary flex items-center gap-1.5">
                <CheckCircle size={14} className="text-sky-400" />
                <span>Latest Telemetry Heartbeats</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {filterEvents(telemetry?.recentEvents.slice(0, 8) || []).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-canvas border border-default/60 text-[11px]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getDeviceIcon(e.deviceType)}
                      <span className="font-mono text-fg-primary truncate">
                        {e.title || e.path || e.eventType}
                      </span>
                      <span className="text-[10px] text-fg-muted font-mono">{e.clientIp}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[10.5px] font-mono">
                      <span className="px-1.5 py-0.2 rounded bg-elevated border border-default text-fg-secondary">
                        {e.country}
                      </span>
                      <span className="text-fg-muted">
                        {new Date(e.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Watch Telemetry */}
        {activeTab === 'watch_time' && (
          <div className="rounded-xl border border-default bg-surface overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-canvas/80 text-fg-muted font-semibold sticky top-0 border-b border-default">
                  <tr>
                    <th className="p-2.5">Media Title / Episode</th>
                    <th className="p-2.5">Minutes Watched</th>
                    <th className="p-2.5">Device</th>
                    <th className="p-2.5">Viewer IP & Country</th>
                    <th className="p-2.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default/60">
                  {filterEvents(
                    (telemetry?.recentEvents || []).filter((e) => e.eventType.includes('stream'))
                  ).map((e) => (
                    <tr key={e.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="p-2.5 font-semibold text-fg-primary">
                        <div className="flex items-center gap-1.5">
                          <FilmReel size={13} className="text-rose-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{e.title || '4K Stream'}</span>
                          {e.season ? (
                            <span className="text-[10px] font-mono text-fg-muted">
                              S{e.season}:E{e.episode}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-emerald-400 font-bold">
                        {Math.round(e.watchMinutes || 1)} mins
                      </td>
                      <td className="p-2.5 font-mono text-fg-secondary flex items-center gap-1.5">
                        {getDeviceIcon(e.deviceType)}
                        <span>{formatDeviceLabel(e.deviceType)}</span>
                      </td>
                      <td className="p-2.5 font-mono text-fg-muted">
                        <span>{e.clientIp}</span> ({e.country})
                      </td>
                      <td className="p-2.5 font-mono text-right text-fg-muted">
                        {new Date(e.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Visitors & Devices */}
        {activeTab === 'visitors' && (
          <div className="rounded-xl border border-default bg-surface overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-canvas/80 text-fg-muted font-semibold sticky top-0 border-b border-default">
                  <tr>
                    <th className="p-2.5">Visitor IP</th>
                    <th className="p-2.5">Country & Location</th>
                    <th className="p-2.5">Device Category</th>
                    <th className="p-2.5">Visited Page / Route</th>
                    <th className="p-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default/60">
                  {filterEvents(telemetry?.recentEvents || []).map((e) => (
                    <tr key={e.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="p-2.5 font-mono text-fg-primary font-semibold">
                        {e.clientIp}
                      </td>
                      <td className="p-2.5 font-mono text-fg-secondary">
                        <span className="px-1.5 py-0.2 rounded bg-elevated border border-default text-[10px] mr-1">
                          {e.country}
                        </span>
                        <span>{e.city || e.asnOrg || 'Client Network'}</span>
                      </td>
                      <td className="p-2.5 font-mono text-fg-secondary flex items-center gap-1.5">
                        {getDeviceIcon(e.deviceType)}
                        <span>{formatDeviceLabel(e.deviceType)}</span>
                      </td>
                      <td className="p-2.5 font-mono text-fg-muted truncate max-w-[180px]">
                        {e.path || e.title || '/'}
                      </td>
                      <td className="p-2.5 font-mono text-right text-fg-muted">
                        {new Date(e.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: DevTools & Probes */}
        {activeTab === 'devtools' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 flex items-center gap-2">
              <ShieldWarning size={15} className="shrink-0" />
              <span>
                OneVault actively intercepts DevTools keyboard shortcuts (F12, Inspect Element), debugger probes, and 404 URL scanners on GIGAMAXX.
              </span>
            </div>

            <div className="rounded-xl border border-default bg-surface overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-canvas/80 text-fg-muted font-semibold sticky top-0 border-b border-default">
                    <tr>
                      <th className="p-2.5">Actor IP</th>
                      <th className="p-2.5">Origin Country</th>
                      <th className="p-2.5">Probed Route / Event</th>
                      <th className="p-2.5">Trigger Vector</th>
                      <th className="p-2.5 text-right">Detection Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default/60">
                    {filterEvents(telemetry?.recentInspectors || []).map((e) => (
                      <tr key={e.id} className="hover:bg-canvas/40 transition-colors">
                        <td className="p-2.5 font-mono text-amber-400 font-bold">
                          {e.clientIp}
                        </td>
                        <td className="p-2.5 font-mono text-fg-secondary">
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px]">
                            {e.country}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-fg-primary truncate max-w-[200px]">
                          {e.path || e.title || e.eventType}
                        </td>
                        <td className="p-2.5 font-mono text-[10.5px] text-fg-muted">
                          {(e.details?.trigger as string) || (e.eventType === '404_error' ? 'Route Scanner' : 'DevTools Shortcut')}
                        </td>
                        <td className="p-2.5 font-mono text-right text-fg-muted">
                          {new Date(e.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Errors & Diagnostics */}
        {activeTab === 'errors' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-300 flex items-center gap-2">
              <Warning size={15} className="shrink-0" />
              <span>
                Player playback timeouts, stream connection failures, and client network drops are recorded here for fast diagnostics.
              </span>
            </div>

            <div className="rounded-xl border border-default bg-surface overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                {filterEvents(telemetry?.errorDiagnostics || []).length > 0 ? (
                  <div className="divide-y divide-default/60">
                    {filterEvents(telemetry?.errorDiagnostics || []).map((e) => (
                      <div key={e.id} className="p-3 hover:bg-canvas/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-400 flex items-center gap-1.5 font-mono">
                            <Warning size={13} />
                            <span>{e.title || 'Playback Error'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-fg-muted">
                            {new Date(e.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="font-mono text-[10.5px] text-fg-secondary">
                          Client IP: <span className="text-fg-primary">{e.clientIp}</span> ({e.country}) • Device: {formatDeviceLabel(e.deviceType)}
                        </p>
                        {e.details && Object.keys(e.details).length > 0 && (
                          <pre className="p-2 rounded bg-black/50 text-[10px] font-mono text-zinc-300 overflow-x-auto">
                            {JSON.stringify(e.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-fg-muted space-y-1">
                    <CheckCircle size={24} className="text-emerald-400 mx-auto" />
                    <p className="font-semibold text-fg-primary">Zero Active Streaming Errors</p>
                    <p className="text-[11px]">All viewers on GIGAMAXX are experiencing smooth playback.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-default">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-accent hover:bg-accent-hover text-accent-fg cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

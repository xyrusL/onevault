import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
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
  Broadcast,
  Copy,
  Check,
} from '@phosphor-icons/react';
import { projectsService } from './services/projects.service';
import type {
  ProjectItem,
  ProjectTelemetrySummary,
  TelemetryEventItem,
} from './types/projects.types';

export interface ProjectInsightsViewProps {
  slug: string;
  onBack: () => void;
}

type TabKey = 'overview' | 'watch_time' | 'visitors' | 'devtools' | 'errors';

export const ProjectInsightsView: React.FC<ProjectInsightsViewProps> = ({ slug, onBack }) => {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [telemetry, setTelemetry] = useState<ProjectTelemetrySummary | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);

  // Load project meta and telemetry
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch project meta
      const projects = await projectsService.getProjects();
      const matched = projects.find(
        (p) => p.slug.toLowerCase() === slug.toLowerCase() || p.id === slug
      );
      if (matched) setProject(matched);

      // 2. Fetch telemetry data
      const telemData = await projectsService.getProjectTelemetry(slug);
      setTelemetry(telemData);
    } catch {
      // Keep existing data gracefully
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  // Live Auto-Refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void loadData(false);
    }, 15_000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const handleCopyToken = () => {
    if (!project?.gatewayToken) return;
    navigator.clipboard.writeText(project.gatewayToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const summary = telemetry?.summary || {
    activeViewers: project?.stats.activeViewers ?? 0,
    totalWatchMinutes: 0,
    totalPageViews: project?.stats.totalRequestsToday || 0,
    totalInspections: 0,
    totalErrors: 0,
    deviceBreakdown: { pc: 0, mobile: 0, tablet: 0, smartTv: 0 },
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
      return <Television size={14} className="text-purple-400" />;
    }
    if (d === 'tablet') {
      return <DeviceTablet size={14} className="text-sky-400" />;
    }
    if (d === 'mobile') {
      return <DeviceMobile size={14} className="text-emerald-400" />;
    }
    return <Desktop size={14} className="text-zinc-300" />;
  };

  const formatDeviceLabel = (devType?: string) => {
    const d = (devType || 'pc').toLowerCase();
    if (d === 'smart_tv' || d === 'tv') return 'Smart TV';
    if (d === 'tablet') return 'Tablet';
    if (d === 'mobile') return 'Mobile';
    return 'PC / Desktop';
  };

  const projectName = project?.name || slug.toUpperCase();

  return (
    <div className="flex-1 flex flex-col space-y-5 p-4 sm:p-6 max-w-7xl w-full mx-auto animate-portal-view">
      {/* Top Navigation Bar: Breadcrumb + Project Title + Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-default">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-surface hover:bg-elevated border border-default text-fg-muted hover:text-fg-primary transition-colors cursor-pointer group"
            title="Back to Projects"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-fg-muted">Projects</span>
              <span className="text-xs text-fg-muted">/</span>
              <h1 className="text-lg font-bold text-fg-primary flex items-center gap-2">
                <span>{projectName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-surface border border-default text-fg-muted font-normal">
                  {slug}
                </span>
              </h1>

              {/* Status Indicator */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                  project?.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : project?.status === 'connecting'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    project?.status === 'active'
                      ? 'bg-emerald-400 animate-pulse'
                      : project?.status === 'connecting'
                      ? 'bg-amber-400'
                      : 'bg-zinc-400'
                  }`}
                />
                <span className="capitalize">{project?.status || 'Active'}</span>
              </span>
            </div>

            <p className="text-xs text-fg-muted mt-0.5">
              Live telemetry, real-time streaming watch minutes, device breakdown, and threat diagnostics.
            </p>
          </div>
        </div>

        {/* Right Controls: Auto-refresh + Token + Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {project?.gatewayToken && (
            <button
              type="button"
              onClick={handleCopyToken}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-elevated border border-default text-xs font-mono text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
              title="Copy secret Project Gateway Token"
            >
              {copiedToken ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-400 font-sans">Token Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span className="font-sans">Copy Token</span>
                </>
              )}
            </button>
          )}

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-surface text-fg-muted border-default hover:text-fg-primary'
            }`}
            title={autoRefresh ? 'Auto-refresh active (15s)' : 'Auto-refresh paused'}
          >
            <Broadcast size={13} className={autoRefresh ? 'animate-pulse' : ''} />
            <span>{autoRefresh ? 'Live Pulse (15s)' : 'Paused'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => void loadData(false)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-elevated border border-default text-xs font-semibold text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
            title="Refresh Live Telemetry from Cloudflare D1"
          >
            <ArrowsClockwise
              size={13}
              className={isRefreshing || isLoading ? 'animate-spin text-sky-400' : ''}
            />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* 5-Column Hero Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* 1. Active Viewers */}
        <div className="p-4 rounded-2xl bg-surface border border-default shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
              <Eye size={15} className="text-emerald-400" />
              <span>Active Viewers</span>
            </span>
            {summary.activeViewers > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-2xl font-bold font-mono ${
                summary.activeViewers > 0 ? 'text-emerald-400' : 'text-fg-muted'
              }`}
            >
              {summary.activeViewers}
            </span>
            <span
              className={`text-xs font-semibold ${
                summary.activeViewers > 0 ? 'text-emerald-500' : 'text-fg-muted'
              }`}
            >
              {summary.activeViewers > 0 ? 'Live Now' : 'Idle'}
            </span>
          </div>
        </div>

        {/* 2. Total Watch Time */}
        <div className="p-4 rounded-2xl bg-surface border border-default shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
            <Clock size={15} className="text-sky-400" />
            <span>Total Watch Time</span>
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-fg-primary">
              {summary.totalWatchMinutes >= 60
                ? `${(summary.totalWatchMinutes / 60).toFixed(1)}h`
                : `${summary.totalWatchMinutes}m`}
            </span>
            <span className="text-xs text-fg-muted">streamed</span>
          </div>
        </div>

        {/* 3. Top Device */}
        <div className="p-4 rounded-2xl bg-surface border border-default shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
            <Desktop size={15} className="text-purple-400" />
            <span>Top Device</span>
          </span>
          <div className="flex items-center gap-2 mt-2 font-mono text-fg-primary font-bold text-lg truncate">
            <span>
              {pcPercent >= mobilePercent && pcPercent >= tvPercent
                ? `PC (${pcPercent}%)`
                : mobilePercent >= tvPercent
                ? `Mobile (${mobilePercent}%)`
                : `TV (${tvPercent}%)`}
            </span>
          </div>
        </div>

        {/* 4. Threat Inspections */}
        <div className="p-4 rounded-2xl bg-surface border border-default shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
            <ShieldWarning size={15} className="text-amber-400" />
            <span>Threat Probes</span>
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-2xl font-bold font-mono ${
                summary.totalInspections > 0 ? 'text-amber-400' : 'text-fg-muted'
              }`}
            >
              {summary.totalInspections}
            </span>
            <span className="text-xs text-fg-muted">DevTools / 404</span>
          </div>
        </div>

        {/* 5. Player Errors */}
        <div className="p-4 rounded-2xl bg-surface border border-default shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
            <Warning size={15} className="text-rose-400" />
            <span>Player Errors</span>
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-2xl font-bold font-mono ${
                summary.totalErrors > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {summary.totalErrors}
            </span>
            <span className="text-xs text-fg-muted">
              {summary.totalErrors === 0 ? '0% Failures' : 'Investigate'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Client Devices Breakdown Strip */}
      <div className="p-4 rounded-2xl bg-surface border border-default space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-fg-primary flex items-center gap-1.5">
            <ChartLineUp size={14} className="text-sky-400" />
            <span>Client Devices Breakdown</span>
          </span>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="flex items-center gap-1 text-zinc-300">
              <Desktop size={13} /> PC {pcPercent}%
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <DeviceMobile size={13} /> Mobile {mobilePercent}%
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <DeviceTablet size={13} /> Tablet {tabletPercent}%
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <Television size={13} /> Smart TV {tvPercent}%
            </span>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="w-full h-3 rounded-full bg-canvas border border-default/50 overflow-hidden flex">
          <div
            style={{ width: `${pcPercent}%` }}
            className="bg-zinc-400 h-full transition-all"
            title={`PC / Desktop: ${pcPercent}%`}
          />
          <div
            style={{ width: `${mobilePercent}%` }}
            className="bg-emerald-400 h-full transition-all"
            title={`Mobile Phones: ${mobilePercent}%`}
          />
          <div
            style={{ width: `${tabletPercent}%` }}
            className="bg-sky-400 h-full transition-all"
            title={`Tablets: ${tabletPercent}%`}
          />
          <div
            style={{ width: `${tvPercent}%` }}
            className="bg-purple-400 h-full transition-all"
            title={`Smart TVs: ${tvPercent}%`}
          />
        </div>
      </div>

      {/* Navigation Tabs + Search Filter */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
        <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-default overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-fg-muted hover:text-fg-primary'
            }`}
          >
            <ChartLineUp size={13} />
            <span>Overview & Top Content</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('watch_time')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'watch_time'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-fg-muted hover:text-fg-primary'
            }`}
          >
            <FilmReel size={13} />
            <span>
              Watch Telemetry (
              {telemetry?.recentEvents.filter((e) => e.eventType.includes('stream')).length || 0})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visitors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'visitors'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-fg-muted hover:text-fg-primary'
            }`}
          >
            <Globe size={13} />
            <span>Visitors & Devices</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('devtools')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'devtools'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-fg-muted hover:text-fg-primary'
            }`}
          >
            <Terminal size={13} />
            <span>DevTools & Probes ({telemetry?.recentInspectors.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'errors'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-fg-muted hover:text-fg-primary'
            }`}
          >
            <Warning size={13} />
            <span>Errors & Diagnostics ({telemetry?.errorDiagnostics.length || 0})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <input
            type="text"
            placeholder="Search by title, IP, route, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface border border-default text-fg-primary placeholder:text-fg-muted focus:border-sky-500 focus:outline-none w-64 transition-all"
          />
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1">
        {/* TAB 1: Overview & Top Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Watched Media */}
            <div className="p-4 rounded-2xl bg-surface border border-default space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg-primary flex items-center gap-2">
                  <FilmReel size={16} className="text-emerald-400" />
                  <span>Top Watched Media & Content Engagement</span>
                </h3>
                <span className="text-xs font-mono text-fg-muted">
                  {telemetry?.topContent.length || 0} titles ranked
                </span>
              </div>

              {telemetry?.topContent && telemetry.topContent.length > 0 ? (
                <div className="space-y-2">
                  {telemetry.topContent.map((item, idx) => {
                    const maxMins = telemetry.topContent[0]?.totalMinutes || 1;
                    const barPct = Math.max(5, Math.round((item.totalMinutes / maxMins) * 100));

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-canvas border border-default/70 hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-bold text-fg-muted w-5">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-xs text-fg-primary">{item.title}</p>
                              <span className="text-[10px] font-mono uppercase text-fg-muted px-1.5 py-0.2 rounded bg-elevated border border-default/60">
                                {item.category || 'movie'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-xs font-bold text-emerald-400">
                              {Math.round(item.totalMinutes)} mins
                            </span>
                            <p className="text-[10.5px] text-fg-muted">{item.views} sessions</p>
                          </div>
                        </div>

                        {/* Relative engagement progress bar */}
                        <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
                          <div
                            style={{ width: `${barPct}%` }}
                            className="bg-emerald-400 h-full rounded-full transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-fg-muted">
                  No stream sessions recorded yet. Start streaming media on GIGAMAXX to watch real-time watch minutes!
                </div>
              )}
            </div>

            {/* Latest Live Stream Heartbeats */}
            <div className="p-4 rounded-2xl bg-surface border border-default space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg-primary flex items-center gap-2">
                  <CheckCircle size={16} className="text-sky-400" />
                  <span>Real-Time Telemetry Heartbeats</span>
                </h3>
                <span className="text-xs font-mono text-fg-muted">Latest activity</span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filterEvents(telemetry?.recentEvents.slice(0, 15) || []).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-canvas border border-default/70 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      {getDeviceIcon(e.deviceType)}
                      <span className="font-medium text-fg-primary truncate">
                        {e.title || e.path || e.eventType}
                      </span>
                      <span className="text-[10px] text-fg-muted font-mono">{e.clientIp}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-elevated border border-default text-fg-secondary">
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

        {/* TAB 2: Watch Telemetry */}
        {activeTab === 'watch_time' && (
          <div className="rounded-2xl border border-default bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas/80 text-fg-muted font-semibold border-b border-default uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="p-3.5">Media Title / Episode</th>
                    <th className="p-3.5">Duration Streamed</th>
                    <th className="p-3.5">Client Device</th>
                    <th className="p-3.5">Viewer IP & Location</th>
                    <th className="p-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default/60">
                  {filterEvents(
                    (telemetry?.recentEvents || []).filter((e) => e.eventType.includes('stream'))
                  ).map((e) => (
                    <tr key={e.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="p-3.5 font-medium text-fg-primary">
                        <div className="flex items-center gap-2">
                          <FilmReel size={14} className="text-emerald-400 shrink-0" />
                          <span className="font-semibold">{e.title || '4K Stream'}</span>
                          {e.season ? (
                            <span className="text-[10.5px] font-mono text-fg-muted px-1.5 py-0.5 rounded bg-elevated border border-default">
                              S{e.season}:E{e.episode}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">
                        {Math.round(e.watchMinutes || 1)} mins
                      </td>
                      <td className="p-3.5 font-mono text-fg-secondary">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(e.deviceType)}
                          <span>{formatDeviceLabel(e.deviceType)}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-fg-muted">
                        <span>{e.clientIp}</span> ({e.country})
                      </td>
                      <td className="p-3.5 font-mono text-right text-fg-muted">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Visitors & Devices */}
        {activeTab === 'visitors' && (
          <div className="rounded-2xl border border-default bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas/80 text-fg-muted font-semibold border-b border-default uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="p-3.5">Visitor IP</th>
                    <th className="p-3.5">Country & Location</th>
                    <th className="p-3.5">Device Classification</th>
                    <th className="p-3.5">Visited Page / Route</th>
                    <th className="p-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default/60">
                  {filterEvents(
                    (telemetry?.recentEvents || []).filter((e) => e.eventType === 'page_view')
                  ).map((e) => (
                    <tr key={e.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="p-3.5 font-mono text-fg-primary font-medium">{e.clientIp}</td>
                      <td className="p-3.5 font-mono text-fg-secondary">
                        <span className="px-2 py-0.5 rounded bg-elevated border border-default mr-1.5">
                          {e.country}
                        </span>
                        {e.city || ''}
                      </td>
                      <td className="p-3.5 font-mono text-fg-muted">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(e.deviceType)}
                          <span>{formatDeviceLabel(e.deviceType)}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-fg-primary truncate max-w-xs">
                        {e.path || e.title || '/'}
                      </td>
                      <td className="p-3.5 font-mono text-right text-fg-muted">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DevTools Probes & Honeypots */}
        {activeTab === 'devtools' && (
          <div className="rounded-2xl border border-default bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas/80 text-fg-muted font-semibold border-b border-default uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="p-3.5">Probe Type / Trigger</th>
                    <th className="p-3.5">Probed Path</th>
                    <th className="p-3.5">Device Category</th>
                    <th className="p-3.5">Actor IP & Country</th>
                    <th className="p-3.5">Threat Status</th>
                    <th className="p-3.5 text-right">Detected At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default/60">
                  {filterEvents(telemetry?.recentInspectors || []).map((e) => (
                    <tr key={e.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="p-3.5 font-medium text-amber-400">
                        <div className="flex items-center gap-1.5">
                          <Terminal size={14} className="shrink-0" />
                          <span>{(e.details?.trigger as string) || e.eventType}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-fg-primary truncate max-w-xs">
                        {e.path || '/'}
                      </td>
                      <td className="p-3.5 font-mono text-fg-secondary">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(e.deviceType)}
                          <span>{formatDeviceLabel(e.deviceType)}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-fg-muted">
                        <span>{e.clientIp}</span> ({e.country})
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Intercepted & Logged
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-right text-fg-muted">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Errors & Diagnostics */}
        {activeTab === 'errors' && (
          <div className="rounded-2xl border border-default bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas/80 text-fg-muted font-semibold border-b border-default uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="p-3.5">Error Type</th>
                    <th className="p-3.5">Title / Target Route</th>
                    <th className="p-3.5">Client Device</th>
                    <th className="p-3.5">Client IP & Country</th>
                    <th className="p-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default/60">
                  {filterEvents(telemetry?.errorDiagnostics || []).map((e) => (
                    <tr key={e.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="p-3.5 font-semibold text-rose-400">
                        <div className="flex items-center gap-1.5">
                          <Warning size={14} className="shrink-0" />
                          <span>{e.eventType}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-fg-primary truncate max-w-xs">
                        {e.title || e.path || 'Player Failure'}
                      </td>
                      <td className="p-3.5 font-mono text-fg-secondary">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(e.deviceType)}
                          <span>{formatDeviceLabel(e.deviceType)}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-fg-muted">
                        <span>{e.clientIp}</span> ({e.country})
                      </td>
                      <td className="p-3.5 font-mono text-right text-fg-muted">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

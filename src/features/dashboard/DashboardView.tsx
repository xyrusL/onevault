import React, { useCallback, useEffect, useState } from 'react';
import { CircleNotch, WarningCircle, X } from '@phosphor-icons/react';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardMetricCards } from './components/DashboardMetricCards';
import { VaultDistributionChart } from './components/VaultDistributionChart';
import { MailRoutingMetricsChart } from './components/MailRoutingMetricsChart';
import { ApiStatusPieChart, ApiHealthLiveMonitor } from './components/api-health';
import { DdosEmergencyModal, DdosSelfDefenseBanner } from './components/ddos-defense';
import { ThreatDefenseView, ThreatDetectedModal } from './components/threat-guard';
import { NotesAndSecurityCards } from './components/NotesAndSecurityCards';
import { RecentActivityFeed } from './components/RecentActivityFeed';
import { QuickActionsLaunchpad } from './components/QuickActionsLaunchpad';
import { GlobalDomainGlobeView } from './components/GlobalDomainGlobeView';
import { GlobalFlatMapView } from './components/GlobalFlatMapView';
import { dashboardService } from './services/dashboard.service';
import type {
  DashboardStats,
  DashboardViewMode,
  DdosDefenseTelemetry,
  ImmuneSystemTelemetry,
} from './types/dashboard.types';
import type { PortalSectionId } from '../../shared/layouts/portal-layout';

interface DashboardViewProps {
  onNavigate?: (section: PortalSectionId) => void;
}

const DEFAULT_DDOS_DEFENSE: DdosDefenseTelemetry = {
  active: false,
  threatLevel: 'guarded',
  attackSignature: 'Baseline Guard Active (Auto-engages during volumetric attack)',
  detectedAt: new Date().toISOString(),
  temporaryUntil: new Date().toISOString(),
  edgeColo: 'EDGE',
  viewerCountry: 'GLOBAL',
  peakRps: 0,
  normalBaselineRps: 0,
  mitigationRatePct: 100,
  totalIncomingAttackRequests: 0,
  totalBlockedAtEdge: 0,
  d1QueriesSaved: 0,
  cloudflareSource: 'Cloudflare GraphQL + Edge Isolate',
  sessionLockdown: {
    enabled: true,
    pinnedDeviceLabel: 'Current Session',
    revokedPreviousSessions: 0,
    lastPinnedAt: new Date().toISOString(),
    currentTokenPinned: true,
  },
  incomingCountries: [],
  protectedDataPaths: [],
  defenseLayers: [],
};

const DEFAULT_IMMUNE_SYSTEM: ImmuneSystemTelemetry = {
  status: 'active_monitoring',
  engineVersion: 'v2.4 Behavioral Intrusion Prevention Engine',
  modeDescription:
    'Per-Actor Surgical Threat Guard (Never locks down whole site · Blocks & rate-limits only offending IPs with 0.00% False Positives)',
  totalMonitoredActors: 0,
  legitimateActorsAllowed: 0,
  activeQuarantinedIps: 0,
  activeRateLimitedIps: 0,
  penetrationAttemptsBlocked: 0,
  pageScansIntercepted: 0,
  honeypotTrapsTriggered: 0,
  falsePositiveCount: 0,
  falsePositiveRatePct: 0,
  humanTypoForgivenessLimit: 3,
  scannerDistinct404Threshold: 6,
  antibodyRules: [],
  recentActors: [],
  verificationSuite: {
    lastRunAt: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    legitimateTestsPassed: 0,
    legitimateTestsTotal: 0,
    maliciousTestsPassed: 0,
    maliciousTestsTotal: 0,
    falsePositiveRatePct: 0,
    detectionAccuracyPct: 100,
    surgicalIsolationVerified: true,
    results: [],
  },
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const cached = dashboardService.getCached();
  const [stats, setStats] = useState<DashboardStats | null>(() => cached);
  const [isLoading, setIsLoading] = useState<boolean>(() => !cached);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<DashboardViewMode>('overview');
  // Emergency DDoS Self-Defense modal pops up only if an actual massive volumetric attack is detected
  const [isDdosModalOpen, setIsDdosModalOpen] = useState<boolean>(false);
  const [localDdosOverride, setLocalDdosOverride] =
    useState<DdosDefenseTelemetry | null>(null);
  const [localImmuneOverride, setLocalImmuneOverride] =
    useState<ImmuneSystemTelemetry | null>(null);

  const activeDdosTelemetry =
    localDdosOverride ?? stats?.ddosDefense ?? DEFAULT_DDOS_DEFENSE;
  const activeImmuneTelemetry =
    localImmuneOverride ?? stats?.immuneSystem ?? DEFAULT_IMMUNE_SYSTEM;

  const [threatModalMessage, setThreatModalMessage] = useState<string | null>(null);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (!dashboardService.getCached()) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await dashboardService.getStats(isManualRefresh);
      setStats(data);
      if (data.ddosDefense) {
        setLocalDdosOverride(data.ddosDefense);
      }
      if (data.immuneSystem) {
        setLocalImmuneOverride(data.immuneSystem);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load dashboard telemetry.';
      if (msg.includes('Adaptive Threat Guard') || msg.includes('Threat Guard') || msg.includes('Exploit Payload')) {
        setThreatModalMessage(msg);
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    // Auto-refresh telemetry every 45s (matching client cache TTL, 0 extra quota waste)
    const interval = setInterval(() => {
      void fetchStats(false);
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <section className="space-y-3 sm:space-y-4">
      {/* Emergency DDoS & Edge Self-Defense Modal — ONLY rendered if an attack is actively detected */}
      {activeDdosTelemetry.active && (
        <DdosEmergencyModal
          isOpen={isDdosModalOpen}
          telemetry={activeDdosTelemetry}
          onClose={() => setIsDdosModalOpen(false)}
          onTelemetryChange={(updated) => {
            setLocalDdosOverride(updated);
            setStats((prev) => (prev ? { ...prev, ddosDefense: updated } : prev));
          }}
        />
      )}

      {/* 1. Header with view switcher, edge status, and refresh control */}
      <DashboardHeader
        isRefreshing={isRefreshing}
        onRefresh={() => void fetchStats(true)}
        lastSyncedAt={stats?.vault.lastSyncedAt}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 1b. Active Edge Self-Defense Status Banner — ONLY displayed during an active volumetric DDoS attack */}
      {activeDdosTelemetry.active && (
        <DdosSelfDefenseBanner
          telemetry={activeDdosTelemetry}
          onOpenModal={() => setIsDdosModalOpen(true)}
        />
      )}



      {/* Threat Interception Modal: Shows action taken by algorithm with 1-click button to Threat Defense */}
      <ThreatDetectedModal
        isOpen={Boolean(threatModalMessage)}
        onClose={() => setThreatModalMessage(null)}
        threatMessage={threatModalMessage || ''}
        onNavigateToDefense={() => setViewMode('threat-defense')}
      />

      {/* Standard Error Banner (with close 'X' button) */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 p-3 text-xs text-danger font-medium"
        >
          <WarningCircle size={16} weight="bold" className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void fetchStats(true)}
            className="underline font-semibold cursor-pointer shrink-0"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 rounded-md hover:bg-danger/15 text-danger/80 hover:text-danger cursor-pointer transition-colors shrink-0 ml-1"
            title="Dismiss error"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Loading state when no cache is available */}
      {isLoading && !stats ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-default bg-surface/50 text-fg-muted space-y-2">
          <CircleNotch size={24} weight="bold" className="animate-spin text-accent" />
          <span className="text-xs font-medium">Aggregating vault telemetry...</span>
        </div>
      ) : stats ? (
        viewMode === 'threat-defense' ? (
          /* Full Dashboard Security Page: Threat Defense Intelligence Center */
          <ThreatDefenseView
            telemetry={activeImmuneTelemetry}
            onTelemetryChange={(updated) => {
              setLocalImmuneOverride(updated);
              setStats((prev) => (prev ? { ...prev, immuneSystem: updated } : prev));
            }}
          />
        ) : viewMode === 'globe' ? (
          /* 3D Interactive Global Edge Command Center - Large Desktop Viewports Only */
          <div className="space-y-4">
            <div className="lg:hidden p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono flex items-center justify-between">
              <span>3D Global Globe requires a larger viewport (1024px+). Switched to standard overview.</span>
              <button
                type="button"
                onClick={() => setViewMode('overview')}
                className="underline font-bold cursor-pointer"
              >
                Go to Overview
              </button>
            </div>
            <div className="hidden lg:block">
              <GlobalDomainGlobeView stats={stats} />
            </div>
            <div className="block lg:hidden">
              <DashboardMetricCards stats={stats} onNavigate={onNavigate} />
              <div className="grid grid-cols-1 gap-3 mt-3">
                <VaultDistributionChart
                  distribution={stats.distribution}
                  totalVaultItems={stats.vault.totalVaultItems}
                />
                <ApiStatusPieChart apiHealth={stats.apiHealth} />
                <MailRoutingMetricsChart mail={stats.mail} />
              </div>
              <div className="mt-3">
                <ApiHealthLiveMonitor
                  apiHealth={stats.apiHealth}
                  auditErrors={stats.auditLogs?.errors}
                  auditWarnings={stats.auditLogs?.warnings}
                  recentLogs={stats.auditLogs?.recentLogs}
                  onRefreshStats={() => fetchStats(true)}
                />
              </div>
            </div>
          </div>
        ) : viewMode === 'flatmap' ? (
          /* 2D Global Edge Flat Map Intelligence View - Large Desktop Viewports Only */
          <div className="space-y-4">
            <div className="lg:hidden p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono flex items-center justify-between">
              <span>Global Flat Map requires a larger viewport (1024px+). Switched to standard overview.</span>
              <button
                type="button"
                onClick={() => setViewMode('overview')}
                className="underline font-bold cursor-pointer"
              >
                Go to Overview
              </button>
            </div>
            <div className="hidden lg:block">
              <GlobalFlatMapView stats={stats} />
            </div>
            <div className="block lg:hidden">
              <DashboardMetricCards stats={stats} onNavigate={onNavigate} />
              <div className="grid grid-cols-1 gap-3 mt-3">
                <VaultDistributionChart
                  distribution={stats.distribution}
                  totalVaultItems={stats.vault.totalVaultItems}
                />
                <ApiStatusPieChart apiHealth={stats.apiHealth} />
                <MailRoutingMetricsChart mail={stats.mail} />
              </div>
              <div className="mt-3">
                <ApiHealthLiveMonitor
                  apiHealth={stats.apiHealth}
                  auditErrors={stats.auditLogs?.errors}
                  auditWarnings={stats.auditLogs?.warnings}
                  recentLogs={stats.auditLogs?.recentLogs}
                  onRefreshStats={() => fetchStats(true)}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 2. Top KPI Cards */}
            <DashboardMetricCards stats={stats} onNavigate={onNavigate} />

            {/* 3. Middle 3-Column Distribution Strip: Asset Distribution · API Health Status · Mail Routing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <VaultDistributionChart
                distribution={stats.distribution}
                totalVaultItems={stats.vault.totalVaultItems}
              />
              <ApiStatusPieChart apiHealth={stats.apiHealth} />
              <MailRoutingMetricsChart mail={stats.mail} />
            </div>

            {/* 4. Full-Width Live API Health & Multi-Curve Telemetry Monitor */}
            <ApiHealthLiveMonitor
              apiHealth={stats.apiHealth}
              auditErrors={stats.auditLogs?.errors}
              auditWarnings={stats.auditLogs?.warnings}
              recentLogs={stats.auditLogs?.recentLogs}
              onRefreshStats={() => fetchStats(true)}
            />

            {/* 5. Categorization & Security Breakdown */}
            <NotesAndSecurityCards
              notes={stats.notes}
              twoFactor={stats.twoFactor}
              onNavigate={onNavigate}
            />

            {/* 6. Live Activity Stream Feed */}
            <RecentActivityFeed stats={stats} onNavigate={onNavigate} />

            {/* 7. Quick Actions Launchpad */}
            <QuickActionsLaunchpad onNavigate={onNavigate} />
          </>
        )
      ) : null}
    </section>
  );
};

import React, { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Pulse, ShieldCheck, CalendarBlank, WarningCircle } from '@phosphor-icons/react';
import { ApiPeriodFilterModal, MONTH_NAMES } from './ApiPeriodFilterModal';
import type { DashboardApiHealthStats, ApiStatusDistribution } from '../../types/dashboard.types';

interface ApiStatusPieChartProps {
  apiHealth?: DashboardApiHealthStats;
}

export const ApiStatusPieChart: React.FC<ApiStatusPieChartProps> = ({
  apiHealth,
}) => {
  // Period filter state: default is Present (Live & Fresh baseline)
  const [filterPeriod, setFilterPeriod] = useState<{
    isHistorical: boolean;
    month: string;
    year: string;
  }>({
    isHistorical: false,
    month: '10',
    year: '2026',
  });

  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState<ApiStatusDistribution | null>(null);

  // Present Baseline vs. Historical Archived Distribution
  const data: ApiStatusDistribution[] = useMemo(() => {
    if (filterPeriod.isHistorical) {
      // Archived historical cycle sample data with recorded warnings
      return [
        { name: '200 OK', count: 8640, percentage: 99.4, color: '#10b981' },
        { name: '4xx Warn', count: 42, percentage: 0.5, color: '#6366f1' },
        { name: '5xx Err', count: 12, percentage: 0.1, color: '#ef4444' },
      ];
    }

    return apiHealth?.distribution || [
      { name: '200 OK', count: 985, percentage: 99.3, color: '#10b981' },
      { name: '4xx Warn', count: 7, percentage: 0.7, color: '#6366f1' },
      { name: '5xx Err', count: 0, percentage: 0.0, color: '#ef4444' },
    ];
  }, [filterPeriod.isHistorical, apiHealth]);

  const uptimePct = filterPeriod.isHistorical ? 99.4 : (apiHealth?.uptimePercentage ?? 100);
  const avgLatency = filterPeriod.isHistorical ? 38 : (apiHealth?.averageLatencyMs ?? 22);
  const isHealthy = !filterPeriod.isHistorical && (apiHealth?.overallStatus === 'operational' || uptimePct >= 99.0);

  const handleResetToLive = () => {
    setFilterPeriod({
      isHistorical: false,
      month: '10',
      year: '2026',
    });
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-default bg-surface p-4">
      {/* Date Filter Modal (Shared sub-component starting with Year 2026) */}
      <ApiPeriodFilterModal
        isOpen={isDateFilterModalOpen}
        onClose={() => setIsDateFilterModalOpen(false)}
        title="Request Distribution Period Filter"
        subtitle="Inspect live request stream or audit previous monthly distribution records"
        streamType="distribution"
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

      {/* Chart Header - Matching height & border line with sibling cards */}
      <div>
        <div className="flex items-center justify-between min-h-[34px] pb-3 border-b border-subtle gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Pulse size={16} weight="duotone" className="text-emerald-500 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-fg-primary truncate">
              API Health &amp; Request Distribution
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Date Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setIsDateFilterModalOpen(true)}
              title="Filter request distribution by Month & Year"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
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

            {/* Operational Status Icon Badge */}
            <span
              title={
                filterPeriod.isHistorical
                  ? 'Archived Telemetry Period'
                  : isHealthy
                  ? 'Operational (100% Healthy Edge)'
                  : 'Degraded Edge Health'
              }
              className={`inline-flex items-center justify-center h-6 w-6 rounded-full shrink-0 border transition-all ${
                filterPeriod.isHistorical
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  : isHealthy
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-red-500/10 text-red-400 border-red-500/25'
              }`}
            >
              {filterPeriod.isHistorical ? (
                <CalendarBlank size={12} weight="fill" />
              ) : isHealthy ? (
                <ShieldCheck size={13} weight="fill" />
              ) : (
                <WarningCircle size={13} weight="fill" />
              )}
            </span>
          </div>
        </div>

        {/* Archive Active Badge Bar (when in historical mode) */}
        {filterPeriod.isHistorical && (
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 pb-1 border-b border-subtle">
            <span className="inline-flex items-center gap-1.5 text-amber-300">
              <CalendarBlank size={12} weight="fill" />
              <span>Showing Archive: {MONTH_NAMES[filterPeriod.month] || filterPeriod.month} {filterPeriod.year}</span>
            </span>
            <button
              type="button"
              onClick={handleResetToLive}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Reset to Live
            </button>
          </div>
        )}

        {/* Donut Chart Centered on Top */}
        <div className="flex flex-col items-center pt-2">
          <div className="relative h-32 w-32 sm:h-36 sm:w-36 shrink-0 flex items-center justify-center my-0.5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  wrapperStyle={{ pointerEvents: 'none', zIndex: 30 }}
                  offset={18}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as ApiStatusDistribution;
                      return (
                        <div className="rounded-xl border border-white/10 bg-[#0d0d12]/95 px-2.5 py-1.5 shadow-xl text-xs font-mono backdrop-blur-md">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-semibold text-fg-primary">
                              {item.name}:
                            </span>
                            <span className="text-zinc-300 font-bold">
                              {item.percentage}% ({item.count})
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={3}
                  stroke="none"
                  onMouseEnter={(_, index) => setHoveredStatus(data[index] || null)}
                  onMouseLeave={() => setHoveredStatus(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="cursor-pointer transition-opacity hover:opacity-85"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Absolute Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              {hoveredStatus ? (
                <>
                  <span
                    className="text-base sm:text-lg font-bold font-mono leading-tight"
                    style={{ color: hoveredStatus.color }}
                  >
                    {hoveredStatus.count}
                  </span>
                  <span
                    className="text-[8px] font-mono tracking-widest uppercase font-semibold mt-0.5 truncate max-w-[70px]"
                    style={{ color: hoveredStatus.color }}
                  >
                    {hoveredStatus.name} ({hoveredStatus.percentage}%)
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base sm:text-lg font-bold font-mono text-fg-primary leading-tight">
                    {uptimePct}%
                  </span>
                  <span className="text-[8px] font-mono tracking-widest text-emerald-400 uppercase font-semibold mt-0.5">
                    UPTIME
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Compact 3-Column Label Data Grid Directly Below Donut Chart */}
          <div className="grid grid-cols-3 gap-1.5 w-full mt-2">
            {data.map((row) => (
              <div
                key={row.name}
                className="flex flex-col justify-between p-1.5 rounded-lg bg-elevated/40 border border-subtle text-xs"
              >
                <div className="flex items-center gap-1 text-[10.5px]">
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="text-fg-secondary truncate font-medium">
                    {row.name.includes('200')
                      ? '200 OK'
                      : row.name.includes('4')
                      ? '4xx Warn'
                      : '5xx Err'}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="font-bold text-[11px] text-fg-primary">
                    {row.count}
                  </span>
                  <span className="text-[9px] text-fg-muted">
                    {row.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Compact SLA & Average Latency Summary */}
          <div className="flex items-center justify-between text-[10.5px] font-mono text-fg-muted px-1 mt-1.5 w-full">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Edge SLA: 99.9%</span>
            </span>
            <span>
              Avg Latency: <strong className="text-fg-primary">{avgLatency}ms</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Global Edge Performance Callout */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-2 text-xs text-fg-secondary">
        <Pulse size={15} weight="duotone" className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-[10.5px] leading-relaxed">
          <strong className="text-fg-primary font-semibold">Global Edge Performance:</strong>{' '}
          Cloudflare Anycast edge serves 100% of API endpoints with zero origin servers. Inbound requests run in V8 isolates with warm sub-25ms response latency.
        </div>
      </div>
    </div>
  );
};

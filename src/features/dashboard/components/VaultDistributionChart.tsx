import React, { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartPieSlice, ShieldCheck } from '@phosphor-icons/react';
import type { DashboardItemDistribution } from '../types/dashboard.types';

interface VaultDistributionChartProps {
  distribution: DashboardItemDistribution[];
  totalVaultItems: number;
}

export const VaultDistributionChart: React.FC<VaultDistributionChartProps> = ({
  distribution,
  totalVaultItems,
}) => {
  const [hoveredItem, setHoveredItem] = useState<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  } | null>(null);

  const chartData = distribution.map((item) => ({
    name: item.name,
    value: item.count,
    percentage: item.percentage,
    color: item.color,
  }));

  return (
    <div className="flex flex-col justify-between rounded-xl border border-default bg-surface p-4">
      {/* Chart Header - Matching height & border-b alignment */}
      <div>
        <div className="flex items-center justify-between min-h-[34px] pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <ChartPieSlice size={18} weight="duotone" className="text-accent shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-fg-primary">
              Vault Asset Distribution
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium shrink-0">
            <ShieldCheck size={13} weight="fill" />
            <span>{totalVaultItems} Assets</span>
          </span>
        </div>

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
                      const data = payload[0].payload as {
                        name: string;
                        value: number;
                        percentage: number;
                        color: string;
                      };
                      return (
                        <div className="rounded-lg border border-default bg-surface-solid px-2.5 py-1.5 shadow-card text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-fg-primary">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: data.color }}
                            />
                            <span>{data.name}</span>
                          </div>
                          <div className="text-[11px] text-fg-secondary mt-0.5">
                            {data.value} items ({data.percentage}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={3}
                  stroke="none"
                  onMouseEnter={(_, index) => setHoveredItem(chartData[index] || null)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="cursor-pointer transition-opacity hover:opacity-85"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center text inside donut */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              {hoveredItem ? (
                <>
                  <span
                    className="font-display text-lg sm:text-xl font-black leading-none"
                    style={{ color: hoveredItem.color }}
                  >
                    {hoveredItem.value}
                  </span>
                  <span className="text-[8px] font-semibold text-fg-muted uppercase tracking-wider mt-0.5 truncate max-w-[68px]">
                    {hoveredItem.name}
                  </span>
                  <span className="text-[7.5px] font-mono text-zinc-400">
                    {hoveredItem.percentage}%
                  </span>
                </>
              ) : (
                <>
                  <span className="font-display text-lg sm:text-xl font-black text-fg-primary leading-none">
                    {totalVaultItems}
                  </span>
                  <span className="text-[8.5px] font-semibold text-fg-muted uppercase tracking-wider mt-0.5">
                    Assets
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Compact 2x2 Label Data Grid Positioned Directly Below the Donut Chart */}
          <div className="grid grid-cols-2 gap-1.5 w-full mt-2">
            {distribution.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-elevated/40 border border-subtle"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-fg-secondary truncate text-[10.5px]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span className="font-mono font-bold text-[11px] text-fg-primary">
                    {item.count}
                  </span>
                  <span className="font-mono text-[9px] text-fg-muted">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zero-Knowledge Vault Storage Telemetry Callout */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-2 text-xs text-fg-secondary">
        <ShieldCheck size={15} weight="duotone" className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-[10.5px] leading-relaxed">
          <strong className="text-fg-primary font-semibold">Zero-Knowledge Storage:</strong>{' '}
          All {totalVaultItems} vault assets are encrypted client-side and persisted in Cloudflare D1 with AES-GCM-256. Neither edge workers nor network proxies can decrypt secrets in plaintext.
        </div>
      </div>
    </div>
  );
};

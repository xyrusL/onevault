import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ChartPieSlice,
  ChartBar,
  ChartLineUp,
  Trash,
} from '@phosphor-icons/react';
import { NoteChartConfig } from '../../types/notes.types';

interface NoteChartWidgetProps {
  chart: NoteChartConfig;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}

const DEFAULT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
];

export const NoteChartWidget: React.FC<NoteChartWidgetProps> = ({
  chart,
  onRemove,
  readOnly = false,
}) => {
  const chartData = chart.data.map((item, index) => ({
    name: item.name,
    value: Number(item.value) || 0,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="my-3 rounded-xl border border-default bg-surface/90 shadow-xs overflow-hidden transition-all">
      {/* Widget Header with Type, Title and Remove Action */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-elevated/60 border-b border-subtle text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            {chart.type === 'pie' ? (
              <ChartPieSlice size={15} weight="duotone" />
            ) : chart.type === 'bar' ? (
              <ChartBar size={15} weight="duotone" />
            ) : (
              <ChartLineUp size={15} weight="duotone" />
            )}
          </div>
          <span className="font-bold text-fg-primary text-xs truncate">
            {chart.title || 'Interactive Chart'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 uppercase font-semibold">
            {chart.type}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-fg-muted">
            Total: <strong className="text-fg-primary">{totalValue.toLocaleString()}</strong>
          </span>

          {!readOnly && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(chart.id)}
              title="Remove chart from note"
              className="p-1 rounded-md text-fg-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            >
              <Trash size={13} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-4 bg-canvas/30">
        <div className="h-48 sm:h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === 'pie' ? (
              <PieChart>
                <Tooltip
                  wrapperStyle={{ pointerEvents: 'none', zIndex: 40 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as {
                        name: string;
                        value: number;
                        color: string;
                      };
                      const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';
                      return (
                        <div className="rounded-lg border border-default bg-surface-solid px-2.5 py-1.5 shadow-card text-xs font-mono">
                          <div className="flex items-center gap-1.5 font-semibold text-fg-primary">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}:</span>
                            <span className="text-accent">{item.value.toLocaleString()} ({pct}%)</span>
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
                  innerRadius={36}
                  outerRadius={65}
                  paddingAngle={3}
                  stroke="none"
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
            ) : chart.type === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickLine={false}
                  axisLine={{ stroke: '#444', opacity: 0.2 }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: 'none', zIndex: 40 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as {
                        name: string;
                        value: number;
                        color: string;
                      };
                      return (
                        <div className="rounded-lg border border-default bg-surface-solid px-2.5 py-1.5 shadow-card text-xs font-mono">
                          <div className="flex items-center gap-1.5 font-semibold text-fg-primary">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}:</span>
                            <span className="text-accent">{item.value.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickLine={false}
                  axisLine={{ stroke: '#444', opacity: 0.2 }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: 'none', zIndex: 40 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as {
                        name: string;
                        value: number;
                        color: string;
                      };
                      return (
                        <div className="rounded-lg border border-default bg-surface-solid px-2.5 py-1.5 shadow-card text-xs font-mono">
                          <div className="flex items-center gap-1.5 font-semibold text-fg-primary">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}:</span>
                            <span className="text-accent">{item.value.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend / Category breakdown list */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-2.5 border-t border-subtle">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-elevated/50 border border-subtle text-[11px] font-mono"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-fg-secondary truncate max-w-28">{item.name}</span>
              <span className="font-bold text-fg-primary">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

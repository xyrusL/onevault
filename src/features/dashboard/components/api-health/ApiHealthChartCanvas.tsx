import React from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ApiLiveTelemetryPoint } from '../../types/dashboard.types';

export interface EndpointMeta {
  key: 'notes' | 'mail' | 'twoFactor' | 'auth' | 'backup' | 'domains';
  name: string;
  category: 'notes' | 'mail' | 'two_factor' | 'auth' | 'backup' | 'system';
  path: string;
  color: string;
  gradientId: string;
}

interface ApiHealthChartCanvasProps {
  history: ApiLiveTelemetryPoint[];
  activeCurves: EndpointMeta[];
  selectedKeys: string[];
  onSelectIncident: (incident: ApiLiveTelemetryPoint['incidentDetails']) => void;
}

export const ApiHealthChartCanvas: React.FC<ApiHealthChartCanvasProps> = ({
  history,
  activeCurves,
  selectedKeys,
  onSelectIncident,
}) => {
  return (
    <div className="h-48 sm:h-52 w-full rounded-2xl bg-[#09090c] border border-default p-2 sm:p-3 overflow-hidden relative shadow-inner ov-smooth-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={history}
          margin={{ top: 10, right: 12, left: -22, bottom: 4 }}
        >
          <defs>
            {/* 6 Unique Gradient Fills for the 6 APIs */}
            {activeCurves.map((ep) => (
              <linearGradient
                key={ep.gradientId}
                id={ep.gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={ep.color}
                  stopOpacity={
                    selectedKeys.length === 1
                      ? 0.42
                      : selectedKeys.length === 2
                      ? 0.28
                      : 0.16
                  }
                />
                <stop offset="95%" stopColor={ep.color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            tick={{ fontSize: 9.5, fill: '#71717a' }}
            interval="preserveStartEnd"
            minTickGap={42}
            dy={4}
          />
          <YAxis
            domain={[0, 'dataMax + 15']}
            tick={{ fontSize: 10, fill: 'var(--color-fg-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            isAnimationActive
            animationDuration={100}
            cursor={{
              stroke: 'rgba(255, 255, 255, 0.25)',
              strokeWidth: 1,
              strokeDasharray: '3 3',
            }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as ApiLiveTelemetryPoint;
                const incident = data.incidentDetails;

                const targetCurves = incident
                  ? activeCurves.filter(
                      (ep) =>
                        ep.path === incident.endpoint ||
                        ep.key === incident.endpoint ||
                        (ep.key === 'twoFactor' &&
                          (incident.endpoint === '/api/two-factor' ||
                            incident.endpoint === '/api/2fa'))
                    )
                  : activeCurves;

                const displayCurves = targetCurves.length > 0 ? targetCurves : activeCurves;

                return (
                  <div className="rounded-xl border border-white/10 bg-[#0d0d12]/95 p-2.5 shadow-2xl text-xs font-mono backdrop-blur-md space-y-1.5 min-w-[200px] max-w-[280px] pointer-events-none">
                    <div className="flex items-center justify-between pb-1 border-b border-white/10 text-[10px] text-fg-muted font-bold">
                      <span>{data.time}</span>
                      <span className={incident ? (incident.type === 'outage' ? 'text-red-400' : 'text-orange-400') : 'text-emerald-400'}>
                        {incident
                          ? (incident.type === 'outage' ? 'Outage Incident' : 'Warning Event')
                          : `${displayCurves.length} ${displayCurves.length === 1 ? 'API Active' : 'APIs Active'}`}
                      </span>
                    </div>

                    {/* Compact Incident Highlight Card: Only displays the specific problem with NO unrelated clutter */}
                    {incident && (
                      <div
                        className={`p-1.5 rounded-lg border text-[10px] space-y-1 ${
                          incident.type === 'outage'
                            ? 'bg-red-500/15 border-red-500/40 text-red-300'
                            : 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="uppercase tracking-wide flex items-center gap-1 text-[9.5px]">
                            <span
                              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                incident.type === 'outage' ? 'bg-red-400 animate-ping' : 'bg-orange-400'
                              }`}
                            />
                            {incident.type === 'outage' ? 'Outage' : 'Warning'} · {incident.endpoint}
                          </span>
                          <span className="text-white font-mono text-[10px]">{incident.latencyMs}ms</span>
                        </div>
                        <div className="font-semibold text-white leading-tight text-[10px] truncate max-w-[220px]">
                          {incident.title}
                        </div>
                        {/* Clean text status preview */}
                        <div className="text-[9px] font-mono pt-0.5 border-t border-white/10">
                          <span className={incident.type === 'outage' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                            Status: {incident.type === 'outage' ? 'Service Disrupted' : 'Degraded Warning'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Display ONLY the relevant curves: if incident, shows only the affected curve with no unrelated APIs */}
                    <div className={`grid ${displayCurves.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-3 gap-y-1`}>
                      {displayCurves.map((ep) => {
                        const val =
                          (data[ep.key as keyof ApiLiveTelemetryPoint] as number) ??
                          20;
                        const isMatchingCurve =
                          incident?.endpoint === ep.path ||
                          incident?.endpoint === ep.key ||
                          (ep.key === 'twoFactor' &&
                            (incident?.endpoint === '/api/two-factor' ||
                              incident?.endpoint === '/api/2fa'));
                        const isErrPoint =
                          isMatchingCurve && incident?.type === 'outage';
                        const isWarnPoint =
                          isMatchingCurve && incident?.type === 'warning';

                        return (
                          <div
                            key={ep.key}
                            className="flex items-center justify-between gap-1 text-[10.5px]"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: ep.color }}
                              />
                              <span className="text-zinc-300 truncate text-[10px]">
                                {ep.name.replace(' API', '')}
                              </span>
                            </div>
                            <span
                              className={`font-bold font-mono ${
                                isErrPoint
                                  ? 'text-red-400 animate-pulse'
                                  : isWarnPoint
                                  ? 'text-orange-400'
                                  : 'text-zinc-100'
                              }`}
                            >
                              {val}ms
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Monotone curves and red/orange incident dots */}
          {activeCurves.map((ep) => (
            <Area
              key={ep.key}
              type="monotone"
              dataKey={ep.key}
              name={ep.name}
              stroke={ep.color}
              strokeWidth={
                selectedKeys.length === 1
                  ? 2.5
                  : selectedKeys.includes(ep.key)
                  ? 2.2
                  : 1.8
              }
              fill={`url(#${ep.gradientId})`}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const incident = payload.incidentDetails;

                const isMatchingCurve =
                  incident &&
                  (incident.endpoint === ep.path ||
                    incident.endpoint === ep.key ||
                    (ep.key === 'twoFactor' &&
                      (incident.endpoint === '/api/two-factor' ||
                        incident.endpoint === '/api/2fa')));

                // Show Red Dot for Outage on the relevant curve
                if (incident && incident.type === 'outage' && isMatchingCurve) {
                  return (
                    <g
                      key={`dot-outage-${cx}-${ep.key}`}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectIncident(incident);
                      }}
                    >
                      {/* Static outer glow halo with pointerEvents none to eliminate jitter/glitching */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill="#ef4444"
                        opacity={0.3}
                        pointerEvents="none"
                      />
                      {/* Core solid dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                }

                // Show Orange Dot for Warning on the relevant curve
                if (incident && incident.type === 'warning' && isMatchingCurve) {
                  return (
                    <g
                      key={`dot-warning-${cx}-${ep.key}`}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectIncident(incident);
                      }}
                    >
                      {/* Static outer glow halo with pointerEvents none to eliminate jitter/glitching */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill="#f97316"
                        opacity={0.3}
                        pointerEvents="none"
                      />
                      {/* Core solid dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill="#f97316"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                }

                return null;
              }}
              isAnimationActive
              animationDuration={300}
              animationEasing="ease-out"
              activeDot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

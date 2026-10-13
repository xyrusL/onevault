import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { ImmuneActorRecord } from '../../types/dashboard.types';

export interface ThreatVelocityDataPoint {
  time: string;
  timestamp: number;
  legitimate: number;
  scans: number;
  exploits: number;
  incident?: ImmuneActorRecord;
}

interface ThreatVelocityChartProps {
  data: ThreatVelocityDataPoint[];
  onSelectIncident: (actor: ImmuneActorRecord) => void;
}

interface HoveredDotState {
  x: number;
  y: number;
  incident: ImmuneActorRecord;
  time: string;
  type: 'scan' | 'exploit';
}

export const ThreatVelocityChart: React.FC<ThreatVelocityChartProps> = ({
  data,
  onSelectIncident,
}) => {
  // Track strictly ONE hovered dot at a time (zero multi-dot column interference)
  const [hoveredDot, setHoveredDot] = useState<HoveredDotState | null>(null);

  return (
    <div className="h-48 sm:h-52 w-full bg-[#0b0b10] rounded-xl border border-white/5 p-2 overflow-hidden relative shadow-inner">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 18, left: -20, bottom: 2 }}
        >
          <defs>
            {/* Emerald Gradient for Legitimate Traffic */}
            <linearGradient id="legitAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>

            {/* Amber Gradient for Scanners / Rate-Limits */}
            <linearGradient id="scansAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>

            {/* Rose Gradient for Blocked Exploits */}
            <linearGradient id="exploitsAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            tick={{ fontSize: 9.5, fill: '#71717a' }}
            interval="preserveStartEnd"
            minTickGap={35}
            dy={4}
          />
          <YAxis
            domain={[0, 'dataMax + 25']}
            tick={{ fontSize: 9.5, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
          />

          {/* 1. Legitimate Traffic Area (Emerald) — Zero hover dots */}
          <Area
            type="monotone"
            dataKey="legitimate"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#legitAreaGrad)"
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />

          {/* 2. Scanners & Rate-Limits (Amber) — Only hover this single dot when cursor touches it */}
          <Area
            type="monotone"
            dataKey="scans"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#scansAreaGrad)"
            isAnimationActive={false}
            activeDot={false}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const incident = payload?.incident as ImmuneActorRecord | undefined;
              if (
                incident &&
                (incident.action === 'TEMP_QUARANTINE' || incident.action === 'RATE_LIMITED') &&
                typeof cx === 'number' &&
                typeof cy === 'number'
              ) {
                const isHovered =
                  hoveredDot?.incident.id === incident.id && hoveredDot?.type === 'scan';
                return (
                  <g
                    key={`dot-scan-${cx}-${props.index}`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => {
                      setHoveredDot({
                        x: cx,
                        y: cy,
                        incident,
                        time: payload.time,
                        type: 'scan',
                      });
                    }}
                    onMouseLeave={() => setHoveredDot(null)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectIncident(incident);
                    }}
                  >
                    {/* Glowing outer halo */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 14 : 10}
                      fill="#f59e0b"
                      opacity={isHovered ? 0.45 : 0.25}
                      className="transition-all duration-150"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 8 : 6.5}
                      fill="#f59e0b"
                      opacity={isHovered ? 0.8 : 0.55}
                      className="transition-all duration-150"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5.5 : 4.5}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2.2 : 1.8}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              }
              return (
                <circle
                  key={`dot-scan-empty-${props.index}`}
                  cx={cx || 0}
                  cy={cy || 0}
                  r={0}
                  opacity={0}
                />
              );
            }}
          />

          {/* 3. Exploits Dropped (Rose / Red) — Only hover this single dot when cursor touches it */}
          <Area
            type="monotone"
            dataKey="exploits"
            stroke="#f43f5e"
            strokeWidth={2.2}
            strokeDasharray="4 2"
            fill="url(#exploitsAreaGrad)"
            isAnimationActive={false}
            activeDot={false}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const incident = payload?.incident as ImmuneActorRecord | undefined;
              if (
                incident &&
                incident.action === 'PENETRATION_BLOCK' &&
                typeof cx === 'number' &&
                typeof cy === 'number'
              ) {
                const isHovered =
                  hoveredDot?.incident.id === incident.id && hoveredDot?.type === 'exploit';
                return (
                  <g
                    key={`dot-exploit-${cx}-${props.index}`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => {
                      setHoveredDot({
                        x: cx,
                        y: cy,
                        incident,
                        time: payload.time,
                        type: 'exploit',
                      });
                    }}
                    onMouseLeave={() => setHoveredDot(null)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectIncident(incident);
                    }}
                  >
                    {/* Glowing pulsing beacon */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 16 : 12}
                      fill="#f43f5e"
                      opacity={isHovered ? 0.45 : 0.3}
                      className="transition-all duration-150"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 9.5 : 7.5}
                      fill="#f43f5e"
                      opacity={isHovered ? 0.85 : 0.65}
                      className="transition-all duration-150"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 5}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2.5 : 2}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              }
              return (
                <circle
                  key={`dot-exploit-empty-${props.index}`}
                  cx={cx || 0}
                  cy={cy || 0}
                  r={0}
                  opacity={0}
                />
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Floating Single-Dot Threat Preview Card — Only displayed when hovering ONE specific dot */}
      {hoveredDot && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-150"
          style={{
            top: Math.max(6, Math.min(hoveredDot.y - 70, 72)),
            ...(hoveredDot.x > 260
              ? { right: `calc(100% - ${hoveredDot.x - 14}px)` }
              : { left: `${hoveredDot.x + 14}px` }),
          }}
        >
          <div
            className={`rounded-xl border p-2.5 shadow-2xl text-xs font-mono backdrop-blur-md space-y-1.5 w-[250px] sm:w-[275px] bg-[#0d0d12]/95 ${
              hoveredDot.type === 'exploit'
                ? 'border-rose-500/50 shadow-rose-950/40'
                : 'border-amber-500/50 shadow-amber-950/40'
            }`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/10 text-[10px]">
              <span className="text-zinc-400 font-bold">{hoveredDot.time} (Incident Time)</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[9.5px] ${
                  hoveredDot.type === 'exploit'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {hoveredDot.type === 'exploit' ? 'Exploit Blocked (403)' : 'Scan Quarantined (429)'}
              </span>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-white">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      hoveredDot.type === 'exploit' ? 'bg-rose-400 animate-ping' : 'bg-amber-400'
                    }`}
                  />
                  {hoveredDot.incident.actorIp} ({hoveredDot.incident.countryCode})
                </span>
                <span className="text-white">Score: {hoveredDot.incident.riskScore}</span>
              </div>

              <div className="text-zinc-200 truncate font-semibold">
                {hoveredDot.incident.detectionVector}
              </div>

              <div className="text-zinc-400 truncate text-[9.5px]">
                Target: {hoveredDot.incident.targetPaths.join(', ')}
              </div>
            </div>

            <div className="text-[9.5px] text-zinc-400 pt-1 border-t border-white/10 flex items-center justify-between font-mono">
              <span>Intercepted</span>
              <span className="text-zinc-300 font-semibold">{hoveredDot.incident.requestCount} attempts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

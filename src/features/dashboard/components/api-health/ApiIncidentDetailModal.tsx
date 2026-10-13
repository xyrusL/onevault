import React from 'react';
import { WarningCircle, XCircle } from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';
import {
  resolveApiStatusDescriptor,
  type SharedApiCategory,
} from '../../../../shared/constants/api-status-catalog';
import type { ApiLiveTelemetryPoint } from '../../types/dashboard.types';

interface ApiIncidentDetailModalProps {
  incident: ApiLiveTelemetryPoint['incidentDetails'] | null;
  onClose: () => void;
}

const inferCategoryFromEndpoint = (endpointPath: string): SharedApiCategory => {
  if (endpointPath.includes('notes')) return 'notes';
  if (endpointPath.includes('mail')) return 'mail';
  if (endpointPath.includes('two-factor') || endpointPath.includes('2fa')) return 'two_factor';
  if (endpointPath.includes('auth')) return 'auth';
  if (endpointPath.includes('backup')) return 'backup';
  return 'system';
};

export const ApiIncidentDetailModal: React.FC<ApiIncidentDetailModalProps> = ({
  incident,
  onClose,
}) => {
  if (!incident) return null;

  const isOutage = incident.type === 'outage';
  const inferredDesc = resolveApiStatusDescriptor({
    category: inferCategoryFromEndpoint(incident.endpoint),
    level: isOutage ? 'error' : 'warning',
    title: incident.title,
    message: incident.description,
  });

  const statusText = incident.statusText || inferredDesc.statusText;
  const statusCode = incident.statusCode || inferredDesc.statusCode;
  const rootCause = incident.rootCause || inferredDesc.rootCause;
  const resolution = incident.resolution || inferredDesc.resolution;

  return (
    <BaseModal
      isOpen={!!incident}
      onClose={onClose}
      title={isOutage ? 'Service Outage Incident' : 'Latency Warning Alert'}
      subtitle={`${incident.endpoint} · Recorded at ${incident.timestamp}`}
      icon={
        isOutage ? (
          <XCircle size={18} weight="fill" className="text-red-400" />
        ) : (
          <WarningCircle size={18} weight="fill" className="text-amber-400" />
        )
      }
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-fg-muted">
            Status:{' '}
            <span className="text-emerald-400 font-semibold">
              {incident.resolved ? 'Auto-Recovered at Edge' : statusText}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-surface border border-default hover:bg-elevated text-xs font-medium text-fg-primary transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-3.5 font-sans">
        {/* Incident Summary Card */}
        <div
          className={`p-3 rounded-xl border text-xs ${
            isOutage
              ? 'bg-red-500/10 border-red-500/25 text-red-200'
              : 'bg-orange-500/10 border-orange-500/25 text-orange-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5 font-mono flex-wrap">
            <span className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOutage ? 'bg-red-500 animate-ping' : 'bg-orange-500'
                }`}
              />
              {statusText} · HTTP {statusCode}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
              {incident.resolved ? 'Auto-Recovered' : 'Action Recommended'}
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm leading-tight mb-1">
            {incident.title}
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            {incident.description}
          </p>
        </div>

        {/* Plain-English Root Cause & Resolution Breakdown */}
        <div className="space-y-2 rounded-xl bg-elevated/40 border border-subtle p-3 text-xs">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Root Cause (Why This Happened)
            </div>
            <p className="text-fg-secondary mt-0.5 leading-relaxed">{rootCause}</p>
          </div>
          <div className="pt-2 border-t border-subtle/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Resolution &amp; Recovery
            </div>
            <p className="text-fg-secondary mt-0.5 leading-relaxed">{resolution}</p>
          </div>
        </div>

        {/* Diagnostic Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-elevated/60 border border-subtle">
            <div className="text-[10px] text-fg-muted uppercase">Target Endpoint</div>
            <div className="font-semibold text-fg-primary mt-0.5">{incident.endpoint}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-elevated/60 border border-subtle">
            <div className="text-[10px] text-fg-muted uppercase">Recorded Latency</div>
            <div className="font-semibold text-amber-400 mt-0.5">{incident.latencyMs}ms spike</div>
          </div>
          <div className="p-2.5 rounded-xl bg-elevated/60 border border-subtle">
            <div className="text-[10px] text-fg-muted uppercase">Logged Timestamp</div>
            <div className="font-semibold text-fg-primary mt-0.5">{incident.timestamp}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-elevated/60 border border-subtle">
            <div className="text-[10px] text-fg-muted uppercase">Status Classification</div>
            <div className="font-semibold text-emerald-400 mt-0.5 truncate" title={statusText}>
              {statusText} ({statusCode})
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};


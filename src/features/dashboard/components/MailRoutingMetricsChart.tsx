import React from 'react';
import {
  PaperPlaneTilt,
  Tray,
  EnvelopeSimple,
  Info,
  At,
  ChatCircleText,
} from '@phosphor-icons/react';
import type { DashboardMailStats } from '../types/dashboard.types';

interface MailRoutingMetricsChartProps {
  mail: DashboardMailStats;
}

export const MailRoutingMetricsChart: React.FC<MailRoutingMetricsChartProps> = ({
  mail,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-default bg-surface p-4">
      {/* Header - Aligned height & border line */}
      <div>
        <div className="flex items-center justify-between min-h-[34px] pb-3 border-b border-subtle gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <PaperPlaneTilt size={18} weight="duotone" className="text-blue-500 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-fg-primary truncate whitespace-nowrap">
              Email Routing Topology
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10.5px] font-mono font-medium whitespace-nowrap shrink-0">
            Worker Relay
          </span>
        </div>

        {/* Visual Percentage Progress Bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-fg-secondary">
            <span>Routing Distribution</span>
            <span className="font-mono text-[11px]">
              {mail.forwardPercentage}% Forwarded · {mail.directPercentage}% Direct Inbox
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-elevated overflow-hidden flex border border-subtle p-0.5">
            <div
              className="h-full rounded-l-full bg-blue-500 transition-all duration-500"
              style={{ width: `${mail.forwardPercentage}%` }}
              title={`Forwarded: ${mail.forwardedAccounts} accounts (${mail.forwardPercentage}%)`}
            />
            <div
              className="h-full rounded-r-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${mail.directPercentage}%` }}
              title={`Direct Vault Inbox: ${mail.directInboxAccounts} accounts (${mail.directPercentage}%)`}
            />
          </div>
        </div>

        {/* Detailed KPI Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3.5">
          {/* Forwarded accounts */}
          <div className="rounded-xl border border-subtle bg-elevated/40 p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-fg-secondary">
              <PaperPlaneTilt size={13} weight="duotone" className="text-blue-500 shrink-0" />
              <span className="font-medium truncate text-[11px]">Forwarded Mail</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xl sm:text-2xl font-bold text-fg-primary leading-none">
                  {mail.forwardedAccounts}
                </span>
                <span title="Accounts" className="inline-flex">
                  <At size={12} weight="bold" className="text-blue-400 shrink-0" />
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                {mail.forwardPercentage}%
              </span>
            </div>
            <p className="mt-1.5 text-[9.5px] text-fg-muted leading-tight">
              Cloudflare edge routes mail directly to external destination.
            </p>
          </div>

          {/* Direct Vault Inboxes ("None") */}
          <div className="rounded-xl border border-subtle bg-elevated/40 p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-fg-secondary">
              <Tray size={13} weight="duotone" className="text-emerald-500 shrink-0" />
              <span className="font-medium truncate text-[11px]">Direct Inboxes</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xl sm:text-2xl font-bold text-fg-primary leading-none">
                  {mail.directInboxAccounts}
                </span>
                <span title="Inboxes" className="inline-flex">
                  <Tray size={12} weight="bold" className="text-emerald-400 shrink-0" />
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                {mail.directPercentage}%
              </span>
            </div>
            <p className="mt-1.5 text-[9.5px] text-fg-muted leading-tight">
              Stored and parsed into SQLite D1 database without external forwarding.
            </p>
          </div>

          {/* Received Inbound in D1 */}
          <div className="rounded-xl border border-subtle bg-elevated/40 p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-fg-secondary">
              <EnvelopeSimple size={13} weight="duotone" className="text-accent shrink-0" />
              <span className="font-medium truncate text-[11px]">Received in D1</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xl sm:text-2xl font-bold text-fg-primary leading-none">
                  {mail.totalReceivedMessages}
                </span>
                <span title="Messages" className="inline-flex">
                  <ChatCircleText size={12} weight="bold" className="text-accent shrink-0" />
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 shrink-0">
                {mail.unreadMessages > 0 ? `${mail.unreadMessages} new` : 'synced'}
              </span>
            </div>
            <p className="mt-1.5 text-[9.5px] text-fg-muted leading-tight">
              Inbound emails captured and encrypted at Cloudflare worker edge.
            </p>
          </div>
        </div>
      </div>

      {/* Edge Routing Explanation Callout */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-500/5 border border-blue-500/15 p-2 text-xs text-fg-secondary">
        <Info size={15} weight="duotone" className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-[10.5px] leading-relaxed">
          <strong className="text-fg-primary font-semibold">How Telemetry Tracks Inbound Mail:</strong>{' '}
          Mailboxes configured with <span className="font-mono text-accent">None</span> save encrypted email MIME bodies directly into OneVault's D1 storage. Forwarded mailboxes route via Cloudflare Email Routing rules without retaining plaintext bodies in storage.
        </div>
      </div>
    </div>
  );
};

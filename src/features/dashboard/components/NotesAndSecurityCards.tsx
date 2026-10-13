import React from 'react';
import {
  FolderSimple,
  Key,
  NotePencil,
  ShieldCheck,
} from '@phosphor-icons/react';
import type {
  DashboardNotesStats,
  DashboardTwoFactorStats,
} from '../types/dashboard.types';
import type { PortalSectionId } from '../../../shared/layouts/portal-layout';

interface NotesAndSecurityCardsProps {
  notes: DashboardNotesStats;
  twoFactor: DashboardTwoFactorStats;
  onNavigate?: (section: PortalSectionId) => void;
}

const COLOR_MAP: Record<string, { label: string; bg: string }> = {
  default: { label: 'Slate', bg: '#71717a' },
  coral: { label: 'Coral', bg: '#f87171' },
  peach: { label: 'Peach', bg: '#fb923c' },
  sand: { label: 'Sand', bg: '#facc15' },
  mint: { label: 'Mint', bg: '#4ade80' },
  sage: { label: 'Sage', bg: '#2dd4bf' },
  sky: { label: 'Sky', bg: '#38bdf8' },
  lavender: { label: 'Lavender', bg: '#a78bfa' },
  blush: { label: 'Blush', bg: '#f472b6' },
  yellow: { label: 'Yellow', bg: '#eab308' },
  purple: { label: 'Purple', bg: '#9333ea' },
  blue: { label: 'Blue', bg: '#2563eb' },
};

export const NotesAndSecurityCards: React.FC<NotesAndSecurityCardsProps> = ({
  notes,
  twoFactor,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* 1. Notes Organization Breakdown */}
      <div className="flex flex-col justify-between rounded-xl border border-default bg-surface p-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2">
              <NotePencil size={18} weight="duotone" className="text-purple-500" />
              <h2 className="text-xs sm:text-sm font-bold text-fg-primary">
                Notes & Knowledge Categorization
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('notes')}
              className="text-xs font-semibold text-purple-500 hover:text-purple-400 cursor-pointer"
            >
              Open Notes →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-lg bg-elevated/40 border border-subtle p-2 text-center">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider font-semibold block">
                Total Notes
              </span>
              <span className="font-display text-lg font-bold text-fg-primary">
                {notes.totalNotes}
              </span>
            </div>
            <div className="rounded-lg bg-elevated/40 border border-subtle p-2 text-center">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider font-semibold block">
                Folders
              </span>
              <span className="font-display text-lg font-bold text-purple-500">
                {notes.totalFolders}
              </span>
            </div>
            <div className="rounded-lg bg-elevated/40 border border-subtle p-2 text-center">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider font-semibold block">
                Pinned
              </span>
              <span className="font-display text-lg font-bold text-amber-500">
                {notes.pinnedNotes}
              </span>
            </div>
          </div>

          {/* Color Themes breakdown */}
          <div className="mt-3.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-fg-secondary block">
              Color Categories
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {notes.colorBreakdown.map((item) => {
                const conf = COLOR_MAP[item.color] ?? {
                  label: item.color,
                  bg: '#888888',
                };
                return (
                  <span
                    key={item.color}
                    className="inline-flex items-center gap-1.5 rounded-md border border-subtle bg-elevated/60 px-2 py-1 text-xs text-fg-primary"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: conf.bg }}
                    />
                    <span className="capitalize">{conf.label}</span>
                    <span className="font-mono text-[10px] text-fg-muted">
                      ({item.count})
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent notes list snippet */}
        <div className="mt-3.5 pt-3 border-t border-subtle space-y-1.5">
          <span className="text-[11px] font-semibold text-fg-secondary block">
            Recently Updated Notes
          </span>
          {notes.recentNotes.length === 0 ? (
            <p className="text-xs text-fg-muted italic">No notes created yet.</p>
          ) : (
            notes.recentNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onNavigate?.('notes')}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-elevated transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: COLOR_MAP[note.color]?.bg ?? '#71717a',
                    }}
                  />
                  <span className="font-medium text-fg-primary truncate">
                    {note.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-fg-muted shrink-0">
                  {note.folderName && (
                    <span className="inline-flex items-center gap-1 rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px]">
                      <FolderSimple size={10} />
                      {note.folderName}
                    </span>
                  )}
                  <span>
                    {new Date(note.updatedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. 2FA Authenticator & Security Posture */}
      <div className="flex flex-col justify-between rounded-xl border border-default bg-surface p-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2">
              <Key size={18} weight="duotone" className="text-indigo-400" />
              <h2 className="text-xs sm:text-sm font-bold text-fg-primary">
                2FA & Security Telemetry
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('two-factor')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              Open 2FA →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-lg bg-elevated/40 border border-subtle p-2.5 text-center">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider font-semibold block">
                Active Authenticators
              </span>
              <span className="font-display text-xl font-bold text-fg-primary">
                {twoFactor.totalTokens}
              </span>
            </div>
            <div className="rounded-lg bg-elevated/40 border border-subtle p-2.5 text-center">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider font-semibold block">
                Unique Issuers
              </span>
              <span className="font-display text-xl font-bold text-indigo-400">
                {twoFactor.uniqueIssuers}
              </span>
            </div>
          </div>

          {/* Top 2FA Issuers */}
          <div className="mt-3.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-fg-secondary block">
              Configured Providers
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {twoFactor.topIssuers.length === 0 ? (
                <span className="text-xs text-fg-muted italic">
                  No 2FA authenticators enrolled yet.
                </span>
              ) : (
                twoFactor.topIssuers.map((item) => (
                  <span
                    key={item.issuer}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 border border-indigo-500/25 px-2 py-1 text-xs text-fg-primary font-medium"
                  >
                    <ShieldCheck size={12} className="text-indigo-400" />
                    <span>{item.issuer}</span>
                    <span className="font-mono text-[10px] text-fg-muted">
                      ({item.count})
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Security Health status box */}
        <div className="mt-3.5 pt-3 border-t border-subtle space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-fg-secondary font-medium">TOTP Engine Status</span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RFC 6238 Compliant
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-fg-secondary font-medium">Secret Encryption</span>
            <span className="inline-flex items-center gap-1 text-sky-500 font-semibold text-[11px]">
              Cloudflare Edge Guarded
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

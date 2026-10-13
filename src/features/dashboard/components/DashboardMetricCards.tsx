import React from 'react';
import {
  EnvelopeSimple,
  Tray,
  Key,
  NotePencil,
  ShieldCheck,
  ArrowUpRight,
  ArrowsSplit,
  FolderSimple,
} from '@phosphor-icons/react';
import type { DashboardStats } from '../types/dashboard.types';
import type { PortalSectionId } from '../../../shared/layouts/portal-layout';

interface DashboardMetricCardsProps {
  stats: DashboardStats;
  onNavigate?: (section: PortalSectionId) => void;
}

export const DashboardMetricCards: React.FC<DashboardMetricCardsProps> = ({
  stats,
  onNavigate,
}) => {
  const { mail, twoFactor, notes } = stats;

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. DEDICATED MOBILE UI (< sm / Mobile Viewport)                       */}
      {/* Purpose-built 2x2 compact matrix to eliminate wasted vertical space    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {/* Mobile Card 1: Mail Accounts */}
        <div
          onClick={() => onNavigate?.('mail')}
          className="group relative flex flex-col justify-between rounded-xl border border-default bg-surface p-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <EnvelopeSimple size={15} weight="duotone" />
            </div>
            <ArrowUpRight size={13} weight="bold" className="text-fg-muted group-hover:text-accent" />
          </div>

          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-extrabold text-fg-primary tracking-tight">
                {mail.totalAccounts}
              </span>
              <span className="text-[10px] text-fg-muted">mailboxes</span>
            </div>
            <div className="text-[11px] font-semibold text-fg-primary truncate">
              Mail Accounts
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-subtle flex flex-wrap items-center gap-1 text-[9px]">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-500/10 text-blue-500 px-1.5 py-0.5 font-medium">
              <ArrowsSplit size={10} />
              {mail.forwardedAccounts} Fwd ({mail.forwardPercentage}%)
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 font-medium">
              <Tray size={10} />
              {mail.directInboxAccounts} Direct
            </span>
          </div>
        </div>

        {/* Mobile Card 2: Received Inbound Emails */}
        <div
          onClick={() => onNavigate?.('mail')}
          className="group relative flex flex-col justify-between rounded-xl border border-default bg-surface p-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Tray size={15} weight="duotone" />
            </div>
            <ArrowUpRight size={13} weight="bold" className="text-fg-muted group-hover:text-accent" />
          </div>

          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-extrabold text-fg-primary tracking-tight">
                {mail.totalReceivedMessages}
              </span>
              <span className="text-[10px] text-fg-muted">in D1</span>
            </div>
            <div className="text-[11px] font-semibold text-fg-primary truncate">
              Received Inbound
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-subtle flex items-center gap-1 text-[9px]">
            {mail.unreadMessages > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-500 px-1.5 py-0.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                {mail.unreadMessages} Unread
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/10 dark:bg-white/10 text-fg-secondary px-1.5 py-0.5 font-medium">
                All Read
              </span>
            )}
            <span className="text-[9px] text-fg-muted truncate">D1 Inbox</span>
          </div>
        </div>

        {/* Mobile Card 3: 2FA TOTP Tokens */}
        <div
          onClick={() => onNavigate?.('two-factor')}
          className="group relative flex flex-col justify-between rounded-xl border border-default bg-surface p-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Key size={15} weight="duotone" />
            </div>
            <ArrowUpRight size={13} weight="bold" className="text-fg-muted group-hover:text-accent" />
          </div>

          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-extrabold text-fg-primary tracking-tight">
                {twoFactor.totalTokens}
              </span>
              <span className="text-[10px] text-fg-muted">authenticators</span>
            </div>
            <div className="text-[11px] font-semibold text-fg-primary truncate">
              2FA TOTP Tokens
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-subtle flex items-center gap-1 text-[9px]">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 font-medium">
              <ShieldCheck size={10} />
              {twoFactor.uniqueIssuers} Issuers
            </span>
            <span className="text-[9px] text-fg-muted">30s TOTP</span>
          </div>
        </div>

        {/* Mobile Card 4: Encrypted Notes */}
        <div
          onClick={() => onNavigate?.('notes')}
          className="group relative flex flex-col justify-between rounded-xl border border-default bg-surface p-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <NotePencil size={15} weight="duotone" />
            </div>
            <ArrowUpRight size={13} weight="bold" className="text-fg-muted group-hover:text-accent" />
          </div>

          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-extrabold text-fg-primary tracking-tight">
                {notes.totalNotes}
              </span>
              <span className="text-[10px] text-fg-muted">documents</span>
            </div>
            <div className="text-[11px] font-semibold text-fg-primary truncate">
              Encrypted Notes
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-subtle flex items-center gap-1 text-[9px]">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-purple-500/10 text-purple-500 px-1.5 py-0.5 font-medium">
              <FolderSimple size={10} />
              {notes.totalFolders} Folders
            </span>
            {notes.pinnedNotes > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 font-medium">
                {notes.pinnedNotes} Pinned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. DEDICATED DESKTOP / WEB UI (>= sm: Tablet & Desktop Monitor)       */}
      {/* Preserves 100% of original web beauty, spacing, proportions & labels  */}
      {/* ===================================================================== */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Web Card 1: Mail Accounts */}
        <div
          onClick={() => onNavigate?.('mail')}
          className="group relative flex flex-col justify-between rounded-xl border border-default bg-surface p-4 transition-all duration-200 hover:border-accent/40 hover:shadow-card cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <EnvelopeSimple size={20} weight="duotone" />
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-fg-muted group-hover:text-accent transition-colors">
              Manage Mail
              <ArrowUpRight size={12} weight="bold" />
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg-primary tracking-tight">
                {mail.totalAccounts}
              </span>
              <span className="text-xs text-fg-muted">mailboxes</span>
            </div>
            <div className="text-xs font-semibold text-fg-primary mt-0.5">
              Mail Accounts
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-subtle flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 text-blue-500 px-1.5 py-0.5 font-medium">
              <ArrowsSplit size={11} />
              {mail.forwardedAccounts} Forwarded ({mail.forwardPercentage}%)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 font-medium">
              <Tray size={11} />
              {mail.directInboxAccounts} Direct
            </span>
          </div>
        </div>

        {/* Web Card 2: Received Inbound Messages */}
        <div
          onClick={() => onNavigate?.('mail')}
          className="group relative flex flex-col justify-between rounded-xl border border-default bg-surface p-4 transition-all duration-200 hover:border-accent/40 hover:shadow-card cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Tray size={20} weight="duotone" />
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-fg-muted group-hover:text-accent transition-colors">
              Vault Inbox
              <ArrowUpRight size={12} weight="bold" />
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg-primary tracking-tight">
                {mail.totalReceivedMessages}
              </span>
              <span className="text-xs text-fg-muted">in D1 database</span>
            </div>
            <div className="text-xs font-semibold text-fg-primary mt-0.5">
              Received Inbound Emails
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-subtle flex flex-wrap items-center gap-1.5 text-[10px]">
            {mail.unreadMessages > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-500 px-1.5 py-0.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                {mail.unreadMessages} Unread
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/10 dark:bg-white/10 text-fg-secondary px-1.5 py-0.5 font-medium">
                All Read
              </span>
            )}
            <span className="text-[10px] text-fg-muted truncate">
              (From Direct "None" Inboxes)
            </span>
          </div>
        </div>

        {/* Web Card 3: 2FA Authenticator */}
        <div
          onClick={() => onNavigate?.('two-factor')}
          className="group relative flex flex-col justify-between rounded-xl border border-default bg-surface p-4 transition-all duration-200 hover:border-accent/40 hover:shadow-card cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Key size={20} weight="duotone" />
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-fg-muted group-hover:text-accent transition-colors">
              View 2FA
              <ArrowUpRight size={12} weight="bold" />
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg-primary tracking-tight">
                {twoFactor.totalTokens}
              </span>
              <span className="text-xs text-fg-muted">authenticators</span>
            </div>
            <div className="text-xs font-semibold text-fg-primary mt-0.5">
              2FA TOTP Tokens
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-subtle flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 font-medium">
              <ShieldCheck size={11} />
              {twoFactor.uniqueIssuers} Unique Issuers
            </span>
            <span className="text-[10px] text-fg-muted">
              Live 30s TOTP Clock
            </span>
          </div>
        </div>

        {/* Web Card 4: Encrypted Notes */}
        <div
          onClick={() => onNavigate?.('notes')}
          className="group relative flex flex-col justify-between rounded-xl border border-default bg-surface p-4 transition-all duration-200 hover:border-accent/40 hover:shadow-card cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <NotePencil size={20} weight="duotone" />
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-fg-muted group-hover:text-accent transition-colors">
              Open Notes
              <ArrowUpRight size={12} weight="bold" />
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg-primary tracking-tight">
                {notes.totalNotes}
              </span>
              <span className="text-xs text-fg-muted">documents</span>
            </div>
            <div className="text-xs font-semibold text-fg-primary mt-0.5">
              Encrypted Notes
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-subtle flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 text-purple-500 px-1.5 py-0.5 font-medium">
              <FolderSimple size={11} />
              {notes.totalFolders} Folders
            </span>
            {notes.pinnedNotes > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 font-medium">
                {notes.pinnedNotes} Pinned
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

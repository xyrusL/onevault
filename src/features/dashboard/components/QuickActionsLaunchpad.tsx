import React from 'react';
import {
  EnvelopeSimple,
  Globe,
  Key,
  Lightning,
  NotePencil,
} from '@phosphor-icons/react';
import type { PortalSectionId } from '../../../shared/layouts/portal-layout';

interface QuickActionsLaunchpadProps {
  onNavigate?: (section: PortalSectionId) => void;
}

export const QuickActionsLaunchpad: React.FC<QuickActionsLaunchpadProps> = ({
  onNavigate,
}) => {
  const actions = [
    {
      label: 'New Email Alias',
      description: 'Create Cloudflare routing rule',
      icon: <EnvelopeSimple size={16} weight="duotone" className="text-blue-500" />,
      section: 'mail' as const,
      hoverClass: 'hover:border-blue-500/40 hover:bg-blue-500/5',
    },
    {
      label: 'Add 2FA Token',
      description: 'Enroll TOTP secret or scan QR',
      icon: <Key size={16} weight="duotone" className="text-amber-500" />,
      section: 'two-factor' as const,
      hoverClass: 'hover:border-amber-500/40 hover:bg-amber-500/5',
    },
    {
      label: 'New Encrypted Note',
      description: 'Rich-text note with checklists',
      icon: <NotePencil size={16} weight="duotone" className="text-purple-500" />,
      section: 'notes' as const,
      hoverClass: 'hover:border-purple-500/40 hover:bg-purple-500/5',
    },
    {
      label: 'Domain Manager',
      description: 'Manage DNS records & subdomains',
      icon: <Globe size={16} weight="duotone" className="text-emerald-500" />,
      section: 'domains' as const,
      hoverClass: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
    },
  ];

  return (
    <div className="rounded-xl border border-default bg-surface p-4">
      <div className="flex items-center gap-2 pb-3 border-b border-subtle">
        <Lightning size={18} weight="fill" className="text-amber-500" />
        <h2 className="text-xs sm:text-sm font-bold text-fg-primary">
          Quick Actions Launchpad
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3">
        {actions.map((act) => (
          <button
            key={act.label}
            type="button"
            onClick={() => onNavigate?.(act.section)}
            className={`flex items-start gap-2.5 rounded-lg border border-subtle bg-elevated/40 p-2.5 text-left transition-all duration-150 cursor-pointer ${act.hoverClass}`}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface border border-subtle shrink-0">
              {act.icon}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-fg-primary block truncate">
                {act.label}
              </span>
              <span className="text-[10px] text-fg-muted block truncate mt-0.5">
                {act.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

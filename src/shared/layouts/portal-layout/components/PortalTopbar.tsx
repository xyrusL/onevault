import React from 'react';
import {
  CornersIn,
  CornersOut,
  SidebarSimple,
  UserCircle,
} from '@phosphor-icons/react';
import { OneVaultLogo } from '../../../components/brand/OneVaultLogo';
import { ThemeControlPill } from '../../../components/theme-controls/ThemeControlPill';
import { PORTAL_NAV_ITEMS } from '../config/navigation.config';
import { PortalSectionId } from '../types/portal-navigation.types';

interface PortalTopbarProps {
  activeSection: PortalSectionId;
  userEmail: string;
  isSidebarCollapsed: boolean;
  isFullView: boolean;
  onToggleCollapse: () => void;
  onToggleFullView: () => void;
  onSignOut?: () => void;
}

export const PortalTopbar: React.FC<PortalTopbarProps> = ({
  activeSection,
  userEmail,
  isSidebarCollapsed,
  isFullView,
  onToggleCollapse,
  onToggleFullView,
  onSignOut,
}) => {
  const activeItem = PORTAL_NAV_ITEMS.find((i) => i.id === activeSection);

  return (
    <header className="relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-default bg-surface backdrop-blur-xl px-3 sm:px-4">
      <div className="flex items-center gap-1.5">
        {/* Mobile Brand Logo & App Header */}
        <div className="md:hidden flex items-center gap-2 mr-1">
          <OneVaultLogo size="sm" />
          <span className="font-display text-sm font-semibold tracking-tight text-fg-primary">
            {activeItem?.label ?? 'OneVault'}
          </span>
        </div>

        {/* Desktop Sidebar Rail Toggle (Hidden on mobile) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:inline-flex group items-center justify-center rounded-md border border-default bg-elevated p-1.5 text-fg-secondary hover:text-fg-primary hover:border-strong hover:scale-105 cursor-pointer"
        >
          <SidebarSimple
            size={15}
            weight="duotone"
            className="transition-transform duration-200 group-hover:scale-105"
          />
        </button>

        {/* Desktop Full View Icon Toggle (Hidden on mobile) */}
        <button
          type="button"
          onClick={onToggleFullView}
          aria-label={isFullView ? 'Exit full view' : 'Enter full view'}
          title={isFullView ? 'Exit full view' : 'Enter full view'}
          className={`hidden md:inline-flex group items-center justify-center rounded-md border p-1.5 transition-all duration-200 hover:scale-105 cursor-pointer ${
            isFullView
              ? 'border-focus bg-accent text-accent-fg shadow-xs'
              : 'border-default bg-elevated text-fg-secondary hover:text-fg-primary hover:border-strong'
          }`}
        >
          {isFullView ? (
            <CornersIn
              size={15}
              weight="bold"
              className="transition-transform duration-200 group-hover:scale-95"
            />
          ) : (
            <CornersOut
              size={15}
              weight="bold"
              className="transition-transform duration-200 group-hover:scale-110"
            />
          )}
        </button>

        <div className="hidden md:block h-3.5 w-px bg-subtle mx-1" />

        {/* Desktop Section Title */}
        <span className="hidden md:inline font-display text-sm font-semibold tracking-tight text-fg-primary">
          {activeItem?.label ?? 'Dashboard'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden lg:inline-flex items-center rounded-md bg-elevated border border-subtle px-2.5 py-1 font-mono text-xs text-fg-secondary truncate max-w-48">
          {userEmail}
        </span>

        <ThemeControlPill />

        {/* Mobile Quick Sign-Out Button */}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out of OneVault"
            aria-label="Sign out"
            className="md:hidden inline-flex items-center justify-center rounded-md border border-default bg-elevated p-1.5 text-fg-muted hover:text-danger hover:border-danger/40 transition-colors cursor-pointer"
          >
            <UserCircle size={16} weight="duotone" />
          </button>
        )}
      </div>
    </header>
  );
};

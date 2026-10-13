import React from 'react';
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  UserCircle,
} from '@phosphor-icons/react';
import { OneVaultLogo } from '../../../components/brand/OneVaultLogo';
import { PORTAL_NAV_ITEMS } from '../config/navigation.config';
import { PortalSectionId } from '../types/portal-navigation.types';
import { PortalSidebarItem } from './PortalSidebarItem';

interface PortalSidebarProps {
  activeSection: PortalSectionId;
  onSelectSection: (section: PortalSectionId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  onSignOut,
}) => {
  return (
    <aside
      aria-label="Portal Navigation"
      className={`relative z-30 flex flex-col justify-between bg-surface backdrop-blur-xl border-r border-default transition-all duration-300 select-none shrink-0 ${
        isCollapsed ? 'w-[56px]' : 'w-[200px]'
      }`}
    >
      {/* Top: Custom OneVault Brand Logo + Collapse Button */}
      <div>
        <div
          className={`flex h-12 items-center border-b border-subtle px-2.5 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <OneVaultLogo size="sm" />
            {!isCollapsed && (
              <span className="font-display text-sm font-semibold tracking-tight text-fg-primary truncate">
                OneVault
              </span>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="group rounded-md p-1 text-fg-muted hover:bg-elevated hover:text-fg-primary transition-all duration-200 cursor-pointer"
            >
              <CaretDoubleLeft
                size={14}
                weight="bold"
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-2 space-y-1">
          {PORTAL_NAV_ITEMS.map((item) => (
            <PortalSidebarItem
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              isCollapsed={isCollapsed}
              onSelect={() => onSelectSection(item.id)}
            />
          ))}
        </nav>
      </div>

      {/* Bottom: Expand Toggle & Sign Out with Hover Effects + Tooltips */}
      <div className="p-2 border-t border-subtle space-y-1">
        {isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="group relative flex w-full items-center justify-center rounded-lg border border-transparent p-2 text-fg-secondary hover:bg-elevated hover:text-fg-primary hover:border-default transition-all duration-200 cursor-pointer"
          >
            <CaretDoubleRight
              size={15}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
            <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-surface-solid border border-default px-2.5 py-1 text-xs font-medium text-fg-primary shadow-card opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
              Expand
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className={`group relative flex w-full items-center rounded-lg border border-transparent text-fg-secondary hover:bg-elevated hover:text-danger hover:border-default transition-all duration-200 cursor-pointer ${
            isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-2'
          }`}
        >
          <UserCircle
            size={18}
            weight="duotone"
            className="shrink-0 transition-transform duration-200 group-hover:scale-110"
          />
          {!isCollapsed && (
            <span className="truncate text-sm font-medium transition-transform duration-200 group-hover:translate-x-0.5">
              Sign Out
            </span>
          )}
          {isCollapsed && (
            <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-surface-solid border border-default px-2.5 py-1 text-xs font-medium text-danger shadow-card opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

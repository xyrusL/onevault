import React from 'react';
import { PortalNavItem } from '../types/portal-navigation.types';

interface PortalSidebarItemProps {
  item: PortalNavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onSelect: () => void;
}

export const PortalSidebarItem: React.FC<PortalSidebarItemProps> = ({
  item,
  isActive,
  isCollapsed,
  onSelect,
}) => {
  const IconComponent = item.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex w-full items-center rounded-lg border transition-all duration-200 cursor-pointer ${
        isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-2'
      } ${
        isActive
          ? 'bg-accent text-accent-fg border-transparent font-medium shadow-xs'
          : 'border-transparent text-fg-secondary hover:bg-elevated hover:text-fg-primary hover:border-default hover:shadow-xs'
      }`}
    >
      {/* Left animated hover/active indicator bar */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 ${
          isActive
            ? 'h-4 bg-accent-fg opacity-90'
            : 'h-0 bg-accent opacity-0 group-hover:h-3.5 group-hover:opacity-100'
        }`}
      />

      <IconComponent
        size={17}
        weight={isActive ? 'fill' : 'duotone'}
        className={`shrink-0 transition-transform duration-200 ${
          isCollapsed
            ? 'group-hover:scale-110'
            : 'group-hover:scale-110 group-hover:translate-x-0.5'
        }`}
      />

      {!isCollapsed && (
        <span className="truncate text-sm tracking-tight transition-transform duration-200 group-hover:translate-x-0.5">
          {item.label}
        </span>
      )}

      {/* Instant smooth floating tooltip when sidebar is collapsed */}
      {isCollapsed && (
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-surface-solid border border-default px-2.5 py-1 text-xs font-medium text-fg-primary shadow-card opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
          {item.label}
        </span>
      )}
    </button>
  );
};

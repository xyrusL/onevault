import React from 'react';
import { PORTAL_NAV_ITEMS } from '../config/navigation.config';
import { PortalSectionId } from '../types/portal-navigation.types';

interface PortalMobileNavProps {
  activeSection: PortalSectionId;
  onSelectSection: (section: PortalSectionId) => void;
}

/**
 * Dedicated Mobile Bottom Navigation Bar (App Dock)
 *
 * Appears only on mobile devices (< md screen width) to give OneVault
 * a native mobile app feel. Renders the 6 core portal modules with
 * touch-optimized targets and active state indicators.
 */
export const PortalMobileNav: React.FC<PortalMobileNavProps> = ({
  activeSection,
  onSelectSection,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-2xl border-t border-default px-2 py-1 select-none shadow-lg transition-transform duration-200"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {PORTAL_NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-accent font-semibold'
                  : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-accent/15 text-accent shadow-xs'
                    : 'text-fg-secondary hover:bg-elevated'
                }`}
              >
                <Icon size={18} weight={isActive ? 'fill' : 'duotone'} />
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight truncate leading-tight ${
                  isActive ? 'text-accent font-semibold' : 'text-fg-muted'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React, { useState } from 'react';
import { Power, Warning } from '@phosphor-icons/react';
import { PortalHexagonBg } from '../../components/backgrounds/PortalHexagonBg';
import { BaseModal } from '../../components/modals/BaseModal';
import { PortalMobileNav } from './components/PortalMobileNav';
import { PortalSidebar } from './components/PortalSidebar';
import { PortalTopbar } from './components/PortalTopbar';
import { PortalSectionId } from './types/portal-navigation.types';

interface PortalLayoutProps {
  activeSection: PortalSectionId;
  onSelectSection: (section: PortalSectionId) => void;
  userEmail: string;
  onSignOut: () => void;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  activeSection,
  onSelectSection,
  userEmail,
  onSignOut,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullView, setIsFullView] = useState(false);
  const [isConfirmSignOutOpen, setIsConfirmSignOutOpen] = useState(false);

  const handleToggleCollapse = () => {
    if (isFullView) {
      setIsFullView(false);
      setIsSidebarCollapsed(false);
      return;
    }
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleToggleFullView = () => {
    setIsFullView((prev) => !prev);
  };

  const handleOpenSignOutModal = () => {
    setIsConfirmSignOutOpen(true);
  };

  const handleConfirmSignOut = () => {
    setIsConfirmSignOutOpen(false);
    onSignOut();
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Uploaded 3D Hexagonal Portal Background */}
      <PortalHexagonBg />

      {/* Desktop Collapsible Sidebar (Hidden on Mobile) */}
      {!isFullView && (
        <div className="hidden md:flex shrink-0">
          <PortalSidebar
            activeSection={activeSection}
            onSelectSection={onSelectSection}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
            onSignOut={handleOpenSignOutModal}
          />
        </div>
      )}

      {/* Main Content Area — optimized for desktop and mobile */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0 transition-all duration-300">
        <PortalTopbar
          activeSection={activeSection}
          userEmail={userEmail}
          isSidebarCollapsed={isSidebarCollapsed}
          isFullView={isFullView}
          onToggleCollapse={handleToggleCollapse}
          onToggleFullView={handleToggleFullView}
          onSignOut={handleOpenSignOutModal}
        />

        {/* Content area: pb-20 on mobile preserves a clean gap above the fixed bottom dock */}
        <main className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-4 pb-20 md:pb-4">
          <div className="w-full flex-1 flex flex-col">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile devices) */}
      <PortalMobileNav
        activeSection={activeSection}
        onSelectSection={onSelectSection}
      />

      {/* Sign Out Confirmation Modal */}
      <BaseModal
        isOpen={isConfirmSignOutOpen}
        onClose={() => setIsConfirmSignOutOpen(false)}
        title="Sign Out Confirmation"
        subtitle="End your active OneVault session"
        icon={<Power size={18} weight="bold" className="text-danger" />}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsConfirmSignOutOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:border-strong transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger hover:text-white transition-all duration-150 cursor-pointer shadow-xs"
            >
              <Power size={14} weight="bold" />
              Sign Out
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-500 text-xs">
            <Warning size={18} weight="fill" className="shrink-0 mt-0.5 text-amber-500" />
            <p className="leading-relaxed">
              Are you sure you want to sign out? You will need to enter your credentials again to access your encrypted vaults, mail accounts, and notes.
            </p>
          </div>
          <div className="rounded-lg border border-subtle bg-elevated/40 px-3 py-2 text-xs text-fg-secondary">
            Current account: <span className="font-mono text-fg-primary font-medium">{userEmail}</span>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};


import React, { useState } from 'react';
import { DashboardView } from '../features/dashboard';
import { ProjectsView } from '../features/projects';
import { MailView } from '../features/mail';
import { DomainsView } from '../features/domains';
import { NotesView } from '../features/notes';
import { SettingsView } from '../features/settings';
import { TwoFactorView } from '../features/two-factor';
import {
  PortalLayout,
  PortalSectionId,
} from '../shared/layouts/portal-layout';

interface AdminPortalRouterProps {
  userEmail: string;
  onSignOut: () => void;
  activeSection?: PortalSectionId;
  onSelectSection?: (section: PortalSectionId) => void;
}

export const AdminPortalRouter: React.FC<AdminPortalRouterProps> = ({
  userEmail,
  onSignOut,
  activeSection: controlledSection,
  onSelectSection: controlledOnSelect,
}) => {
  const [internalSection, setInternalSection] =
    useState<PortalSectionId>('dashboard');

  const activeSection = controlledSection ?? internalSection;
  const handleSelectSection = (section: PortalSectionId) => {
    if (controlledOnSelect) {
      controlledOnSelect(section);
    } else {
      setInternalSection(section);
    }
  };

  const renderActiveFeature = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView onNavigate={handleSelectSection} />;
      case 'projects':
        return <ProjectsView />;
      case 'mail':
        return <MailView />;
      case 'domains':
      case 'tmail':
        return <DomainsView />;
      case 'two-factor':
        return <TwoFactorView />;
      case 'notes':
        return <NotesView />;
      case 'settings':
        return <SettingsView />;
    }
  };

  return (
    <PortalLayout
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      userEmail={userEmail}
      onSignOut={onSignOut}
    >
      <div key={activeSection} className="animate-portal-view flex-1 flex flex-col">
        {renderActiveFeature()}
      </div>
    </PortalLayout>
  );
};

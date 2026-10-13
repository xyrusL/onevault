import React, { useState } from 'react';
import { SettingsHeader } from './components/SettingsHeader';
import { AccountSettingsTab } from './components/AccountSettingsTab';
import { BackupImportTab } from './components/BackupImportTab';
import type { SettingsTabId } from './types/settings.types';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('account');

  return (
    <div className="space-y-6">
      <SettingsHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'account' ? (
        <AccountSettingsTab onNavigateToBackup={() => setActiveTab('backup-import')} />
      ) : (
        <BackupImportTab />
      )}
    </div>
  );
};

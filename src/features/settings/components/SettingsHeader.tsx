import React from 'react';
import { ShieldCheck, Database, GearSix } from '@phosphor-icons/react';
import type { SettingsTabId } from '../types/settings.types';

interface SettingsHeaderProps {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted border border-accent/20 text-accent">
          <GearSix size={22} weight="duotone" />
        </div>
        <div>
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg-primary">
            Settings
          </h1>
          <p className="font-mono text-xs text-fg-secondary">
            Account credentials, security verification, and vault backup &amp; migration.
          </p>
        </div>
      </div>

      {/* Tab Switcher Pills */}
      <div className="grid grid-cols-2 sm:inline-flex sm:w-auto items-center p-1 rounded-xl bg-surface-solid border border-default shadow-xs shrink-0">
        <button
          type="button"
          onClick={() => onTabChange('account')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'account'
              ? 'bg-accent text-accent-fg shadow-xs font-semibold'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated'
          }`}
        >
          <ShieldCheck size={15} weight={activeTab === 'account' ? 'fill' : 'regular'} />
          <span className="truncate">Account &amp; Security</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('backup-import')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'backup-import'
              ? 'bg-accent text-accent-fg shadow-xs font-semibold'
              : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated'
          }`}
        >
          <Database size={15} weight={activeTab === 'backup-import' ? 'fill' : 'regular'} />
          <span className="truncate">Backup &amp; Import</span>
        </button>
      </div>
    </div>
  );
};

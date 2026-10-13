import React from 'react';
import { ArrowLeft, Plus, Trash } from '@phosphor-icons/react';
import { MailFolderInfo } from '../types/mail.types';
import { SubdomainIcon } from './SubdomainIcon';

interface MailFolderDetailHeaderProps {
  folder: MailFolderInfo;
  onBack: () => void;
  onCreateMail: () => void;
  onRequestDeleteSubdomain?: (folder: MailFolderInfo) => void;
}

export const MailFolderDetailHeader: React.FC<MailFolderDetailHeaderProps> = ({
  folder,
  onBack,
  onCreateMail,
  onRequestDeleteSubdomain,
}) => {
  const title = folder.isRoot
    ? `@${folder.rootDomain}`
    : `@${folder.fullDomain}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface border border-default rounded-xl p-3.5 shadow-card">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          title="Back to all folders"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-default bg-elevated hover:bg-surface-solid text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} weight="bold" />
        </button>

        <SubdomainIcon
          name={folder.subdomainPart || folder.rootDomain}
          isRoot={folder.isRoot}
          size={20}
          className="h-9 w-9 shadow-xs"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-semibold text-fg-primary truncate leading-tight">
              {title}
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-elevated border border-default text-fg-secondary">
              {folder.isRoot ? 'Root Domain' : 'Subdomain Folder'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-fg-muted truncate">
            {folder.totalEmails} {folder.totalEmails === 1 ? 'address' : 'addresses'} routing through Cloudflare
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        {!folder.isRoot && onRequestDeleteSubdomain && (
          <button
            type="button"
            onClick={() => onRequestDeleteSubdomain(folder)}
            title={`Delete subdomain @${folder.fullDomain}`}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-default bg-elevated hover:bg-danger hover:text-white hover:border-danger text-fg-secondary px-2.5 py-2 sm:py-1.5 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash size={14} weight="duotone" />
            <span className="hidden sm:inline">Delete Subdomain</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCreateMail}
          className="group flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg px-3.5 py-2 sm:py-1.5 text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
        >
          <Plus
            size={14}
            weight="bold"
            className="transition-transform duration-200 group-hover:rotate-90"
          />
          <span className="leading-none">New Email in {folder.subdomainPart || folder.rootDomain}</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { FolderOpen, Plus, Trash } from '@phosphor-icons/react';
import { MailFolderInfo } from '../types/mail.types';
import { resolveSubdomainTheme, SubdomainIcon } from './SubdomainIcon';

interface MailFolderCardProps {
  folder: MailFolderInfo;
  onOpenFolder: (folder: MailFolderInfo) => void;
  onCreateMailInFolder: (folder: MailFolderInfo) => void;
  onRequestDeleteSubdomain?: (folder: MailFolderInfo) => void;
}

export const MailFolderCard: React.FC<MailFolderCardProps> = ({
  folder,
  onOpenFolder,
  onCreateMailInFolder,
  onRequestDeleteSubdomain,
}) => {
  const displayName = folder.isRoot
    ? `@${folder.rootDomain}`
    : folder.subdomainPart || folder.fullDomain;

  const subtitle = folder.isRoot ? 'Root Domain' : `@${folder.fullDomain}`;
  const theme = resolveSubdomainTheme(
    folder.fullDomain,
    folder.isRoot
  );

  return (
    <div
      onClick={() => onOpenFolder(folder)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenFolder(folder);
        }
      }}
      className="group relative flex flex-col justify-between rounded-xl bg-surface-solid hover:bg-elevated/75 border border-default hover:border-strong p-3.5 sm:p-4 transition-all duration-200 cursor-pointer shadow-card select-none overflow-hidden"
    >
      <div>
        {/* Top Row: Icon + Domain/Subdomain Name + Email Count Badge */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <SubdomainIcon
              name={folder.fullDomain}
              isRoot={folder.isRoot}
              size={18}
              className="h-9 w-9 shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            <div className="min-w-0">
              <h3 className="font-display text-sm font-semibold truncate leading-tight">
                {folder.isRoot ? (
                  <span className={theme.domainTextClass}>@{folder.rootDomain}</span>
                ) : (
                  <span className="text-fg-primary">{displayName}</span>
                )}
              </h3>
              <p className="mt-0.5 font-mono text-[11px] truncate leading-tight">
                {folder.isRoot ? (
                  <span className="text-fg-muted">Root Domain</span>
                ) : (
                  <span className={theme.domainTextClass}>@{folder.fullDomain}</span>
                )}
              </p>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 shrink-0 rounded-full font-medium border ${
              folder.totalEmails > 0
                ? theme.badgeClass
                : 'bg-surface border-subtle text-fg-muted'
            }`}
          >
            {folder.totalEmails} {folder.totalEmails === 1 ? 'address' : 'addresses'}
          </span>
        </div>
      </div>

      {/* Bottom Actions Row */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-subtle">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCreateMailInFolder(folder);
          }}
          title={`Create new email in ${subtitle}`}
          className="inline-flex items-center gap-1 rounded-md bg-elevated hover:bg-sky-500/15 hover:text-sky-300 border border-default hover:border-sky-500/40 px-2 py-1 text-xs font-medium text-fg-secondary transition-all duration-150 cursor-pointer"
        >
          <Plus size={12} weight="bold" />
          <span>New Email</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Subdomain Delete Trigger (only for subdomains, not root domains) */}
          {!folder.isRoot && onRequestDeleteSubdomain && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDeleteSubdomain(folder);
              }}
              title={`Delete subdomain @${folder.fullDomain}`}
              aria-label="Delete subdomain"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-default bg-elevated text-fg-muted hover:text-danger hover:border-danger/40 transition-colors cursor-pointer"
            >
              <Trash size={12} weight="duotone" />
            </button>
          )}

          {/* View Folder Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFolder(folder);
            }}
            title={`View ${subtitle}`}
            aria-label={`View ${subtitle}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-default bg-elevated text-fg-muted hover:text-sky-300 hover:border-sky-500/40 hover:bg-sky-500/15 group-hover:border-strong group-hover:text-fg-primary transition-all duration-150 cursor-pointer"
          >
            <FolderOpen size={13} weight="duotone" />
          </button>
        </div>
      </div>
    </div>
  );
};

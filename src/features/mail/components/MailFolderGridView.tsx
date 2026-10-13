import React, { useMemo } from 'react';
import { Globe, Plus } from '@phosphor-icons/react';
import { MailAccountItem, MailDomain, MailFolderInfo } from '../types/mail.types';
import { MailFolderCard } from './MailFolderCard';

interface MailFolderGridViewProps {
  accounts: MailAccountItem[];
  domains: MailDomain[];
  onOpenFolder: (folder: MailFolderInfo) => void;
  onCreateMailInFolder: (folder: MailFolderInfo) => void;
  onOpenCreateSubdomain: (rootDomain?: string) => void;
  onRequestDeleteSubdomain?: (folder: MailFolderInfo) => void;
}

interface RootDomainGroup {
  rootDomain: string;
  totalEmails: number;
  folders: MailFolderInfo[];
}

export const MailFolderGridView: React.FC<MailFolderGridViewProps> = ({
  accounts,
  domains,
  onOpenFolder,
  onCreateMailInFolder,
  onOpenCreateSubdomain,
  onRequestDeleteSubdomain,
}) => {
  const groups = useMemo<RootDomainGroup[]>(() => {
    // 1. Identify all root domains
    const rootList = domains.filter(
      (d) =>
        !domains.some(
          (other) => other.name !== d.name && d.name.endsWith(`.${other.name}`)
        )
    );

    // If no root domains identified from list, fallback to unique domains in accounts
    const effectiveRoots =
      rootList.length > 0
        ? rootList
        : Array.from(new Set(accounts.map((a) => a.domain))).map((d) => ({
            id: d,
            name: d,
            status: 'active',
          }));

    return effectiveRoots.map((root) => {
      const rootName = root.name;

      // Find all subdomains belonging to this root domain
      const subdomains = domains.filter(
        (d) => d.name !== rootName && d.name.endsWith(`.${rootName}`)
      );

      // Also discover any subdomains that might exist in accounts but not yet in domains
      for (const account of accounts) {
        if (
          account.domain !== rootName &&
          account.domain.endsWith(`.${rootName}`) &&
          !subdomains.some((s) => s.name === account.domain)
        ) {
          subdomains.push({
            id: account.domain,
            name: account.domain,
            status: 'active',
          });
        }
      }

      // Root domain folder
      const rootFolder: MailFolderInfo = {
        fullDomain: rootName,
        rootDomain: rootName,
        subdomainPart: null,
        isRoot: true,
        totalEmails: accounts.filter((a) => a.domain.toLowerCase() === rootName.toLowerCase()).length,
      };

      // Subdomain folders
      const subFolders: MailFolderInfo[] = subdomains
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((sub) => {
          const prefix = sub.name.slice(0, -(rootName.length + 1));
          return {
            fullDomain: sub.name,
            rootDomain: rootName,
            subdomainPart: prefix,
            isRoot: false,
            totalEmails: accounts.filter((a) => a.domain.toLowerCase() === sub.name.toLowerCase()).length,
          };
        });

      const allFolders = [rootFolder, ...subFolders];
      const totalEmails = allFolders.reduce((sum, f) => sum + f.totalEmails, 0);

      return {
        rootDomain: rootName,
        totalEmails,
        folders: allFolders,
      };
    });
  }, [accounts, domains]);

  if (groups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-surface border border-default p-12 text-center">
        <Globe size={32} weight="duotone" className="text-fg-muted mb-3" />
        <h3 className="text-sm font-semibold text-fg-primary">No Domains Found</h3>
        <p className="mt-1 text-xs text-fg-muted max-w-sm">
          Connect your Cloudflare account to view and organize your email routing domains and subdomains.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.rootDomain} className="space-y-3">
          {/* Domain Section Header */}
          <div className="flex items-center justify-between gap-3 border-b border-subtle pb-2">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-fg-primary">
                @{group.rootDomain}
              </span>
              <span className="text-xs text-fg-muted">
                • {group.folders.length} {group.folders.length === 1 ? 'folder' : 'folders'} ({group.totalEmails} {group.totalEmails === 1 ? 'address' : 'addresses'})
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenCreateSubdomain(group.rootDomain)}
              className="inline-flex items-center gap-1 rounded-md border border-default bg-elevated hover:bg-surface-solid px-2.5 py-1 text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
            >
              <Plus size={12} weight="bold" />
              <span>New Subdomain</span>
            </button>
          </div>

          {/* Grid of Folders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {group.folders.map((folder) => (
              <MailFolderCard
                key={folder.fullDomain}
                folder={folder}
                onOpenFolder={onOpenFolder}
                onCreateMailInFolder={onCreateMailInFolder}
                onRequestDeleteSubdomain={onRequestDeleteSubdomain}
              />
            ))}

            {/* Quick Add Subdomain Card at the End of the Grid */}
            <button
              type="button"
              onClick={() => onOpenCreateSubdomain(group.rootDomain)}
              className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-default hover:border-accent/60 bg-surface/50 hover:bg-elevated/40 p-6 min-h-36 transition-all duration-200 cursor-pointer text-center"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-elevated group-hover:bg-accent/15 border border-default group-hover:border-accent/30 text-fg-secondary group-hover:text-accent transition-colors mb-2">
                <Plus size={16} weight="bold" />
              </div>
              <span className="text-xs font-semibold text-fg-primary group-hover:text-accent transition-colors">
                Add Subdomain
              </span>
              <span className="text-[11px] text-fg-muted mt-0.5 font-mono">
                *.{group.rootDomain}
              </span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

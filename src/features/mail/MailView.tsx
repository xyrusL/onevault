import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EnvelopeSimple,
  FileText,
  FolderPlus,
  Plus,
  Pulse,
  Trash,
  Tray,
  WarningCircle,
} from '@phosphor-icons/react';
import { BaseModal } from '../../shared/components/modals';
import { CreateMailModalContent } from './components/CreateMailModalContent';
import { CreateSubdomainModalContent } from './components/CreateSubdomainModalContent';
import { DeleteMailModalContent } from './components/DeleteMailModalContent';
import { DeleteSubdomainModalContent } from './components/DeleteSubdomainModalContent';
import { MailAccountList } from './components/MailAccountList';
import { MailActivityList } from './components/MailActivityList';
import { MailDetailsModalContent } from './components/MailDetailsModalContent';
import { MailFolderDetailHeader } from './components/MailFolderDetailHeader';
import { MailFolderGridView } from './components/MailFolderGridView';
import { MailHeader } from './components/MailHeader';
import { MailInboxModalContent } from './components/MailInboxModalContent';
import { MailNotePadModalContent } from './components/MailNotePadModalContent';
import { MailAccountActivityModalContent } from './components/service-activity';
import { ServiceBadgeStyleProvider } from './context/ServiceBadgeStyleContext';
import { apiRequest } from '../../shared/services/api-client.service';
import { mailInboxService } from './services/mail-inbox.service';
import { mailService } from './services/mail.service';
import { MailActivityItem } from './types/mail-inbox.types';
import {
  accountMatchesSearch,
  buildServiceDetectionMap,
} from './utils/mail-service-detector.utils';
import {
  CreateMailPayload,
  CreateSubdomainPayload,
  DEFAULT_MAIL_FILTERS,
  ForwardTarget,
  isVaultDestination,
  MailAccountItem,
  MailDomain,
  MailFilterState,
  MailFolderInfo,
  MailSortOrder,
  MailViewMode,
  NO_FORWARD,
  UpdateMailPayload,
} from './types/mail.types';

export const MailView: React.FC = () => {
  const cached = mailService.getCached();
  const [accounts, setAccounts] = useState<MailAccountItem[]>(
    () => cached?.accounts ?? []
  );
  const [domains, setDomains] = useState<MailDomain[]>(
    () => cached?.domains ?? []
  );
  const [forwardTargets, setForwardTargets] = useState<ForwardTarget[]>(
    () => cached?.forwardTargets ?? []
  );
  const [activityItems, setActivityItems] = useState<MailActivityItem[]>(
    () => mailInboxService.getCachedActivity() ?? []
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !cached);
  const [isActivityRefreshing, setIsActivityRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // View state: All Addresses list vs. Folders Grid vs. Activity Feed
  const [viewMode, setViewMode] = useState<MailViewMode>('all');
  const [activeFolder, setActiveFolder] = useState<MailFolderInfo | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMailInitialDomain, setCreateMailInitialDomain] = useState<string | undefined>();
  const [isCreateSubdomainModalOpen, setIsCreateSubdomainModalOpen] = useState(false);
  const [createSubdomainRoot, setCreateSubdomainRoot] = useState<string>('');

  const [selectedAccount, setSelectedAccount] = useState<MailAccountItem | null>(null);
  const [notePadAccount, setNotePadAccount] = useState<MailAccountItem | null>(null);
  const [activityModalAccount, setActivityModalAccount] =
    useState<MailAccountItem | null>(null);
  const [inboxAccount, setInboxAccount] = useState<MailAccountItem | null>(null);
  const [initialInboxMessageId, setInitialInboxMessageId] = useState<string | null>(null);
  const [pendingDeleteAccount, setPendingDeleteAccount] =
    useState<MailAccountItem | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] =
    useState<MailFolderInfo | null>(null);

  const [sortOrder, setSortOrder] = useState<MailSortOrder>(() => {
    try {
      const saved = localStorage.getItem('onevault.mail.sort-order');
      if (saved === 'oldest' || saved === 'email-asc' || saved === 'email-desc') {
        return saved;
      }
    } catch {}
    return 'newest';
  });

  const handleSortOrderChange = (order: MailSortOrder) => {
    setSortOrder(order);
    try {
      localStorage.setItem('onevault.mail.sort-order', order);
    } catch {}
  };

  const [filters, setFilters] = useState<MailFilterState>(() => {
    try {
      const savedStr = localStorage.getItem('onevault.mail.filters');
      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        return {
          status: parsed.status || 'all',
          activity: parsed.activity || 'all',
          domains: Array.isArray(parsed.domains)
            ? parsed.domains
            : (parsed.domain && parsed.domain !== 'all' ? [parsed.domain] : []),
          services: Array.isArray(parsed.services)
            ? parsed.services
            : (parsed.service && parsed.service !== 'all' ? [parsed.service] : []),
        };
      }
    } catch {}
    return DEFAULT_MAIL_FILTERS;
  });

  const handleFilterChange = (newFilters: MailFilterState) => {
    setFilters(newFilters);
    // Auto-switch to 'all' (All Addresses) tab if user is currently on 'folders' or 'activity' or inside a folder
    if (viewMode !== 'all' || activeFolder !== null) {
      setViewMode('all');
      setActiveFolder(null);
    }
    try {
      localStorage.setItem('onevault.mail.filters', JSON.stringify(newFilters));
      // Track usage count for selected services so most-used services rank first
      if (newFilters.services && newFilters.services.length > 0) {
        const raw = localStorage.getItem('onevault.mail.filter_usage');
        const usage = raw ? JSON.parse(raw) : { services: {} };
        if (!usage.services) usage.services = {};
        for (const s of newFilters.services) {
          usage.services[s] = (usage.services[s] || 0) + 1;
        }
        localStorage.setItem('onevault.mail.filter_usage', JSON.stringify(usage));
      }
    } catch {}

    // Queue filter preferences to cloud automatically via modular sync write in mailService
    void mailService.savePreferences(newFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // If user enters a search query while on folders or inside a folder, auto-switch to All Addresses
    if (query.trim().length > 0 && (viewMode !== 'all' || activeFolder !== null)) {
      setViewMode('all');
      setActiveFolder(null);
    }
  };

  // Compute smart service detection map across all accounts & activity items
  const detectionMap = useMemo(() => {
    return buildServiceDetectionMap(accounts, activityItems);
  }, [accounts, activityItems]);

  // Available domains across all accounts
  const availableDomains = useMemo(() => {
    const set = new Set<string>();
    for (const acc of accounts) {
      if (acc.domain) set.add(acc.domain.toLowerCase());
    }
    return Array.from(set).sort();
  }, [accounts]);

  // Available service tags across all accounts, prioritized by frequency & user usage (most-used first)
  const availableServices = useMemo(() => {
    const accountCountMap = new Map<string, number>();
    for (const s of detectionMap.byAccountId.values()) {
      for (const tag of s.tags) {
        if (tag.name) {
          accountCountMap.set(tag.name, (accountCountMap.get(tag.name) || 0) + 1);
        }
      }
    }

    let userUsageMap: Record<string, number> = {};
    try {
      const raw = localStorage.getItem('onevault.mail.filter_usage');
      if (raw) {
        userUsageMap = JSON.parse(raw).services || {};
      }
    } catch {}

    const tags = Array.from(accountCountMap.keys());
    return tags.sort((a, b) => {
      const scoreA = ((userUsageMap[a] || 0) * 5) + (accountCountMap.get(a) || 0);
      const scoreB = ((userUsageMap[b] || 0) * 5) + (accountCountMap.get(b) || 0);
      if (scoreB !== scoreA) {
        return scoreB - scoreA; // Highest frequency / most used first
      }
      return a.localeCompare(b); // Alphabetical fallback
    });
  }, [detectionMap]);

  // Global search & multi-criteria filtering for accounts
  const filteredAccounts = useMemo(() => {
    let result = accounts;

    // 1. Text Search Query (email, forward, note, service tags)
    const q = searchQuery.trim();
    if (q) {
      result = result.filter((item) =>
        accountMatchesSearch(item, detectionMap.byAccountId.get(item.id), q)
      );
    }

    // 2. Status / Routing Filter
    if (filters.status === 'forwarding') {
      result = result.filter((item) => !isVaultDestination(item.forwardTo));
    } else if (filters.status === 'vault') {
      result = result.filter((item) => isVaultDestination(item.forwardTo));
    }

    // 3. Activity / Messages Filter
    if (filters.activity === 'with-activity') {
      result = result.filter(
        (item) => (detectionMap.byAccountId.get(item.id)?.totalIncomingCount ?? 0) > 0
      );
    } else if (filters.activity === 'no-activity') {
      result = result.filter(
        (item) => (detectionMap.byAccountId.get(item.id)?.totalIncomingCount ?? 0) === 0
      );
    }

    // 4. Domains Filter (Multi-Select)
    if (filters.domains && filters.domains.length > 0) {
      const allowed = new Set(filters.domains.map((d) => d.toLowerCase()));
      result = result.filter((item) => allowed.has(item.domain.toLowerCase()));
    }

    // 5. Service Tags Filter (Multi-Select)
    if (filters.services && filters.services.length > 0) {
      const allowed = new Set(filters.services.map((s) => s.toLowerCase()));
      result = result.filter((item) => {
        const summary = detectionMap.byAccountId.get(item.id);
        return summary?.tags.some((t) => allowed.has(t.name.toLowerCase()));
      });
    }

    return result;
  }, [accounts, searchQuery, detectionMap, filters]);

  // Sort accounts deterministically based on active sort order (defaulting to Newest First)
  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOrder === 'email-asc') {
        return a.email.localeCompare(b.email);
      }
      if (sortOrder === 'email-desc') {
        return b.email.localeCompare(a.email);
      }
      // default: newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredAccounts, sortOrder]);

  // Global search & status filtering for activity items
  const filteredActivity = useMemo(() => {
    let result = activityItems;

    // Text search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (item) =>
          item.recipientEmail.toLowerCase().includes(q) ||
          item.sender.toLowerCase().includes(q) ||
          item.senderName.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.forwardTo.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filters.status === 'forwarding') {
      result = result.filter((item) => !isVaultDestination(item.forwardTo));
    } else if (filters.status === 'vault') {
      result = result.filter((item) => isVaultDestination(item.forwardTo));
    }

    // Domains Filter (Multi-Select)
    if (filters.domains && filters.domains.length > 0) {
      const allowed = new Set(filters.domains.map((d) => d.toLowerCase()));
      result = result.filter((item) => {
        const domain = item.recipientEmail.split('@')[1]?.toLowerCase();
        return domain ? allowed.has(domain) : false;
      });
    }

    return result;
  }, [activityItems, searchQuery, filters]);

  // Unread activity count (turns the Activity tab green when > 0)
  const unreadActivityCount = useMemo(
    () => activityItems.filter((item) => !item.isRead).length,
    [activityItems]
  );

  // Current folder's accounts (when inside a folder drill-down)
  const currentFolderAccounts = useMemo(() => {
    if (!activeFolder) return sortedAccounts;
    return sortedAccounts.filter(
      (item) => item.domain.toLowerCase() === activeFolder.fullDomain.toLowerCase()
    );
  }, [sortedAccounts, activeFolder]);

  // Total folders count for header pill
  const totalFoldersCount = useMemo(() => {
    const rootList = domains.filter(
      (d) =>
        !domains.some(
          (other) => other.name !== d.name && d.name.endsWith(`.${other.name}`)
        )
    );
    return Math.max(domains.length, rootList.length);
  }, [domains]);

  const refreshActivity = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsActivityRefreshing(true);
    const minWait = showSpinner
      ? new Promise((r) => setTimeout(r, 750))
      : Promise.resolve();
    try {
      const [list] = await Promise.all([
        mailInboxService.listActivity(),
        minWait,
      ]);
      setActivityItems(list);
    } catch {
      // Keep existing cached activity on background poll error
    } finally {
      if (showSpinner) setIsActivityRefreshing(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    if (!mailService.getCached()?.accounts.length) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const [mail, doms, targets, activity] = await Promise.allSettled([
        mailService.list(),
        mailService.listDomains(),
        mailService.listForwardTargets(),
        mailInboxService.listActivity(),
      ]);

      if (mail.status === 'fulfilled') setAccounts(mail.value);
      if (doms.status === 'fulfilled') setDomains(doms.value);
      if (targets.status === 'fulfilled') setForwardTargets(targets.value);
      if (activity.status === 'fulfilled') setActivityItems(activity.value);

      const firstError = [mail, doms, targets].find(
        (r): r is PromiseRejectedResult => r.status === 'rejected'
      );
      if (firstError) {
        setLoadError(
          firstError.reason instanceof Error
            ? firstError.reason.message
            : 'Unable to load mail data.'
        );
      }

      // Restore cloud-saved filter preferences if available
      void apiRequest<{ preferences: MailFilterState | null }>('/mail/preferences')
        .then((res) => {
          if (res?.preferences) {
            setFilters((current) => {
              const isDefault =
                current.status === 'all' &&
                current.activity === 'all' &&
                current.domains.length === 0 &&
                current.services.length === 0;
              return isDefault ? res.preferences! : current;
            });
          }
        })
        .catch(() => {});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Background poll every 30s only while browser tab is active/visible (protects Cloudflare free tier quota)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void refreshActivity(false);
      }
    }, 30000);
    return () => window.clearInterval(timer);
  }, [refreshActivity]);

  // Mail account create & update
  const handleCreateMail = async (payload: CreateMailPayload) => {
    const created = await mailService.create(payload);
    setAccounts((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setCreateMailInitialDomain(undefined);
  };

  const handleUpdateMail = async (
    accountId: string,
    payload: UpdateMailPayload
  ) => {
    // Modular write: mailService automatically updates memory/storage cache and handles the debounced sync queue!
    const updated = await mailService.update(accountId, payload);

    setAccounts((prev) =>
      prev.map((item) => (item.id === accountId ? updated : item))
    );
    setSelectedAccount((prev) => (prev && prev.id === accountId ? updated : prev));
    setNotePadAccount((prev) => (prev && prev.id === accountId ? updated : prev));
    setActivityItems((prev) =>
      prev.map((act) =>
        act.mailAccountId === accountId
          ? { ...act, forwardTo: updated.forwardTo }
          : act
      )
    );
  };

  const handleOpenNote = (account: MailAccountItem) => {
    setNotePadAccount(account);
  };

  const handleOpenActivity = (account: MailAccountItem) => {
    setActivityModalAccount(account);
  };

  const handleRequestDelete = (account: MailAccountItem) => {
    setSelectedAccount(null);
    setPendingDeleteAccount(account);
  };

  const handleConfirmDelete = async (accountId: string) => {
    await mailService.remove(accountId);
    setAccounts((prev) => prev.filter((item) => item.id !== accountId));
    setActivityItems((prev) =>
      prev.filter((act) => act.mailAccountId !== accountId)
    );
    setPendingDeleteAccount(null);
    setSelectedAccount(null);
  };

  // Subdomain registration
  const handleCreateSubdomain = async (payload: CreateSubdomainPayload) => {
    const created = await mailService.createSubdomain(payload);
    const updatedDomains = await mailService.listDomains();
    setDomains(updatedDomains);
    setIsCreateSubdomainModalOpen(false);

    // Switch to folder view and open the newly created subdomain folder
    setViewMode('folders');
    setActiveFolder({
      fullDomain: created.fullDomain,
      rootDomain: created.rootDomain,
      subdomainPart: created.subdomain,
      isRoot: false,
      totalEmails: 0,
    });
  };

  const handleOpenCreateMail = (initialDomain?: string) => {
    setCreateMailInitialDomain(
      initialDomain || (activeFolder ? activeFolder.fullDomain : undefined)
    );
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateSubdomain = (rootDomain?: string) => {
    setCreateSubdomainRoot(rootDomain ?? '');
    setIsCreateSubdomainModalOpen(true);
  };

  const handleRequestDeleteSubdomain = (folder: MailFolderInfo) => {
    setPendingDeleteFolder(folder);
  };

  const handleConfirmDeleteSubdomain = async (fullDomain: string) => {
    await mailService.deleteSubdomain(fullDomain);
    setAccounts((prev) =>
      prev.filter((item) => item.domain.toLowerCase() !== fullDomain.toLowerCase())
    );
    setDomains((prev) =>
      prev.filter((d) => d.name.toLowerCase() !== fullDomain.toLowerCase())
    );
    if (activeFolder?.fullDomain.toLowerCase() === fullDomain.toLowerCase()) {
      setActiveFolder(null);
      setViewMode('folders');
    }
    setPendingDeleteFolder(null);
  };

  // Activity item click handler:
  // - Always marks the item as read
  // - If `forwardTo === 'None'`, opens the Inbox modal for that account
  // - If `forwardTo !== 'None'` (e.g. forwarded to Gmail), only marks it as read without opening modal
  const handleSelectActivity = (item: MailActivityItem) => {
    if (!item.isRead) {
      setActivityItems((prev) =>
        prev.map((act) => (act.id === item.id ? { ...act, isRead: true } : act))
      );
      void mailInboxService.markActivityRead(item.id).catch(() => {
        // ignore network hiccup; next refresh reconciles
      });
    }

    const isNoneTarget = isVaultDestination(item.forwardTo);
    if (isNoneTarget) {
      const targetAccount =
        accounts.find(
          (a) =>
            a.id === item.mailAccountId ||
            a.email.toLowerCase() === item.recipientEmail.toLowerCase()
        ) ?? {
          id: item.mailAccountId,
          localPart: item.recipientEmail.split('@')[0] || '',
          domain: item.recipientEmail.split('@')[1] || '',
          email: item.recipientEmail,
          forwardTo: NO_FORWARD,
          note: '',
          createdAt: new Date().toISOString(),
          createdDate: item.receivedDate,
          createdTime: item.receivedTime,
        };

      setInitialInboxMessageId(item.id);
      setInboxAccount(targetAccount);
    }
  };

  const handleMarkAllActivityRead = () => {
    setActivityItems((prev) => prev.map((act) => ({ ...act, isRead: true })));
    void mailInboxService.markAllActivityRead().catch(() => {
      // ignore network error
    });
  };

  const handleMessageReadFromInbox = useCallback((messageId: string) => {
    setActivityItems((prev) =>
      prev.map((act) => (act.id === messageId ? { ...act, isRead: true } : act))
    );
  }, []);

  const handleMessageDeletedFromInbox = useCallback((messageId: string) => {
    setActivityItems((prev) => prev.filter((act) => act.id !== messageId));
  }, []);

  return (
    <ServiceBadgeStyleProvider>
      <section className="flex-1 flex flex-col gap-3.5">
      {/* Top Header: Title, View Switcher (All vs Folders vs Activity), Search Bar, and Actions */}
      <MailHeader
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setActiveFolder(null);
          if (mode === 'activity') {
            void refreshActivity(false);
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCreateClick={() => handleOpenCreateMail()}
        onCreateSubdomainClick={() => handleOpenCreateSubdomain()}
        totalEmailsCount={accounts.length}
        totalFoldersCount={totalFoldersCount}
        totalActivityCount={activityItems.length}
        unreadActivityCount={unreadActivityCount}
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        availableDomains={availableDomains}
        availableServices={availableServices}
      />

      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg bg-surface border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <WarningCircle size={15} weight="fill" className="shrink-0" />
            <span className="truncate">{loadError}</span>
          </span>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="shrink-0 rounded-md border border-default bg-elevated px-2.5 py-1 text-fg-secondary hover:text-fg-primary cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main View Area: Active Folder Drill-down, Folder Grid, Activity Feed, or All Addresses Table */}
      {activeFolder ? (
        <div className="flex-1 flex flex-col gap-3">
          {/* Active Folder Header with Back Button and Quick Create in this subdomain */}
          <MailFolderDetailHeader
            folder={{
              ...activeFolder,
              totalEmails: accounts.filter(
                (a) => a.domain.toLowerCase() === activeFolder.fullDomain.toLowerCase()
              ).length,
            }}
            onBack={() => setActiveFolder(null)}
            onCreateMail={() => handleOpenCreateMail(activeFolder.fullDomain)}
            onRequestDeleteSubdomain={handleRequestDeleteSubdomain}
          />

          {/* Table filtered to this active folder */}
          <MailAccountList
            accounts={currentFolderAccounts}
            detectedSummaries={detectionMap.byAccountId}
            isLoading={isLoading}
            searchQuery={searchQuery}
            emptyMessage={`No email addresses created yet in @${activeFolder.fullDomain}. Click "New Email in ${activeFolder.subdomainPart || activeFolder.rootDomain}" to create one.`}
            onSelectAccount={(item) => setSelectedAccount(item)}
            onOpenInbox={(item) => {
              setInitialInboxMessageId(null);
              setInboxAccount(item);
            }}
            onOpenActivity={handleOpenActivity}
            onOpenNote={handleOpenNote}
          />
        </div>
      ) : viewMode === 'folders' ? (
        <MailFolderGridView
          accounts={sortedAccounts}
          domains={domains}
          onOpenFolder={(folder) => setActiveFolder(folder)}
          onCreateMailInFolder={(folder) => handleOpenCreateMail(folder.fullDomain)}
          onOpenCreateSubdomain={handleOpenCreateSubdomain}
          onRequestDeleteSubdomain={handleRequestDeleteSubdomain}
        />
      ) : viewMode === 'activity' ? (
        <MailActivityList
          items={filteredActivity}
          isLoading={isLoading}
          isRefreshing={isActivityRefreshing}
          searchQuery={searchQuery}
          onSelectActivity={handleSelectActivity}
          onMarkAllRead={handleMarkAllActivityRead}
          onRefresh={() => void refreshActivity(true)}
        />
      ) : (
        /* Preserved 1:1 Current Design: Table of All Addresses */
        <MailAccountList
          accounts={sortedAccounts}
          detectedSummaries={detectionMap.byAccountId}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSelectAccount={(item) => setSelectedAccount(item)}
          onOpenInbox={(item) => {
            setInitialInboxMessageId(null);
            setInboxAccount(item);
          }}
          onOpenActivity={handleOpenActivity}
          onOpenNote={handleOpenNote}
        />
      )}

      {/* Shared Reusable Modal: Create New Email */}
      <BaseModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateMailInitialDomain(undefined);
        }}
        title="Create Email"
        subtitle={
          createMailInitialDomain
            ? `Creating mailbox in @${createMailInitialDomain}`
            : 'Choose a name, a domain from your account, and where to forward.'
        }
        icon={<Plus size={15} weight="bold" />}
      >
        <CreateMailModalContent
          domains={domains}
          forwardTargets={forwardTargets}
          initialDomain={createMailInitialDomain}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setCreateMailInitialDomain(undefined);
          }}
          onCreate={handleCreateMail}
        />
      </BaseModal>

      {/* Shared Reusable Modal: Create New Subdomain */}
      <BaseModal
        isOpen={isCreateSubdomainModalOpen}
        onClose={() => setIsCreateSubdomainModalOpen(false)}
        title="Create Email Subdomain"
        subtitle={
          createSubdomainRoot
            ? `Creating subdomain under @${createSubdomainRoot}`
            : 'Set up a dedicated subdomain for organized email routing.'
        }
        icon={<FolderPlus size={15} weight="duotone" className="text-accent" />}
      >
        <CreateSubdomainModalContent
          domains={domains}
          initialRootDomain={createSubdomainRoot}
          onCancel={() => setIsCreateSubdomainModalOpen(false)}
          onCreate={handleCreateSubdomain}
        />
      </BaseModal>

      {/* Shared Reusable Modal: Mail Account Details & Forward/Note Editor */}
      <BaseModal
        isOpen={Boolean(selectedAccount)}
        onClose={() => setSelectedAccount(null)}
        title="Email Details"
        subtitle={selectedAccount?.email}
        icon={<EnvelopeSimple size={15} weight="duotone" />}
      >
        {selectedAccount && (
          <MailDetailsModalContent
            account={selectedAccount}
            summary={detectionMap.byAccountId.get(selectedAccount.id)}
            forwardTargets={forwardTargets}
            onClose={() => setSelectedAccount(null)}
            onUpdate={handleUpdateMail}
            onRequestDelete={handleRequestDelete}
            onOpenActivity={handleOpenActivity}
          />
        )}
      </BaseModal>

      {/* Shared Reusable Modal: Dedicated Email Activity & Generated Tags */}
      <BaseModal
        isOpen={Boolean(activityModalAccount)}
        onClose={() => setActivityModalAccount(null)}
        title="Email Activity"
        subtitle={activityModalAccount?.email}
        icon={<Pulse size={15} weight="bold" className="text-sky-400" />}
        maxWidthClass="max-w-2xl"
        bodyClassName="p-4 sm:p-5 flex flex-col min-h-0 overflow-hidden"
      >
        {activityModalAccount && (
          <MailAccountActivityModalContent
            account={activityModalAccount}
            summary={detectionMap.byAccountId.get(activityModalAccount.id)}
            onClose={() => setActivityModalAccount(null)}
            onOpenNote={handleOpenNote}
            onSelectActivity={handleSelectActivity}
            onRefresh={() => void refreshActivity(true)}
            isRefreshing={isActivityRefreshing}
          />
        )}
      </BaseModal>

      {/* Shared Reusable Modal: Dedicated NotePad */}
      <BaseModal
        isOpen={Boolean(notePadAccount)}
        onClose={() => setNotePadAccount(null)}
        title="NotePad"
        subtitle={notePadAccount?.email}
        icon={<FileText size={15} weight="bold" className="text-accent" />}
        maxWidthClass="max-w-2xl"
      >
        {notePadAccount && (
          <MailNotePadModalContent
            account={notePadAccount}
            onClose={() => setNotePadAccount(null)}
            onUpdate={handleUpdateMail}
          />
        )}
      </BaseModal>

      {/* Shared Reusable Modal: Gmail-Style D1 Inbox (only for Forward To = None) */}
      <BaseModal
        isOpen={Boolean(inboxAccount)}
        onClose={() => {
          setInboxAccount(null);
          setInitialInboxMessageId(null);
        }}
        title="Mailbox Inbox"
        subtitle={`${inboxAccount?.email ?? ''} | Stored in D1`}
        icon={<Tray size={15} weight="duotone" />}
        maxWidthClass="max-w-4xl"
      >
        {inboxAccount && (
          <MailInboxModalContent
            account={inboxAccount}
            initialMessageId={initialInboxMessageId}
            onMessageRead={handleMessageReadFromInbox}
            onMessageDeleted={handleMessageDeletedFromInbox}
          />
        )}
      </BaseModal>

      {/* Shared Reusable Modal: Delete Confirmation Warning */}
      <BaseModal
        isOpen={Boolean(pendingDeleteAccount)}
        onClose={() => setPendingDeleteAccount(null)}
        title="Delete Email Address"
        subtitle="Confirm permanent deletion of this routing rule."
        icon={<Trash size={15} weight="duotone" className="text-danger" />}
      >
        {pendingDeleteAccount && (
          <DeleteMailModalContent
            account={pendingDeleteAccount}
            onCancel={() => {
              const target = pendingDeleteAccount;
              setPendingDeleteAccount(null);
              setSelectedAccount(target);
            }}
            onConfirmDelete={handleConfirmDelete}
          />
        )}
      </BaseModal>

      {/* Shared Reusable Modal: Subdomain Delete Confirmation Warning */}
      <BaseModal
        isOpen={Boolean(pendingDeleteFolder)}
        onClose={() => setPendingDeleteFolder(null)}
        title="Delete Subdomain"
        subtitle={`@${pendingDeleteFolder?.fullDomain ?? ''}`}
        icon={<Trash size={15} weight="duotone" className="text-danger" />}
      >
        {pendingDeleteFolder && (
          <DeleteSubdomainModalContent
            folder={pendingDeleteFolder}
            affectedAccounts={accounts.filter(
              (a) =>
                a.domain.toLowerCase() ===
                pendingDeleteFolder.fullDomain.toLowerCase()
            )}
            onCancel={() => setPendingDeleteFolder(null)}
            onConfirmDelete={handleConfirmDeleteSubdomain}
          />
        )}
      </BaseModal>
    </section>
  </ServiceBadgeStyleProvider>
);
};

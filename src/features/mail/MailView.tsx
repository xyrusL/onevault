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
  ForwardTarget,
  isVaultDestination,
  MailAccountItem,
  MailDomain,
  MailFolderInfo,
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

  // Compute smart service detection map across all accounts & activity items
  const detectionMap = useMemo(() => {
    return buildServiceDetectionMap(accounts, activityItems);
  }, [accounts, activityItems]);

  // Global search filtering for accounts (searches email, forward, note, AND generated tags!)
  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return accounts;
    return accounts.filter((item) =>
      accountMatchesSearch(item, detectionMap.byAccountId.get(item.id), q)
    );
  }, [accounts, searchQuery, detectionMap]);

  // Global search filtering for activity items
  const filteredActivity = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activityItems;
    return activityItems.filter(
      (item) =>
        item.recipientEmail.toLowerCase().includes(q) ||
        item.sender.toLowerCase().includes(q) ||
        item.senderName.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.forwardTo.toLowerCase().includes(q)
    );
  }, [activityItems, searchQuery]);

  // Unread activity count (turns the Activity tab green when > 0)
  const unreadActivityCount = useMemo(
    () => activityItems.filter((item) => !item.isRead).length,
    [activityItems]
  );

  // Current folder's accounts (when inside a folder drill-down)
  const currentFolderAccounts = useMemo(() => {
    if (!activeFolder) return filteredAccounts;
    return filteredAccounts.filter(
      (item) => item.domain.toLowerCase() === activeFolder.fullDomain.toLowerCase()
    );
  }, [filteredAccounts, activeFolder]);

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
    const updated = await mailService.update(accountId, payload);
    setAccounts((prev) =>
      prev.map((item) => (item.id === accountId ? updated : item))
    );
    setSelectedAccount((prev) => (prev && prev.id === accountId ? updated : prev));
    setNotePadAccount((prev) => (prev && prev.id === accountId ? updated : prev));
    // Update forwardTo in local activity items for this account
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
        onSearchChange={setSearchQuery}
        onCreateClick={() => handleOpenCreateMail()}
        onCreateSubdomainClick={() => handleOpenCreateSubdomain()}
        totalEmailsCount={accounts.length}
        totalFoldersCount={totalFoldersCount}
        totalActivityCount={activityItems.length}
        unreadActivityCount={unreadActivityCount}
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
          accounts={filteredAccounts}
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
          accounts={filteredAccounts}
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
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { CircleNotch, WarningCircle } from '@phosphor-icons/react';
import { DomainsHeader } from './components/DomainsHeader';
import { DomainList } from './components/domain-list';
import {
  CreateRecordModal,
  DeleteDomainModal,
  DeleteRecordModal,
  EditRecordModal,
} from './components/modals';
import { DnsRecordsView } from './components/records';
import { domainsService } from './services/domains.service';
import type {
  CreateRecordPayload,
  DnsRecordType,
  DomainItem,
  DomainRecordItem,
  UpdateRecordPayload,
} from './types/domains.types';

export const DomainsView: React.FC = () => {
  const cachedDomains = domainsService.getCachedDomains();
  const [domains, setDomains] = useState<DomainItem[]>(() => cachedDomains);
  const [selectedDomain, setSelectedDomain] = useState<DomainItem | null>(() =>
    cachedDomains.length > 0 ? cachedDomains[0] : null
  );
  const [records, setRecords] = useState<DomainRecordItem[]>([]);
  const [allRecordsByDomain, setAllRecordsByDomain] = useState<Record<string, DomainRecordItem[]>>(() => {
    const init: Record<string, DomainRecordItem[]> = {};
    for (const d of cachedDomains) {
      const recs = domainsService.getCachedRecords(d.name);
      if (recs) init[d.name.toLowerCase()] = recs;
    }
    return init;
  });
  const [isLoadingDomains, setIsLoadingDomains] = useState<boolean>(() => cachedDomains.length === 0);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverviewTable, setShowOverviewTable] = useState(false);

  // Modals state
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [presetSubdomain, setPresetSubdomain] = useState('');
  const [presetType, setPresetType] = useState<DnsRecordType>('A');
  const [editingRecord, setEditingRecord] = useState<DomainRecordItem | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<DomainItem | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DomainRecordItem | null>(null);

  const loadRecords = useCallback(async (domain: DomainItem) => {
    const cached = domainsService.getCachedRecords(domain.name);
    if (cached) {
      setRecords(cached);
      setAllRecordsByDomain((prev) => ({
        ...prev,
        [domain.name.toLowerCase()]: cached,
      }));
    } else {
      setIsLoadingRecords(true);
    }

    try {
      const data = await domainsService.listRecords(domain.name);
      setRecords(data);
      setAllRecordsByDomain((prev) => ({
        ...prev,
        [domain.name.toLowerCase()]: data,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to load DNS records for ${domain.name}.`
      );
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  const loadDomains = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (domainsService.getCachedDomains().length === 0) {
      setIsLoadingDomains(true);
    }
    setError(null);

    try {
      const data = await domainsService.listDomains();
      setDomains(data);

      // Pre-warm records for all domains in background so global search is instant
      for (const d of data) {
        const cached = domainsService.getCachedRecords(d.name);
        if (cached) {
          setAllRecordsByDomain((prev) => ({
            ...prev,
            [d.name.toLowerCase()]: cached,
          }));
        } else {
          void domainsService.listRecords(d.name).then((recs) => {
            setAllRecordsByDomain((prev) => ({
              ...prev,
              [d.name.toLowerCase()]: recs,
            }));
          });
        }
      }

      // Keep or set active domain
      setSelectedDomain((prev) => {
        if (!prev && data.length > 0) return data[0];
        if (prev) {
          const matched = data.find((d) => d.name === prev.name);
          return matched || (data.length > 0 ? data[0] : null);
        }
        return null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load domains.');
    } finally {
      setIsLoadingDomains(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDomains();
  }, [loadDomains]);

  useEffect(() => {
    if (selectedDomain) {
      void loadRecords(selectedDomain);
    }
  }, [selectedDomain?.name, loadRecords]);

  const handleSelectDomain = (domain: DomainItem) => {
    setSelectedDomain(domain);
    void loadRecords(domain);
  };

  const handleRefresh = async () => {
    await loadDomains(true);
    if (selectedDomain) {
      await loadRecords(selectedDomain);
    }
  };

  const handleOpenCreateRecord = (sub?: string, t?: DnsRecordType) => {
    setPresetSubdomain(sub || '');
    setPresetType(t || 'A');
    setIsCreateRecordOpen(true);
  };

  const handleOpenCreateRecordForDomain = (domain: DomainItem) => {
    setSelectedDomain(domain);
    setPresetSubdomain('');
    setPresetType('A');
    setIsCreateRecordOpen(true);
  };

  const handleDeleteDomain = async (domain: DomainItem) => {
    await domainsService.deleteDomain(domain.id || domain.name);
    await loadDomains();
  };

  const handleCreateRecord = async (payload: CreateRecordPayload) => {
    if (!selectedDomain) return;
    const created = await domainsService.createRecord(selectedDomain.name, payload);
    await loadRecords(selectedDomain);
    setAllRecordsByDomain((prev) => {
      const currentList = prev[selectedDomain.name.toLowerCase()] || [];
      return {
        ...prev,
        [selectedDomain.name.toLowerCase()]: [...currentList, created],
      };
    });
    await loadDomains();
  };

  const handleUpdateRecord = async (recordId: string, payload: UpdateRecordPayload) => {
    const targetDomain = editingRecord?.domainName || selectedDomain?.name;
    if (!targetDomain) return;
    const updated = await domainsService.updateRecord(targetDomain, recordId, payload);
    setRecords((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
    setAllRecordsByDomain((prev) => {
      const currentList = prev[targetDomain.toLowerCase()] || [];
      return {
        ...prev,
        [targetDomain.toLowerCase()]: currentList.map((r) =>
          r.id === recordId ? updated : r
        ),
      };
    });
    if (selectedDomain) {
      await loadRecords(selectedDomain);
    }
  };

  const handleDeleteRecord = async (record: DomainRecordItem) => {
    const targetDomain = record.domainName || selectedDomain?.name;
    if (!targetDomain) return;
    await domainsService.deleteRecord(targetDomain, record.id);
    setRecords((prev) => prev.filter((r) => r.id !== record.id));
    setAllRecordsByDomain((prev) => {
      const currentList = prev[targetDomain.toLowerCase()] || [];
      return {
        ...prev,
        [targetDomain.toLowerCase()]: currentList.filter((r) => r.id !== record.id),
      };
    });
    if (selectedDomain) {
      await loadRecords(selectedDomain);
    }
    await loadDomains();
  };

  return (
    <section className="space-y-4">
      {/* 1. Header with Actions & Integrated Overview Table Toggle */}
      <DomainsHeader
        onRefresh={() => void handleRefresh()}
        isRefreshing={isRefreshing}
        showOverviewTable={showOverviewTable}
        onToggleOverviewTable={() => setShowOverviewTable((prev) => !prev)}
      />

      {/* 2. Error Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 p-3 text-xs text-danger font-medium"
        >
          <WarningCircle size={16} weight="bold" className="shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="ml-auto underline font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {isLoadingDomains && domains.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-default bg-surface/50 text-fg-muted space-y-2">
          <CircleNotch size={24} weight="bold" className="animate-spin text-accent" />
          <span className="text-xs font-medium">Fetching Cloudflare domains list...</span>
        </div>
      ) : (
        <>
          {/* Optional Collapsible All Domains Table */}
          {showOverviewTable && (
            <DomainList
              domains={domains}
              selectedDomain={selectedDomain}
              onSelectDomain={handleSelectDomain}
              onRequestDelete={(d) => setDeletingDomain(d)}
              onOpenCreateRecordForDomain={handleOpenCreateRecordForDomain}
            />
          )}

          {/* Direct Categorized Records Command Center with Heuristic Cross-Domain Search */}
          {selectedDomain && (
            <DnsRecordsView
              domain={selectedDomain}
              allDomains={domains}
              records={records}
              allDomainRecordsMap={allRecordsByDomain}
              isLoading={isLoadingRecords}
              onSelectDomain={handleSelectDomain}
              onOpenCreateRecord={handleOpenCreateRecord}
              onEditRecord={(r) => setEditingRecord(r)}
              onDeleteRecord={(r) => setDeletingRecord(r)}
            />
          )}
        </>
      )}

      {/* Modals */}
      {selectedDomain && (
        <>
          <CreateRecordModal
            isOpen={isCreateRecordOpen}
            domain={selectedDomain}
            initialSubdomain={presetSubdomain}
            initialType={presetType}
            onClose={() => setIsCreateRecordOpen(false)}
            onSubmit={handleCreateRecord}
          />

          <EditRecordModal
            isOpen={Boolean(editingRecord)}
            record={editingRecord}
            onClose={() => setEditingRecord(null)}
            onSubmit={handleUpdateRecord}
          />

          <DeleteRecordModal
            isOpen={Boolean(deletingRecord)}
            record={deletingRecord}
            onClose={() => setDeletingRecord(null)}
            onConfirm={handleDeleteRecord}
          />
        </>
      )}

      <DeleteDomainModal
        isOpen={Boolean(deletingDomain)}
        domain={deletingDomain}
        onClose={() => setDeletingDomain(null)}
        onConfirm={handleDeleteDomain}
      />
    </section>
  );
};

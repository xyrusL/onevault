import React, { useEffect, useState } from 'react';
import { PaginationBar } from '../../../shared/components/pagination';
import { AccountServiceDetectionSummary } from '../types/mail-service-detector.types';
import { MailAccountItem } from '../types/mail.types';
import { MailAccountRow } from './MailAccountRow';

const DESKTOP_PAGE_SIZE = 9;

function computeAutoPageSize(): number {
  if (typeof window === 'undefined') return DESKTOP_PAGE_SIZE;
  if (window.innerWidth >= 640) {
    return DESKTOP_PAGE_SIZE;
  }
  const availableForCards = window.innerHeight - 340;
  const fit = Math.floor(availableForCards / 54);
  return Math.max(4, Math.min(fit, 6));
}

interface MailAccountListProps {
  accounts: MailAccountItem[];
  detectedSummaries?: Map<string, AccountServiceDetectionSummary>;
  isLoading: boolean;
  searchQuery?: string;
  emptyMessage?: string;
  onSelectAccount: (item: MailAccountItem) => void;
  onOpenInbox: (item: MailAccountItem) => void;
  onOpenActivity?: (item: MailAccountItem) => void;
  onOpenNote?: (item: MailAccountItem) => void;
}

export const MailAccountList: React.FC<MailAccountListProps> = ({
  accounts,
  detectedSummaries,
  isLoading,
  searchQuery = '',
  emptyMessage,
  onSelectAccount,
  onOpenInbox,
  onOpenActivity,
  onOpenNote,
}) => {
  const [pageSize, setPageSize] = useState(computeAutoPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(accounts.length / pageSize));

  useEffect(() => {
    const handleResize = () => {
      setPageSize(computeAutoPageSize());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const safePage = Math.min(currentPage, totalPages);
  const visibleAccounts = accounts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <div className="relative flex-1 flex flex-col justify-between rounded-xl bg-surface-solid border border-default shadow-card overflow-hidden">
      <div className="flex-1 flex flex-col">
        {/* Subtle multi-color top edge gradient accent */}
        <div className="h-[1.5px] w-full bg-gradient-to-r from-sky-500/40 via-indigo-500/40 to-emerald-500/40" />

        {/* Table Header — Desktop Only */}
        <div className="hidden sm:grid sm:grid-cols-12 items-center gap-3 border-b border-default bg-elevated/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">
          <div className="col-span-6 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span>Email Address</span>
          </div>
          <div className="col-span-3 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Forward To</span>
          </div>
          <div className="col-span-3 flex items-center justify-end gap-1.5 text-right">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <span>Action</span>
          </div>
        </div>

        {/* Mail Rows */}
        {accounts.length === 0 ? (
          <div className="px-4 py-14 text-center text-xs text-fg-muted">
            {isLoading
              ? 'Loading mailboxes...'
              : searchQuery.trim()
                ? `No email addresses matching "${searchQuery.trim()}".`
                : emptyMessage || 'No email addresses yet. Click "New Email" to create one.'}
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {visibleAccounts.map((item, index) => (
              <MailAccountRow
                key={`${item.id}_p${safePage}_${index}`}
                item={item}
                summary={detectedSummaries?.get(item.id)}
                onSelect={onSelectAccount}
                onOpenInbox={onOpenInbox}
                onOpenActivity={onOpenActivity}
                onOpenNote={onOpenNote}
              />
            ))}
          </div>
        )}
      </div>

      {accounts.length > 0 && (
        <PaginationBar
          currentPage={safePage}
          totalItems={accounts.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="addresses"
        />
      )}
    </div>
  );
};

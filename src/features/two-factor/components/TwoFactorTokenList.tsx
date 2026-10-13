import React, { useEffect, useState } from 'react';
import { PaginationBar } from '../../../shared/components/pagination';
import { TwoFactorTokenItem } from '../types/two-factor.types';
import { TwoFactorTokenRow } from './TwoFactorTokenRow';

const PAGE_SIZE = 9;

interface TwoFactorTokenListProps {
  tokens: TwoFactorTokenItem[];
  nowMs: number;
  isLoading: boolean;
  onSelectToken: (item: TwoFactorTokenItem) => void;
}

export const TwoFactorTokenList: React.FC<TwoFactorTokenListProps> = ({
  tokens,
  nowMs,
  isLoading,
  onSelectToken,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(tokens.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const safePage = Math.min(currentPage, totalPages);
  const visibleTokens = tokens.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="relative flex-1 flex flex-col justify-between rounded-xl bg-surface backdrop-blur-xl border border-default shadow-card overflow-hidden">
      <div className="flex-1 flex flex-col">
        {/* Subtle multi-color top edge gradient accent */}
        <div className="h-[1.5px] w-full bg-gradient-to-r from-indigo-500/50 via-sky-500/40 to-emerald-500/40" />

        {/* Table Header */}
        <div className="hidden sm:grid sm:grid-cols-12 items-center gap-3 border-b border-default bg-elevated/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">
          <div className="col-span-6 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span>Service | Account</span>
          </div>
          <div className="col-span-4 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Live 2FA Code</span>
          </div>
          <div className="col-span-2 flex items-center justify-end gap-1.5 text-right">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <span>Action</span>
          </div>
        </div>

        {/* Token Rows */}
        {tokens.length === 0 ? (
          <div className="px-4 py-14 text-center text-xs text-fg-muted">
            {isLoading
              ? 'Loading 2FA authenticators...'
              : 'No 2FA authenticators yet. Click "New 2FA" to add one.'}
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {visibleTokens.map((item) => (
              <TwoFactorTokenRow
                key={item.id}
                item={item}
                nowMs={nowMs}
                onSelect={onSelectToken}
              />
            ))}
          </div>
        )}
      </div>

      {tokens.length > 0 && (
        <PaginationBar
          currentPage={safePage}
          totalItems={tokens.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="authenticators"
        />
      )}
    </div>
  );
};

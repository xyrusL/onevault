import React from 'react';
import ReactPaginate from 'react-paginate';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

export interface PaginationBarProps {
  /** Current 1-indexed page */
  currentPage: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Number of items shown per page */
  pageSize: number;
  /** Callback when user selects a 1-indexed page */
  onPageChange: (page: number) => void;
  /** Singular/plural label for the count summary (default: "addresses") */
  itemLabel?: string;
}

/**
 * Shared reusable pagination bar built on `react-paginate` and customized
 * with OneVault semantic design tokens.
 */
export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'items',
}) => {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;

  const safePage = Math.min(Math.max(1, currentPage), pageCount);
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-default bg-elevated/40 px-3 sm:px-4 py-2 sm:py-2.5">
      <div className="text-xs text-fg-muted">
        Showing{' '}
        <span className="font-semibold text-fg-primary">
          {startItem}–{endItem}
        </span>{' '}
        of <span className="font-semibold text-fg-primary">{totalItems}</span> {itemLabel}
      </div>

      <ReactPaginate
        forcePage={safePage - 1}
        pageCount={pageCount}
        pageRangeDisplayed={3}
        marginPagesDisplayed={1}
        onPageChange={({ selected }) => onPageChange(selected + 1)}
        previousLabel={
          <span className="inline-flex items-center gap-1 leading-none">
            <CaretLeft size={12} weight="bold" className="shrink-0" />
            <span>Prev</span>
          </span>
        }
        nextLabel={
          <span className="inline-flex items-center gap-1 leading-none">
            <span>Next</span>
            <CaretRight size={12} weight="bold" className="shrink-0" />
          </span>
        }
        breakLabel="…"
        containerClassName="inline-flex items-center gap-1.5 select-none list-none m-0 p-0"
        pageLinkClassName="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-default bg-elevated/60 px-2 text-xs font-medium text-fg-secondary hover:bg-hover hover:text-fg-primary hover:border-strong cursor-pointer leading-none transition-colors"
        activeLinkClassName="!bg-accent !text-accent-fg !border-accent font-semibold shadow-sm"
        previousLinkClassName="inline-flex h-7 items-center justify-center rounded-lg border border-default bg-elevated/60 px-2.5 text-xs font-medium text-fg-secondary hover:bg-hover hover:text-fg-primary hover:border-strong cursor-pointer leading-none transition-colors"
        nextLinkClassName="inline-flex h-7 items-center justify-center rounded-lg border border-default bg-elevated/60 px-2.5 text-xs font-medium text-fg-secondary hover:bg-hover hover:text-fg-primary hover:border-strong cursor-pointer leading-none transition-colors"
        breakLinkClassName="inline-flex h-7 min-w-6 items-center justify-center text-xs text-fg-muted"
        disabledLinkClassName="opacity-40 pointer-events-none cursor-not-allowed"
      />
    </div>
  );
};

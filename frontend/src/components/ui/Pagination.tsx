import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { clsx } from 'clsx';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
  className?: string;
}

const LIMIT_OPTIONS = [10, 20, 50, 100];

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
  className,
}) => {
  const startItem = Math.min((page - 1) * limit + 1, total);
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  const PageButton: React.FC<{
    pageNum: number | '...';
    isActive?: boolean;
    onClick?: () => void;
    disabled?: boolean;
  }> = ({ pageNum, isActive, onClick, disabled }) => {
    if (pageNum === '...') {
      return (
        <span className="px-3 py-1.5 text-sm text-gray-400">...</span>
      );
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={clsx(
          'px-3 py-1.5 text-sm rounded-md transition-colors min-w-[36px]',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
          isActive
            ? 'bg-primary-600 text-white font-medium'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {pageNum}
      </button>
    );
  };

  return (
    <div className={clsx('flex flex-col sm:flex-row items-center justify-between gap-4 py-3', className)}>
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        {total > 0 ? (
          <span>
            Showing {startItem}–{endItem} of {total} results
          </span>
        ) : (
          <span>No results</span>
        )}

        {showLimitSelector && onLimitChange && (
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {LIMIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className={clsx(
              'p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={clsx(
              'p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers().map((pageNum, index) => (
            <PageButton
              key={index}
              pageNum={pageNum}
              isActive={pageNum === page}
              onClick={pageNum !== '...' ? () => onPageChange(pageNum as number) : undefined}
              disabled={pageNum === page}
            />
          ))}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className={clsx(
              'p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className={clsx(
              'p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

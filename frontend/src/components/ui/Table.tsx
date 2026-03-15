import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { clsx } from 'clsx';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
  rowTestId?: string;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function Table<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  sortBy,
  sortOrder,
  onSort,
  rowKey,
  onRowClick,
  className,
  rowTestId,
}: TableProps<T>) {
  return (
    <div className={clsx('w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap',
                  col.sortable && onSort && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 select-none',
                  col.headerClassName
                )}
                onClick={() => col.sortable && onSort && onSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && onSort && (
                    <span className="inline-flex flex-col text-gray-400">
                      {sortBy === col.key ? (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5 text-primary-600" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-primary-600" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            : data.length === 0
            ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                      {emptyMessage}
                </td>
              </tr>
            )
            : data.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row) : index}
                data-testid={rowTestId}
                className={clsx(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-4 py-3 text-gray-700 dark:text-gray-300',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render((row as Record<string, unknown>)[col.key], row)
                      : ((row as Record<string, unknown>)[col.key] as React.ReactNode) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

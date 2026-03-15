import { useState, useCallback } from 'react';
import { PaginationParams } from '@/types';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
}

interface UsePaginationReturn extends PaginationParams {
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  toggleSort: (field: string) => void;
  reset: () => void;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [search, setSearchState] = useState(initialSearch);
  const [sortBy, setSortByState] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('asc');

  const setPage = useCallback((p: number) => setPageState(p), []);

  const setLimit = useCallback((l: number) => {
    setLimitState(l);
    setPageState(1);
  }, []);

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
    setPageState(1);
  }, []);

  const setSortBy = useCallback((field: string) => {
    setSortByState(field);
    setPageState(1);
  }, []);

  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    setSortOrderState(order);
  }, []);

  const toggleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortOrderState((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortByState(field);
        setSortOrderState('asc');
      }
      setPageState(1);
    },
    [sortBy]
  );

  const reset = useCallback(() => {
    setPageState(initialPage);
    setLimitState(initialLimit);
    setSearchState(initialSearch);
    setSortByState(undefined);
    setSortOrderState('asc');
  }, [initialPage, initialLimit, initialSearch]);

  return {
    page,
    limit,
    search: search || undefined,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    setSearch,
    setSortBy,
    setSortOrder,
    toggleSort,
    reset,
  };
}

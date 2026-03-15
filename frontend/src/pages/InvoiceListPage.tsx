import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { billingApi, CreateInvoiceData } from '@/api/billing';
import { InvoiceStatus } from '@/types';
import { usePagination } from '@/hooks/usePagination';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { InvoiceStatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { Invoice } from '@/types';
import { format } from 'date-fns';

const STATUS_ALL = '__all__';

const statusOptions = [
  { value: STATUS_ALL, label: 'All statuses' },
  ...Object.values(InvoiceStatus).map((s) => ({ value: s, label: s })),
];

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { page, limit, search, sortBy, sortOrder, setPage, setLimit, setSearch, toggleSort } =
    usePagination({ initialLimit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { page, limit, search, status: statusFilter, sortBy, sortOrder }],
    queryFn: () =>
      billingApi.getInvoices({
        page,
        limit,
        search,
        status: statusFilter && statusFilter !== STATUS_ALL ? (statusFilter as InvoiceStatus) : undefined,
        sortBy,
        sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => billingApi.deleteInvoice(id),
    onSuccess: () => {
      toast.success('Invoice deleted');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeletingId(null);
    },
    onError: () => toast.error('Error', 'Could not delete invoice.'),
  });

  const columns: TableColumn<Invoice>[] = [
    {
      key: 'number',
      header: 'Invoice #',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
          #{row.number}
        </span>
      ),
    },
    {
      key: 'family',
      header: 'Family',
      render: (_, row) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {row.family?.name || '—'}
        </span>
      ),
    },
    {
      key: 'periodStart',
      header: 'Period',
      render: (_, row) => `${format(new Date(row.periodStart), 'MMM d')} – ${format(new Date(row.periodEnd), 'MMM d, yyyy')}`,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (_, row) => format(new Date(row.dueDate), 'MMM d, yyyy'),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          ${Number(row.total).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => <InvoiceStatusBadge status={row.status} />,
    },
    {
      key: 'id',
      header: '',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeletingId(row.id); }}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      className: 'w-10',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data?.total ? `${data.total} invoices` : 'Manage invoices'}
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/billing/invoices/new')}>
          Create Invoice
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <SearchInput value={search || ''} onChange={setSearch} placeholder="Search invoices..." className="w-72" />
        <Select options={statusOptions} value={statusFilter} onValueChange={setStatusFilter} containerClassName="w-40" />
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="No invoices found"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={toggleSort}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/billing/invoices/${row.id}`)}
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          className="mt-4"
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Invoice"
        description="Are you sure? This will permanently delete the invoice and all payment records."
        confirmLabel="Delete"
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

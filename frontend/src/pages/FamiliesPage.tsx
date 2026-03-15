import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { familiesApi } from '@/api/families';
import { usePagination } from '@/hooks/usePagination';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { FamilyForm } from '@/components/families/FamilyForm';
import { Family } from '@/types';
import { format } from 'date-fns';

export default function FamiliesPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const { page, limit, search, setPage, setLimit, setSearch } = usePagination({ initialLimit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['families', { page, limit, search }],
    queryFn: () => familiesApi.getFamilies({ page, limit, search }),
  });

  const columns: TableColumn<Family>[] = [
    {
      key: 'name',
      header: 'Family',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      render: (_, row) => {
        const count = row.students?.length ?? 0;
        return (
          <Badge variant={count > 0 ? 'info' : 'gray'} size="sm">
            {count} {count === 1 ? 'student' : 'students'}
          </Badge>
        );
      },
    },
    {
      key: 'members',
      header: 'Members',
      render: (_, row) => {
        const members = row.members || [];
        if (!members.length) return <span className="text-xs text-gray-400">None</span>;
        const names = members
          .slice(0, 2)
          .map((m) => {
            const p = m.user?.profile;
            return p ? `${p.firstName} ${p.lastName}` : m.user?.email || '—';
          })
          .join(', ');
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {names}
            {members.length > 2 && ` +${members.length - 2}`}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          {format(new Date(row.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Families</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data?.total ? `${data.total} total families` : 'Manage families and siblings'}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowForm(true)}
        >
          Add Family
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <SearchInput
          value={search || ''}
          onChange={setSearch}
          placeholder="Search families..."
          className="w-72"
        />
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="No families found"
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/families/${row.id}`)}
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

      <Dialog open={showForm} onOpenChange={setShowForm} title="Add New Family" size="sm">
        <FamilyForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
      </Dialog>
    </div>
  );
}

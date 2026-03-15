import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { studentsApi } from '@/api/students';
import { usePagination } from '@/hooks/usePagination';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dialog } from '@/components/ui/Dialog';
import { StudentForm } from '@/components/students/StudentForm';
import { Student } from '@/types';
import { format } from 'date-fns';

export default function StudentsPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const { page, limit, search, sortBy, sortOrder, setPage, setLimit, setSearch, toggleSort } =
    usePagination({ initialLimit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['students', { page, limit, search, sortBy, sortOrder }],
    queryFn: () => studentsApi.getStudents({ page, limit, search, sortBy, sortOrder }),
  });

  const columns: TableColumn<Student>[] = [
    {
      key: 'user',
      header: 'Student',
      render: (_, row) => {
        const profile = row.user?.profile;
        const name = profile ? `${profile.firstName} ${profile.lastName}` : row.user?.email || '—';
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} src={profile?.avatarUrl} size="sm" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p>
              <p className="text-xs text-gray-500">{row.user?.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'family',
      header: 'Family',
      render: (_, row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.family?.name || '—'}
        </span>
      ),
    },
    {
      key: 'instruments',
      header: 'Instruments',
      render: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {(row.instruments || []).slice(0, 2).map((i) => (
            <Badge key={i.id} variant="info" size="sm">
              {i.instrument?.name}
            </Badge>
          ))}
          {(row.instruments || []).length > 2 && (
            <Badge variant="gray" size="sm">+{(row.instruments?.length || 0) - 2}</Badge>
          )}
          {!(row.instruments?.length) && <span className="text-xs text-gray-400">None</span>}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(row.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (_, row) => (
        <Badge variant={row.user?.isActive ? 'success' : 'gray'} dot>
          {row.user?.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data?.total ? `${data.total} total students` : 'Manage student accounts'}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowForm(true)}
          data-testid="add-student-btn"
        >
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <SearchInput
          value={search || ''}
          onChange={setSearch}
          placeholder="Search students..."
          className="w-72"
          data-testid="search-students"
        />
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="No students found"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={toggleSort}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/students/${row.id}`)}
        rowTestId="student-row"
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

      <Dialog
        open={showForm}
        onOpenChange={setShowForm}
        title="Add New Student"
        size="lg"
      >
        <StudentForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
      </Dialog>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarDays } from 'lucide-react';
import { teachersApi, CreateTeacherData } from '@/api/teachers';
import { Teacher } from '@/types';
import { usePagination } from '@/hooks/usePagination';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

type FD = z.infer<typeof schema>;

function TeacherCreateForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FD>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: CreateTeacherData) => teachersApi.createTeacher(data),
    onSuccess: () => {
      toast.success('Teacher created');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      onSuccess();
    },
    onError: () => toast.error('Error', 'Could not create teacher.'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" {...register('firstName')} error={errors.firstName?.message} required />
        <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} required />
      </div>
      <Input label="Email" type="email" {...register('email')} error={errors.email?.message} required />
      <Input label="Password" type="password" {...register('password')} error={errors.password?.message} helperText="Min 8 characters" required />
      <Input label="Phone" {...register('phone')} />
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel} data-testid="cancel-teacher-btn">Cancel</Button>
        <Button type="submit" isLoading={mutation.isPending} data-testid="submit-teacher-btn">Create Teacher</Button>
      </DialogFooter>
    </form>
  );
}

export default function TeachersPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const { page, limit, search, sortBy, sortOrder, setPage, setLimit, setSearch, toggleSort } =
    usePagination({ initialLimit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', { page, limit, search, sortBy, sortOrder }],
    queryFn: () => teachersApi.getTeachers({ page, limit, search, sortBy, sortOrder }),
  });

  const columns: TableColumn<Teacher>[] = [
    {
      key: 'user',
      header: 'Teacher',
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
      key: 'instruments',
      header: 'Instruments',
      render: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {(row.specializations || []).slice(0, 3).map((i: any) => (
            <Badge key={i.instrumentId} variant="info" size="sm">
              {i.instrument?.name}
            </Badge>
          ))}
          {(row.specializations?.length || 0) > 3 && (
            <Badge variant="gray" size="sm">+{(row.specializations?.length || 0) - 3}</Badge>
          )}
          {!(row.specializations?.length) && <span className="text-xs text-gray-400">None</span>}
        </div>
      ),
    },
    {
      key: 'courses',
      header: 'Active courses',
      render: (_, row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row._count?.courses ?? row.courses?.length ?? 0}
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
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/calendar?teacher=${row.id}`); }}
          title="View schedule"
          className="p-1.5 rounded text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Teachers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data?.total ? `${data.total} teachers` : 'Manage teacher profiles'}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowForm(true)}
          data-testid="add-teacher-btn"
        >
          Add Teacher
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <SearchInput
          value={search || ''}
          onChange={setSearch}
          placeholder="Search teachers..."
          className="w-72"
          data-testid="search-teachers"
        />
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="No teachers found"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={toggleSort}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/teachers/${row.id}`)}
        rowTestId="teacher-row"
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

      <Dialog open={showForm} onOpenChange={setShowForm} title="Add Teacher" size="lg">
        <TeacherCreateForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
      </Dialog>
    </div>
  );
}

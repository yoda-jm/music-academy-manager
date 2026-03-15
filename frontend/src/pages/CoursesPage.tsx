import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { coursesApi } from '@/api/courses';
import { CourseType } from '@/types';
import { usePagination } from '@/hooks/usePagination';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { CourseTypeBadge, Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { CourseForm } from '@/components/courses/CourseForm';
import { Course } from '@/types';

const TYPE_ALL = '__all__';

const typeOptions = [
  { value: TYPE_ALL, label: 'All types' },
  ...Object.values(CourseType).map((t) => ({
    value: t,
    label: t.charAt(0) + t.slice(1).toLowerCase(),
  })),
];

export default function CoursesPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState(TYPE_ALL);
  const { page, limit, search, sortBy, sortOrder, setPage, setLimit, setSearch, toggleSort } =
    usePagination({ initialLimit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['courses', { page, limit, search, sortBy, sortOrder, type: typeFilter }],
    queryFn: () =>
      coursesApi.getCourses({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        type: typeFilter && typeFilter !== TYPE_ALL ? (typeFilter as CourseType) : undefined,
      }),
  });

  const columns: TableColumn<Course>[] = [
    {
      key: 'name',
      header: 'Course',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
          {row.instrument && (
            <p className="text-xs text-gray-500">{row.instrument.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (_, row) => <CourseTypeBadge type={row.type} />,
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (_, row) => {
        const profile = row.teacher?.user?.profile;
        return profile
          ? `${profile.firstName} ${profile.lastName}`
          : row.teacher?.user?.email || '—';
      },
    },
    {
      key: 'room',
      header: 'Room',
      render: (_, row) => row.room?.name || '—',
    },
    {
      key: 'durationMinutes',
      header: 'Duration',
      render: (_, row) => `${row.durationMinutes} min`,
    },
    {
      key: '_count',
      header: 'Sessions / Students',
      render: (_, row) => (
        <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
          <span>{row._count?.sessions ?? 0} sessions</span>
          <span>{row._count?.enrollments ?? 0} students</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (_, row) => (
        <Badge variant={row.isActive ? 'success' : 'gray'} dot>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data?.total ? `${data.total} courses` : 'Manage music courses'}
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)} data-testid="add-course-btn">
          Add Course
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <SearchInput value={search || ''} onChange={setSearch} placeholder="Search courses..." className="w-72" data-testid="search-courses" />
        <Select
          options={typeOptions}
          value={typeFilter}
          onValueChange={setTypeFilter}
          containerClassName="w-40"
        />
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="No courses found"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={toggleSort}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/courses/${row.id}`)}
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

      <Dialog open={showForm} onOpenChange={setShowForm} title="Create Course" size="xl">
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <CourseForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        </div>
      </Dialog>
    </div>
  );
}

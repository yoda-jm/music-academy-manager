import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Users, Shield } from 'lucide-react';
import { usersApi } from '@/api/users';
import { usePagination } from '@/hooks/usePagination';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Table, TableColumn } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge, Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { User, Role } from '@/types';
import { format } from 'date-fns';

function UserManagementTab() {
  const { page, limit, search, setPage, setLimit, setSearch } = usePagination({ initialLimit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, limit, search }],
    queryFn: () => usersApi.getUsers({ page, limit, search }),
  });

  const columns: TableColumn<User>[] = [
    {
      key: 'profile',
      header: 'User',
      render: (_, row) => {
        const name = row.profile
          ? `${row.profile.firstName} ${row.profile.lastName}`
          : row.email;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} src={row.profile?.avatarUrl} size="sm" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p>
              <p className="text-xs text-gray-500">{row.email}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'role', header: 'Role', render: (_, row) => <RoleBadge role={row.role} /> },
    {
      key: 'isActive',
      header: 'Status',
      render: (_, row) => (
        <Badge variant={row.isActive ? 'success' : 'gray'} dot>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (_, row) => format(new Date(row.createdAt), 'MMM d, yyyy'),
    },
  ];

  return (
    <div className="space-y-4">
      <SearchInput value={search || ''} onChange={setSearch} placeholder="Search users..." className="w-72" />
      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyMessage="No users found" rowKey={(r) => r.id} />
      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      )}
    </div>
  );
}

function AcademySettingsTab() {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Academy Configuration</h3>
      </Card.Header>
      <Card.Body>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Configuration Center</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  Academy-wide settings like name, address, tax rates, and email templates are managed through the backend configuration.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-primary-600" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Role Permissions</h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage what each role can access and modify within the system.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-secondary-600" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">User Management</h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage user accounts, roles, and access in the Users tab.
              </p>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Academy configuration and user management
        </p>
      </div>

      <Tabs
        tabs={[
          { value: 'academy', label: 'Academy Settings', icon: <Settings className="h-4 w-4" /> },
          { value: 'users', label: 'User Management', icon: <Users className="h-4 w-4" /> },
        ]}
      >
        <TabContent value="academy">
          <AcademySettingsTab />
        </TabContent>
        <TabContent value="users">
          <UserManagementTab />
        </TabContent>
      </Tabs>
    </div>
  );
}

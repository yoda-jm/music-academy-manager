import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Users, Shield, Clock } from 'lucide-react';
import { usersApi } from '@/api/users';
import { settingsApi } from '@/api/settings';
import { usePagination } from '@/hooks/usePagination';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Table, TableColumn } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge, Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hourLabel(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function OpeningHoursEditor() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['settings', 'academy'],
    queryFn: settingsApi.getAcademyConfig,
  });

  const [openTime, setOpenTime] = useState<number | null>(null);
  const [closeTime, setCloseTime] = useState<number | null>(null);
  const [openDays, setOpenDays] = useState<number[] | null>(null);

  const effectiveOpen = openTime ?? config?.openTime ?? 8;
  const effectiveClose = closeTime ?? config?.closeTime ?? 22;
  const effectiveDays = openDays ?? config?.openDays ?? [1, 2, 3, 4, 5, 6];

  const mutation = useMutation({
    mutationFn: settingsApi.updateAcademyConfig,
    onSuccess: () => {
      toast.success('Opening hours saved');
      queryClient.invalidateQueries({ queryKey: ['settings', 'academy'] });
      setOpenTime(null);
      setCloseTime(null);
      setOpenDays(null);
    },
    onError: () => toast.error('Error', 'Could not save opening hours.'),
  });

  const toggleDay = (day: number) => {
    const current = effectiveDays;
    setOpenDays(current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort());
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (isLoading) return <div className="py-4 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Open days */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Open days</p>
        <div className="flex gap-2 flex-wrap">
          {DAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                effectiveDays.includes(idx)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hours */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opening time</p>
          <select
            value={effectiveOpen}
            onChange={(e) => setOpenTime(Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {hours.map((h) => (
              <option key={h} value={h}>{hourLabel(h)}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Closing time</p>
          <select
            value={effectiveClose}
            onChange={(e) => setCloseTime(Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {hours.map((h) => (
              <option key={h} value={h}>{hourLabel(h)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview strip */}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview</p>
        <div className="flex h-6 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
          {hours.map((h) => {
            const open = h >= effectiveOpen && h < effectiveClose;
            return (
              <div
                key={h}
                title={hourLabel(h)}
                className={`flex-1 ${open ? 'bg-primary-500' : 'bg-gray-100 dark:bg-gray-800'}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
        </div>
      </div>

      <Button
        variant="primary"
        isLoading={mutation.isPending}
        onClick={() => mutation.mutate({ openTime: effectiveOpen, closeTime: effectiveClose, openDays: effectiveDays })}
      >
        Save Opening Hours
      </Button>
    </div>
  );
}

function AcademySettingsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary-600" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Opening Hours</h3>
          </div>
        </Card.Header>
        <Card.Body>
          <OpeningHoursEditor />
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Other Configuration</h3>
        </Card.Header>
        <Card.Body>
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
        </Card.Body>
      </Card>
    </div>
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

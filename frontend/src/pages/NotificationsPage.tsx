import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Bell } from 'lucide-react';
import { notificationsApi } from '@/api/notifications';
import { usePagination } from '@/hooks/usePagination';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

export default function NotificationsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { page, limit, setPage, setLimit } = usePagination({ initialLimit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { page, limit }],
    queryFn: () => notificationsApi.getNotifications({ page, limit }),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const hasUnread = (data?.data || []).some((n) => !n.isRead);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data?.total ? `${data.total} notifications` : ''}
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            leftIcon={<CheckCheck className="h-4 w-4" />}
            isLoading={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="xl" /></div>
      ) : !data?.data.length ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 text-gray-400" />}
          title="No notifications"
          description="You're all caught up! Notifications will appear here."
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {data.data.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markReadMutation.mutate(id)}
            />
          ))}
        </div>
      )}

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
    </div>
  );
}

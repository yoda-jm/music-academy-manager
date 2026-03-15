import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { notificationsApi } from '@/api/notifications';
import { NotificationItem } from './NotificationItem';
import { Spinner } from '@/components/ui/Spinner';

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ open, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationsApi.getNotifications({ limit: 10 }),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const notifications = data?.data || [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div
      ref={dropdownRef}
      className={clsx(
        'absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl',
        'border border-gray-200 dark:border-gray-700 shadow-xl z-50',
        'animate-fade-in'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Notifications</h3>
        {hasUnread && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium disabled:opacity-50 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
            <Bell className="h-8 w-8" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/notifications"
          onClick={onClose}
          className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium transition-colors"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

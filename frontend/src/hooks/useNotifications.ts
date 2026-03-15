import { useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { Notification } from '@/types';

interface UseNotificationsReturn {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();
  const { on } = useSocket();

  const handleNewNotification = useCallback(
    (data: unknown) => {
      const notification = data as Notification;
      setUnreadCount((prev) => prev + 1);

      // Invalidate notifications query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Optionally show a toast (handled elsewhere with subscribe pattern)
      console.log('New notification:', notification.title);
    },
    [queryClient]
  );

  useEffect(() => {
    const unsubscribe = on('notification', handleNewNotification);
    return unsubscribe;
  }, [on, handleNewNotification]);

  const incrementUnread = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  return {
    unreadCount,
    setUnreadCount,
    incrementUnread,
  };
}

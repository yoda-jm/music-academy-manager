import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, FileText, Calendar, UserCheck, MessageSquare, AlertCircle, Info, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { Notification, NotifType } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  compact?: boolean;
}

const notifIcons: Record<NotifType, React.ReactNode> = {
  [NotifType.INVOICE_DUE]: <FileText className="h-5 w-5 text-orange-500" />,
  [NotifType.COURSE_REMINDER]: <Calendar className="h-5 w-5 text-blue-500" />,
  [NotifType.ATTENDANCE_MARKED]: <UserCheck className="h-5 w-5 text-primary-500" />,
  [NotifType.MESSAGE_RECEIVED]: <MessageSquare className="h-5 w-5 text-purple-500" />,
  [NotifType.ENROLLMENT_CHANGE]: <UserCheck className="h-5 w-5 text-green-500" />,
  [NotifType.SYSTEM]: <Bell className="h-5 w-5 text-gray-500" />,
  [NotifType.VACATION_NOTICE]: <Sun className="h-5 w-5 text-amber-500" />,
  [NotifType.ABSENCE]: <AlertCircle className="h-5 w-5 text-red-500" />,
};

const notifBg: Record<NotifType, string> = {
  [NotifType.INVOICE_DUE]: 'bg-orange-50 dark:bg-orange-900/20',
  [NotifType.COURSE_REMINDER]: 'bg-blue-50 dark:bg-blue-900/20',
  [NotifType.ATTENDANCE_MARKED]: 'bg-primary-50 dark:bg-primary-900/20',
  [NotifType.MESSAGE_RECEIVED]: 'bg-purple-50 dark:bg-purple-900/20',
  [NotifType.ENROLLMENT_CHANGE]: 'bg-green-50 dark:bg-green-900/20',
  [NotifType.SYSTEM]: 'bg-gray-50 dark:bg-gray-800',
  [NotifType.VACATION_NOTICE]: 'bg-amber-50 dark:bg-amber-900/20',
  [NotifType.ABSENCE]: 'bg-red-50 dark:bg-red-900/20',
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkRead, compact = false }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (!notification.isRead) onMarkRead?.(notification.id);
    if (notification.link) navigate(notification.link);
  };
  const icon = notifIcons[notification.type] ?? <Info className="h-5 w-5 text-gray-500" />;
  const iconBg = notifBg[notification.type] ?? 'bg-gray-50 dark:bg-gray-800';
  return (
    <div onClick={handleClick} className={clsx('flex gap-3 p-3 rounded-lg transition-colors cursor-pointer', !notification.isRead ? 'bg-primary-50/60 hover:bg-primary-50 dark:bg-primary-900/10 dark:hover:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800', compact && 'p-2.5')}>
      <div className={clsx('flex-shrink-0 flex items-center justify-center rounded-lg', compact ? 'h-8 w-8' : 'h-10 w-10', iconBg)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={clsx('text-sm leading-snug', !notification.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300')}>{notification.title}</p>
          {!notification.isRead && <span className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-primary-600" />}
        </div>
        {!compact && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{notification.content}</p>}
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</p>
      </div>
    </div>
  );
};

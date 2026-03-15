import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Moon, Sun, Menu } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { notificationsApi } from '@/api/notifications';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useBreadcrumbContext } from './BreadcrumbContext';

interface Breadcrumb {
  label: string;
  href?: string;
}

function useBreadcrumbs(): Breadcrumb[] {
  const location = useLocation();
  const { labels: dynamicLabels } = useBreadcrumbContext();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return [{ label: 'Dashboard' }];

  const labelMap: Record<string, string> = {
    students: 'Students',
    teachers: 'Teachers',
    rooms: 'Rooms',
    courses: 'Courses',
    families: 'Families',
    billing: 'Billing',
    invoices: 'Invoices',
    pricing: 'Pricing Rules',
    messaging: 'Messaging',
    notifications: 'Notifications',
    reports: 'Reports',
    vacations: 'Vacations',
    settings: 'Settings',
    profile: 'Profile',
    calendar: 'Calendar',
    events: 'Events',
  };

  const crumbs: Breadcrumb[] = [{ label: 'Home', href: '/' }];

  segments.forEach((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const isId = !labelMap[seg] && /^[0-9a-zA-Z_-]{15,}$/.test(seg);
    const label = isId
      ? (dynamicLabels[seg] || 'Detail')
      : (labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1));
    crumbs.push(i === segments.length - 1 ? { label } : { label, href });
  });

  return crumbs;
}

export const Header: React.FC = () => {
  const { theme, toggleTheme, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const breadcrumbs = useBreadcrumbs();
  const [notifOpen, setNotifOpen] = React.useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000, // Poll every 30s
  });

  const displayName = user?.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user?.email || '';

  return (
    <header className="flex items-center h-16 px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 gap-4">
      {/* Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex-1 min-w-0" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm overflow-x-auto">
          {breadcrumbs.map((crumb, i) => (
            <li key={i} className="flex items-center gap-1.5 flex-shrink-0">
              {i > 0 && (
                <span className="text-gray-300 dark:text-gray-600">/</span>
              )}
              {crumb.href && i < breadcrumbs.length - 1 ? (
                <Link
                  to={crumb.href}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={clsx(
                    i === breadcrumbs.length - 1
                      ? 'font-medium text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Right side controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* User avatar */}
        <Link
          to="/profile"
          className="flex items-center gap-2 ml-1 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Avatar
            src={user?.profile?.avatarUrl}
            name={displayName}
            size="sm"
          />
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
            {displayName}
          </span>
        </Link>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  GraduationCap,
  DoorOpen,
  BookOpen,
  Receipt,
  FileText,
  DollarSign,
  MessageSquare,
  Bell,
  BarChart3,
  Umbrella,
  Settings,
  User,
  LogOut,
  Music2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  PartyPopper,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Role } from '@/types';
import { Avatar } from '@/components/ui/Avatar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: Role[];
  children?: Omit<NavItem, 'children'>[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: 'Students',
    href: '/students',
    icon: <GraduationCap className="h-5 w-5" />,
    roles: [Role.ADMIN, Role.TEACHER],
  },
  {
    label: 'Families',
    href: '/families',
    icon: <Home className="h-5 w-5" />,
    roles: [Role.ADMIN],
  },
  {
    label: 'Teachers',
    href: '/teachers',
    icon: <Users className="h-5 w-5" />,
    roles: [Role.ADMIN],
  },
  {
    label: 'Rooms',
    href: '/rooms',
    icon: <DoorOpen className="h-5 w-5" />,
    roles: [Role.ADMIN],
  },
  {
    label: 'Courses',
    href: '/courses',
    icon: <BookOpen className="h-5 w-5" />,
    roles: [Role.ADMIN, Role.TEACHER],
  },
  {
    label: 'Billing',
    href: '/billing',
    icon: <DollarSign className="h-5 w-5" />,
    roles: [Role.ADMIN, Role.PARENT, Role.STUDENT],
    children: [
      {
        label: 'Overview',
        href: '/billing',
        icon: <DollarSign className="h-4 w-4" />,
        roles: [Role.ADMIN, Role.PARENT, Role.STUDENT],
      },
      {
        label: 'Invoices',
        href: '/billing/invoices',
        icon: <FileText className="h-4 w-4" />,
        roles: [Role.ADMIN, Role.PARENT, Role.STUDENT],
      },
      {
        label: 'Pricing Rules',
        href: '/billing/pricing',
        icon: <Receipt className="h-4 w-4" />,
        roles: [Role.ADMIN],
      },
    ],
  },
  {
    label: 'Events',
    href: '/events',
    icon: <PartyPopper className="h-5 w-5" />,
    roles: [Role.ADMIN, Role.TEACHER, Role.SUPER_ADMIN],
  },
  {
    label: 'Messaging',
    href: '/messaging',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: [Role.ADMIN, Role.TEACHER],
  },
  {
    label: 'Vacations',
    href: '/vacations',
    icon: <Umbrella className="h-5 w-5" />,
    roles: [Role.ADMIN],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
    roles: [Role.ADMIN],
  },
];

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  userRole?: Role;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, collapsed, userRole }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const isSuperAdmin = userRole === Role.SUPER_ADMIN;

  if (!isSuperAdmin && item.roles && userRole && !item.roles.includes(userRole)) {
    return null;
  }

  if (item.children) {
    const visibleChildren = item.children.filter(
      (child) => isSuperAdmin || !child.roles || !userRole || child.roles.includes(userRole)
    );
    if (visibleChildren.length === 0) return null;

    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={clsx(
            'flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? item.label : undefined}
          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="ml-3 flex-1 text-left">{item.label}</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </>
          )}
        </button>

        {isExpanded && !collapsed && (
          <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3">
            {visibleChildren.map((child) => (
              <NavLink
                key={child.href}
                to={child.href}
                end={child.href === '/billing'}
                data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                  )
                }
              >
                {child.icon}
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      className={({ isActive }) =>
        clsx(
          'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
          collapsed && 'justify-center px-2'
        )
      }
      title={collapsed ? item.label : undefined}
      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && <span className="ml-3">{item.label}</span>}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const displayName = user?.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user?.email || 'User';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700',
        'transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          'flex items-center h-16 border-b border-gray-200 dark:border-gray-700 flex-shrink-0',
          sidebarCollapsed ? 'justify-center px-3' : 'px-5 gap-3'
        )}
      >
        <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-primary-600">
          <Music2 className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight" data-testid="sidebar-brand">
            Music Academy
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            collapsed={sidebarCollapsed}
            userRole={user?.role}
          />
        ))}
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(
              'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800',
              sidebarCollapsed && 'justify-center px-2'
            )
          }
          title={sidebarCollapsed ? 'Profile' : undefined}
        >
          <User className="h-5 w-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="ml-3">Profile</span>}
        </NavLink>

        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar
              src={user?.profile?.avatarUrl}
              name={displayName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
            sidebarCollapsed && 'justify-center px-2'
          )}
          title={sidebarCollapsed ? 'Logout' : undefined}
          data-testid="logout-btn"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="ml-3">Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={clsx(
            'flex items-center w-full rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            'dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors',
            sidebarCollapsed && 'justify-center px-2'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          data-testid="sidebar-toggle"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2 text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

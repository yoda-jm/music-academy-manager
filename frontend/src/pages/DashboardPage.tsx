import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  DollarSign,
  AlertCircle,
  Calendar,
  BookOpen,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { SessionStatusBadge, EnrollmentStatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import apiClient from '@/api/client';

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/dashboard-stats');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Active Students"
          value={isLoading ? '—' : stats?.activeStudents ?? 0}
          icon={<GraduationCap className="h-6 w-6" />}
          iconColor="text-primary-600"
          iconBg="bg-primary-50 dark:bg-primary-900/20"
          isLoading={isLoading}
        />
        <StatCard
          title="Teachers"
          value={isLoading ? '—' : stats?.activeTeachers ?? 0}
          icon={<Users className="h-6 w-6" />}
          iconColor="text-secondary-600"
          iconBg="bg-secondary-50 dark:bg-secondary-900/20"
          isLoading={isLoading}
        />
        <StatCard
          title="Revenue This Month"
          value={isLoading ? '—' : `$${(stats?.revenueThisMonth ?? 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          iconColor="text-green-600"
          iconBg="bg-green-50 dark:bg-green-900/20"
          isLoading={isLoading}
        />
        <StatCard
          title="Overdue Invoices"
          value={isLoading ? '—' : stats?.overdueInvoices ?? 0}
          icon={<AlertCircle className="h-6 w-6" />}
          iconColor="text-red-600"
          iconBg="bg-red-50 dark:bg-red-900/20"
          isLoading={isLoading}
          onClick={() => window.location.assign('/billing/invoices?status=OVERDUE')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's sessions */}
        <Card>
          <Card.Header
            action={
              <Link to="/calendar">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  View all
                </Button>
              </Link>
            }
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Today's Sessions
              </h2>
            </div>
          </Card.Header>
          <Card.Body>
            {isLoading ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : !stats?.todaySessions?.length ? (
              <p className="text-sm text-gray-500 text-center py-6">No sessions scheduled today.</p>
            ) : (
              <div className="space-y-3">
                {stats.todaySessions.slice(0, 5).map((session: { id: string; courseId?: string; startTime: string; endTime: string; course?: { id?: string; name: string }; room?: { name: string }; status: string }) => (
                  <Link
                    key={session.id}
                    to={session.courseId ? `/courses/${session.courseId}` : `/calendar`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-shrink-0 text-primary-600 dark:text-primary-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {session.course?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(session.startTime), 'HH:mm')} —{' '}
                        {format(new Date(session.endTime), 'HH:mm')}
                        {session.room && ` · ${session.room.name}`}
                      </p>
                    </div>
                    <SessionStatusBadge status={session.status as import('@/types').SessionStatus} />
                  </Link>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Recent enrollments */}
        <Card>
          <Card.Header
            action={
              <Link to="/students">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  View all
                </Button>
              </Link>
            }
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary-600" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Recent Enrollments
              </h2>
            </div>
          </Card.Header>
          <Card.Body>
            {isLoading ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : !stats?.recentEnrollments?.length ? (
              <p className="text-sm text-gray-500 text-center py-6">No recent enrollments.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentEnrollments.slice(0, 5).map((enrollment: {
                  id: string;
                  status: string;
                  createdAt: string;
                  student?: { user?: { profile?: { firstName: string; lastName: string; avatarUrl?: string } } };
                  course?: { name: string };
                }) => {
                  const profile = enrollment.student?.user?.profile;
                  const name = profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown';
                  return (
                    <div key={enrollment.id} className="flex items-center gap-3">
                      <Avatar name={name} src={profile?.avatarUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{enrollment.course?.name}</p>
                      </div>
                      <EnrollmentStatusBadge status={enrollment.status as import('@/types').EnrollmentStatus} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <Card.Header>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Add Student', href: '/students', icon: <GraduationCap className="h-5 w-5" /> },
              { label: 'Create Course', href: '/courses', icon: <BookOpen className="h-5 w-5" /> },
              { label: 'View Calendar', href: '/calendar', icon: <Calendar className="h-5 w-5" /> },
              { label: 'Billing', href: '/billing', icon: <DollarSign className="h-5 w-5" /> },
            ].map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
              >
                <div className="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {action.icon}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}


export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6" data-testid="dashboard-page">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Academy overview — {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      <AdminDashboard />
    </div>
  );
}

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  DollarSign,
  GraduationCap,
  Users,
  Clock,
  ChevronRight,
  Pin,
  PartyPopper,
  MapPin,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, SessionStatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import apiClient from '@/api/client';
import { eventsApi } from '@/api/events';

// Upcoming sessions for the current user (works for all roles via scheduling/calendar)
function UpcomingSessions() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const inTwoWeeks = format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['home', 'upcoming-sessions'],
    queryFn: async () => {
      const res = await apiClient.get('/scheduling/calendar', {
        params: { start: today, end: inTwoWeeks },
      });
      const raw: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      return raw.map((s: any) => ({
        id: s.id,
        title: s.course?.name || 'Session',
        start: s.startTime || s.start,
        end: s.endTime || s.end,
        courseType: s.course?.type,
        courseId: s.course?.id,
      })) as { id: string; title: string; start: string; end: string; courseType?: string; courseId?: string }[];
    },
  });

  return (
    <Card>
      <Card.Header
        action={
          <Link to="/calendar">
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
              Full calendar
            </Button>
          </Link>
        }
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Upcoming Sessions
          </h2>
        </div>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !sessions?.length ? (
          <p className="text-sm text-gray-500 text-center py-6">No upcoming sessions in the next 2 weeks.</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 8).map((ev) => {
              const startDate = new Date(ev.start);
              const isToday = format(startDate, 'yyyy-MM-dd') === today;
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => ev.courseId && navigate(`/courses/${ev.courseId}`)}
                  data-testid="upcoming-session-item"
                >
                  <div className="flex-shrink-0 w-10 text-center">
                    <p className="text-xs font-medium text-gray-400 uppercase">
                      {format(startDate, 'EEE')}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}>
                      {format(startDate, 'd')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(startDate, 'HH:mm')} — {format(new Date(ev.end), 'HH:mm')}
                    </p>
                  </div>
                  {isToday && <Badge variant="info" size="sm">Today</Badge>}
                </div>
              );
            })}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function UpcomingEvents() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => eventsApi.getEvents({ upcoming: true }),
  });

  const upcomingPublic = (events || []).filter((e) => e.isPublic).slice(0, 3);

  if (!isLoading && upcomingPublic.length === 0) return null;

  return (
    <Card>
      <Card.Header
        action={
          <Link to="/events">
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
              All events
            </Button>
          </Link>
        }
      >
        <div className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Upcoming Events
          </h2>
        </div>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <div className="space-y-3">
            {upcomingPublic.map((event) => {
              const start = new Date(event.startDate);
              const end = new Date(event.endDate);
              const today = new Date();
              const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isThisWeek = daysUntil <= 7 && daysUntil >= 0;
              return (
                <Link key={event.id} to={`/events/${event.id}`} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors group">
                  <div className="flex-shrink-0 w-12 text-center bg-amber-100 dark:bg-amber-900/20 rounded-lg py-1">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">{format(start, 'MMM')}</p>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300 leading-tight">{format(start, 'd')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                      {event.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                      {event.isAllDay
                        ? isSameDay(start, end) ? 'All day' : `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
                        : `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`}
                      {event.location && <><span>·</span><MapPin className="h-3 w-3" />{event.location}</>}
                    </p>
                  </div>
                  {isThisWeek && <Badge variant="warning" size="sm">Soon</Badge>}
                </Link>
              );
            })}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function QuickLinks({ role }: { role?: Role }) {
  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
  const isTeacher = role === Role.TEACHER;

  const links = [
    ...(isAdmin
      ? [
          { label: 'Students', href: '/students', icon: <GraduationCap className="h-5 w-5" /> },
          { label: 'Courses', href: '/courses', icon: <BookOpen className="h-5 w-5" /> },
          { label: 'Billing', href: '/billing', icon: <DollarSign className="h-5 w-5" /> },
          { label: 'Families', href: '/families', icon: <Users className="h-5 w-5" /> },
        ]
      : []),
    ...(isTeacher
      ? [
          { label: 'My Courses', href: '/courses', icon: <BookOpen className="h-5 w-5" /> },
          { label: 'Students', href: '/students', icon: <GraduationCap className="h-5 w-5" /> },
        ]
      : []),
    { label: 'Calendar', href: '/calendar', icon: <Calendar className="h-5 w-5" /> },
    ...(role === Role.STUDENT || role === Role.PARENT
      ? [{ label: 'Invoices', href: '/billing/invoices', icon: <DollarSign className="h-5 w-5" /> }]
      : []),
  ];

  return (
    <Card>
      <Card.Header>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Quick Links</h2>
      </Card.Header>
      <Card.Body>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
            >
              <div className="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {link.icon}
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-700 dark:group-hover:text-primary-300">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

export default function HomePage() {
  const { user } = useAuthStore();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const name = user?.profile?.firstName || user?.email?.split('@')[0] || 'there';
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

  return (
    <div data-testid="dashboard-page">
      <div className="mb-6">
        <h1 data-testid="dashboard-greeting" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {greeting()}, {name}!
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Pinned notice area — placeholder for future news/announcements */}
      <div className="mb-6 p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10 flex items-start gap-3">
        <Pin className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-primary-800 dark:text-primary-300">
          <p className="font-medium">Welcome to Music Academy</p>
          <p className="text-primary-600 dark:text-primary-400 mt-0.5">
            Announcements and news will appear here.{' '}
            {isAdmin && (
              <span className="text-xs text-primary-500">
                (Pinned message management coming soon)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingSessions />
        <div className="space-y-6">
          <UpcomingEvents />
          <QuickLinks role={user?.role} />
        </div>
      </div>
    </div>
  );
}

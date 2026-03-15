import React, { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { schedulingApi } from '@/api/scheduling';
import { vacationsApi } from '@/api/vacations';
import { eventsApi } from '@/api/events';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/Dialog';
import { Badge, SessionStatusBadge, CourseTypeBadge } from '@/components/ui/Badge';
import { CourseSession, CourseType, Vacation, Event } from '@/types';
import { useNavigate } from 'react-router-dom';
import { format as fmtDate } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const courseTypeColors: Record<CourseType, string> = {
  [CourseType.PRIVATE_LESSON]: '#4f46e5', // indigo
  [CourseType.GROUP_INSTRUMENT]: '#059669', // green
  [CourseType.MUSIC_THEORY]: '#0891b2', // cyan
  [CourseType.WORKSHOP]: '#d97706', // amber
  [CourseType.MASTERCLASS]: '#7c3aed', // violet
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: CourseSession | Vacation;
  type: 'session' | 'vacation';
  color?: string;
}

interface AcademyCalendarProps {
  teacherFilter?: string;
  roomFilter?: string;
  studentFilter?: string;
  onTeacherFilterChange?: (id: string) => void;
  onRoomFilterChange?: (id: string) => void;
  onStudentFilterChange?: (id: string) => void;
  teacherOptions?: { value: string; label: string }[];
  roomOptions?: { value: string; label: string }[];
  studentOptions?: { value: string; label: string }[];
  className?: string;
}

const CustomToolbar: React.FC<{
  label: string;
  view: View;
  date: Date;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: View) => void;
  onDateChange: (date: Date) => void;
}> = ({ label, view, date, onNavigate, onView: onViewChange, onDateChange }) => (
  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
    <div className="flex items-center gap-2">
      <button
        onClick={() => onNavigate('PREV')}
        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => onNavigate('TODAY')}
        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Today
      </button>
      <button
        onClick={() => onNavigate('NEXT')}
        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 ml-2">{label}</h2>
    </div>
    <div className="flex items-center gap-3">
      <input
        type="date"
        value={format(date, 'yyyy-MM-dd')}
        onChange={(e) => e.target.value && onDateChange(new Date(e.target.value + 'T12:00:00'))}
        className="h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <div className="flex items-center gap-2">
        {(['month', 'week', 'day', 'agenda'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
              view === v
                ? 'bg-primary-600 text-white'
                : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export const AcademyCalendar: React.FC<AcademyCalendarProps> = ({
  teacherFilter,
  roomFilter,
  studentFilter,
  onTeacherFilterChange,
  onRoomFilterChange,
  onStudentFilterChange,
  teacherOptions = [],
  roomOptions = [],
  studentOptions = [],
  className,
}) => {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null);
  const navigate = useNavigate();

  const rangeStart = startOfMonth(date);
  const rangeEnd = endOfMonth(date);

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', format(rangeStart, 'yyyy-MM-dd'), format(rangeEnd, 'yyyy-MM-dd'), teacherFilter, roomFilter, studentFilter],
    queryFn: () =>
      schedulingApi.getCalendarEvents({
        start: format(rangeStart, 'yyyy-MM-dd'),
        end: format(rangeEnd, 'yyyy-MM-dd'),
        teacherId: teacherFilter || undefined,
        roomId: roomFilter || undefined,
        studentId: studentFilter || undefined,
      }),
  });

  const { data: vacations } = useQuery({
    queryKey: ['vacations', date.getFullYear()],
    queryFn: () => vacationsApi.getVacations({ year: date.getFullYear() }),
  });

  const { data: academyEvents } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => eventsApi.getEvents(),
  });

  const events: CalendarEvent[] = React.useMemo(() => {
    const sessionEvents: CalendarEvent[] = (calendarData || []).map((ev) => ({
      ...ev,
      start: ev.start instanceof Date ? ev.start : new Date(ev.start as any),
      end: ev.end instanceof Date ? ev.end : new Date(ev.end as any),
      color: ev.color || courseTypeColors[ev.courseType || CourseType.PRIVATE_LESSON],
    }));

    const vacationEvents: CalendarEvent[] = (vacations || []).map((v) => ({
      id: v.id,
      title: `🏖 ${v.name}`,
      start: new Date(v.startDate),
      end: new Date(v.endDate),
      resource: v,
      type: 'vacation',
      color: '#94a3b8',
    }));

    const eventEvents: CalendarEvent[] = (academyEvents || []).map((e) => ({
      id: `event-${e.id}`,
      title: `🎵 ${e.name}`,
      start: new Date(e.startDate),
      end: new Date(e.endDate),
      resource: e,
      type: 'event' as any,
      color: '#f59e0b',
      allDay: e.isAllDay,
    }));

    return [...sessionEvents, ...vacationEvents, ...eventEvents];
  }, [calendarData, vacations, academyEvents]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const color = event.color || '#4f46e5';
    if (event.type === 'vacation') {
      return {
        style: {
          backgroundColor: `${color}20`,
          borderColor: color,
          borderWidth: '1px',
          color: '#64748b',
          fontStyle: 'italic',
        },
      };
    }
    if ((event.type as string) === 'event') {
      return {
        style: {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          borderWidth: '2px',
          color: '#92400e',
          borderRadius: '6px',
          fontSize: '12px',
          padding: '2px 6px',
          fontWeight: '600',
        },
      };
    }
    return {
      style: {
        backgroundColor: color,
        borderColor: 'transparent',
        color: 'white',
        borderRadius: '6px',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.type === 'session' && event.resource) {
      const session = event.resource as CourseSession;
      if (session.courseId) {
        navigate(`/courses/${session.courseId}`);
      } else {
        setSelectedSession(session);
      }
    } else if ((event.type as string) === 'event' && event.resource) {
      const ev = event.resource as Event;
      navigate(`/events/${ev.id}`);
    } else if (event.type === 'vacation') {
      navigate('/vacations');
    }
  }, [navigate]);

  return (
    <div className={clsx('flex flex-col', className)}>
      {/* Filters */}
      {(teacherOptions.length > 0 || roomOptions.length > 0 || studentOptions.length > 0) && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {teacherOptions.length > 0 && onTeacherFilterChange && (
            <Select
              options={[{ value: '__all__', label: 'All teachers' }, ...teacherOptions]}
              value={teacherFilter || '__all__'}
              onValueChange={(v) => onTeacherFilterChange(v === '__all__' ? '' : v)}
              containerClassName="w-48"
            />
          )}
          {roomOptions.length > 0 && onRoomFilterChange && (
            <Select
              options={[{ value: '__all__', label: 'All rooms' }, ...roomOptions]}
              value={roomFilter || '__all__'}
              onValueChange={(v) => onRoomFilterChange(v === '__all__' ? '' : v)}
              containerClassName="w-40"
            />
          )}
          {studentOptions.length > 0 && onStudentFilterChange && (
            <Select
              options={[{ value: '__all__', label: 'All students' }, ...studentOptions]}
              value={studentFilter || '__all__'}
              onValueChange={(v) => onStudentFilterChange(v === '__all__' ? '' : v)}
              containerClassName="w-48"
            />
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {Object.entries(courseTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {type.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              toolbar: ((props: any) => (
                <CustomToolbar
                  {...props}
                  date={date}
                  onDateChange={setDate}
                />
              )) as any,
            }}
            formats={{
              dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                `${fmtDate(start, 'MMM d')} – ${fmtDate(end, 'MMM d, yyyy')}`,
              dayHeaderFormat: (d: Date) => fmtDate(d, 'EEEE, MMMM d, yyyy'),
              monthHeaderFormat: (d: Date) => fmtDate(d, 'MMMM yyyy'),
              agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                `${fmtDate(start, 'MMM d')} – ${fmtDate(end, 'MMM d, yyyy')}`,
            }}
            popup
            showAllEvents
          />
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <Dialog
          open={!!selectedSession}
          onOpenChange={() => setSelectedSession(null)}
          title="Session Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedSession.course?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {fmtDate(new Date(selectedSession.startTime), 'EEEE, MMMM d yyyy')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Start time</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {fmtDate(new Date(selectedSession.startTime), 'HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">End time</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {fmtDate(new Date(selectedSession.endTime), 'HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <SessionStatusBadge status={selectedSession.status} />
              </div>
              {selectedSession.course?.type && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Type</p>
                  <CourseTypeBadge type={selectedSession.course.type} />
                </div>
              )}
              {selectedSession.course?.teacher?.user?.profile && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Teacher</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedSession.course.teacher.user.profile.firstName}{' '}
                    {selectedSession.course.teacher.user.profile.lastName}
                  </p>
                </div>
              )}
              {selectedSession.room && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Room</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedSession.room.name}
                  </p>
                </div>
              )}
            </div>

            {selectedSession.notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {selectedSession.notes}
                </p>
              </div>
            )}

            {selectedSession._count && (
              <div className="flex items-center gap-2">
                <Badge variant="info">
                  {selectedSession._count.attendance} attendance records
                </Badge>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
};

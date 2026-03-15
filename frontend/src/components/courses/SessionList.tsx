import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Clock, Users } from 'lucide-react';
import { coursesApi } from '@/api/courses';
import { Spinner } from '@/components/ui/Spinner';
import { SessionStatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Dialog } from '@/components/ui/Dialog';
import { AttendanceSheet } from '@/components/attendance/AttendanceSheet';

interface SessionListProps {
  courseId: string;
}

export const SessionList: React.FC<SessionListProps> = ({ courseId }) => {
  const { page, limit, setPage, setLimit } = usePagination({ initialLimit: 10 });
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', courseId, 'sessions', page, limit],
    queryFn: () => coursesApi.getCourseSessions(courseId, { page, limit }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const sessions = data?.data || [];

  return (
    <div className="space-y-3">
      {sessions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No sessions found. Generate sessions to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-sm hover:border-primary-200 dark:hover:border-primary-800 transition-all"
            >
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <Calendar className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {format(new Date(session.startTime), 'EEEE, MMM d, yyyy')}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {format(new Date(session.startTime), 'HH:mm')} —{' '}
                    {format(new Date(session.endTime), 'HH:mm')}
                  </div>
                </div>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-3">
                {session.room && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {session.room.name}
                  </span>
                )}
                {session._count !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="h-3.5 w-3.5" />
                    {session._count.attendance}
                  </div>
                )}
                <SessionStatusBadge status={session.status} />
              </div>
            </div>
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
        />
      )}

      {selectedSessionId && (
        <Dialog
          open={!!selectedSessionId}
          onOpenChange={() => setSelectedSessionId(null)}
          title="Attendance Sheet"
          size="xl"
        >
          <AttendanceSheet
            sessionId={selectedSessionId}
            courseId={courseId}
            onSaved={() => setSelectedSessionId(null)}
          />
        </Dialog>
      )}
    </div>
  );
};

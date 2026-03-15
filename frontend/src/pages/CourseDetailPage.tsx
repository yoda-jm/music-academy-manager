import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, RefreshCw, DollarSign, Clock, Users, CalendarDays } from 'lucide-react';
import { coursesApi } from '@/api/courses';
import { Button } from '@/components/ui/Button';
import { Badge, CourseTypeBadge } from '@/components/ui/Badge';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/Dialog';
import { CourseForm } from '@/components/courses/CourseForm';
import { EnrollmentManager } from '@/components/courses/EnrollmentManager';
import { SessionList } from '@/components/courses/SessionList';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { useToast } from '@/components/ui/Toast';
import { useSetBreadcrumb } from '@/components/layout/BreadcrumbContext';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.getCourse(id!),
    enabled: !!id,
  });

  useSetBreadcrumb(id, course?.name);

  const generateMutation = useMutation({
    mutationFn: () => coursesApi.generateSessions(id!),
    onSuccess: (sessions) => {
      toast.success('Sessions generated', `${sessions.length} sessions created.`);
      queryClient.invalidateQueries({ queryKey: ['courses', id, 'sessions'] });
    },
    onError: () => toast.error('Error', 'Could not generate sessions.'),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="xl" /></div>;

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Course not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/courses')}>Back</Button>
      </div>
    );
  }

  const teacherProfile = course.teacher?.user?.profile;
  const teacherName = teacherProfile
    ? `${teacherProfile.firstName} ${teacherProfile.lastName}`
    : course.teacher?.user?.email || 'Unknown';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/courses')}>
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1 truncate">{course.name}</h1>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<CalendarDays className="h-4 w-4" />}
          onClick={() => navigate(`/calendar?teacher=${course.teacherId}&room=${course.roomId}`)}
        >
          Calendar
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          isLoading={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          Generate Sessions
        </Button>
        <Button variant="outline" size="sm" leftIcon={<Edit2 className="h-4 w-4" />} onClick={() => setShowEdit(true)}>
          Edit
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
              <CourseTypeBadge type={course.type} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Teacher</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{teacherName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Room</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{course.room?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <Badge variant={course.isActive ? 'success' : 'gray'} dot>
                {course.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{course.durationMinutes} min/session</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {[
                  course.pricePerSession != null && `$${Number(course.pricePerSession).toFixed(2)}/session`,
                  course.priceMonthly != null && `$${Number(course.priceMonthly).toFixed(2)}/month`,
                  course.priceYearly != null && `$${Number(course.priceYearly).toFixed(2)}/year`,
                ].filter(Boolean).join(' · ') || 'No pricing set'}
              </span>
            </div>
            {course.maxStudents && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Max {course.maxStudents} students</span>
              </div>
            )}
            {course.instrument && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Instrument</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{course.instrument.name}</p>
              </div>
            )}
          </div>
          {course.description && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              {course.description}
            </p>
          )}
        </Card.Body>
      </Card>

      <Tabs
        tabs={[
          { value: 'sessions', label: 'Sessions', badge: course._count?.sessions },
          { value: 'enrollments', label: 'Enrollments', badge: course._count?.enrollments },
          { value: 'attendance', label: 'Attendance Stats' },
        ]}
      >
        <TabContent value="sessions">
          <SessionList courseId={course.id} />
        </TabContent>
        <TabContent value="enrollments">
          <EnrollmentManager courseId={course.id} />
        </TabContent>
        <TabContent value="attendance">
          <AttendanceStats courseId={course.id} />
        </TabContent>
      </Tabs>

      <Dialog open={showEdit} onOpenChange={setShowEdit} title="Edit Course" size="xl">
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <CourseForm course={course} onSuccess={() => setShowEdit(false)} onCancel={() => setShowEdit(false)} />
        </div>
      </Dialog>
    </div>
  );
}

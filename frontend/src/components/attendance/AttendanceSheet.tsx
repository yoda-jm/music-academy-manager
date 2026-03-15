import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, X, Clock, Shield, RefreshCw, Save, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { attendanceApi, BulkAttendanceEntry } from '@/api/attendance';
import { coursesApi } from '@/api/courses';
import { AttendanceStatus, Enrollment } from '@/types';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AttendanceStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ReactNode; color: string }> = {
  [AttendanceStatus.PRESENT]: {
    label: 'Present',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400',
  },
  [AttendanceStatus.ABSENT]: {
    label: 'Absent',
    icon: <X className="h-4 w-4" />,
    color: 'text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400',
  },
  [AttendanceStatus.LATE]: {
    label: 'Late',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400',
  },
  [AttendanceStatus.EXCUSED]: {
    label: 'Excused',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400',
  },
  [AttendanceStatus.MAKEUP]: {
    label: 'Makeup',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-400',
  },
};

interface AttendanceSheetProps {
  sessionId: string;
  courseId: string;
  onSaved?: () => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  sessionId,
  courseId,
  onSaved,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Load enrolled students
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['courses', courseId, 'enrollments'],
    queryFn: () => coursesApi.getCourseEnrollments(courseId),
  });

  // Load existing attendance
  const { data: existingAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 'session', sessionId],
    queryFn: () => attendanceApi.getSessionAttendance(sessionId),
  });

  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({});

  // Initialize map from existing attendance data
  React.useEffect(() => {
    if (existingAttendance) {
      const map: Record<string, AttendanceStatus> = {};
      existingAttendance.forEach((a) => {
        map[a.studentId] = a.status;
      });
      setAttendanceMap(map);
    }
  }, [existingAttendance]);

  const bulkUpdateMutation = useMutation({
    mutationFn: (entries: BulkAttendanceEntry[]) =>
      attendanceApi.bulkUpdateAttendance(sessionId, entries),
    onSuccess: () => {
      toast.success('Attendance saved', 'All records have been updated.');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'session', sessionId] });
      onSaved?.();
    },
    onError: () => {
      toast.error('Save failed', 'Could not save attendance records.');
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const newMap: Record<string, AttendanceStatus> = {};
    (enrollments || []).forEach((e) => {
      newMap[e.studentId] = AttendanceStatus.PRESENT;
    });
    setAttendanceMap(newMap);
  };

  const handleSave = () => {
    if (!enrollments) return;
    const entries: BulkAttendanceEntry[] = enrollments.map((e) => ({
      studentId: e.studentId,
      status: attendanceMap[e.studentId] || AttendanceStatus.ABSENT,
    }));
    bulkUpdateMutation.mutate(entries);
  };

  const isLoading = enrollmentsLoading || attendanceLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeEnrollments = (enrollments || []).filter(
    (e) => e.status === 'ACTIVE'
  ) as Enrollment[];

  const presentCount = Object.values(attendanceMap).filter(
    (s) => s === AttendanceStatus.PRESENT || s === AttendanceStatus.LATE || s === AttendanceStatus.MAKEUP
  ).length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4" />
          <span>
            {presentCount} / {activeEnrollments.length} students present
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
            Mark All Present
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="h-4 w-4" />}
            isLoading={bulkUpdateMutation.isPending}
            onClick={handleSave}
          >
            Save Attendance
          </Button>
        </div>
      </div>

      {activeEnrollments.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No active enrollments for this course.
        </div>
      ) : (
        <div className="space-y-2">
          {activeEnrollments.map((enrollment) => {
            const student = enrollment.student;
            const profile = student?.user?.profile;
            const displayName = profile
              ? `${profile.firstName} ${profile.lastName}`
              : student?.user?.email || 'Unknown';
            const currentStatus = attendanceMap[enrollment.studentId];

            return (
              <div
                key={enrollment.id}
                className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <Avatar name={displayName} size="sm" src={profile?.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {displayName}
                  </p>
                  {currentStatus && (
                    <div className="mt-0.5">
                      <AttendanceStatusBadge status={currentStatus} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {Object.values(AttendanceStatus).map((status) => {
                    const config = statusConfig[status];
                    const isActive = currentStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(enrollment.studentId, status)}
                        className={clsx(
                          'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                          isActive
                            ? config.color
                            : 'text-gray-500 border-gray-200 hover:border-gray-300 dark:text-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
                        )}
                        title={config.label}
                      >
                        {config.icon}
                        <span className="hidden sm:inline">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

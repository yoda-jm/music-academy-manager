import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2 } from 'lucide-react';
import { coursesApi } from '@/api/courses';
import { studentsApi } from '@/api/students';
import { Enrollment } from '@/types';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EnrollmentStatusBadge } from '@/components/ui/Badge';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';

interface EnrollmentManagerProps {
  courseId: string;
}

export const EnrollmentManager: React.FC<EnrollmentManagerProps> = ({ courseId }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['courses', courseId, 'enrollments'],
    queryFn: () => coursesApi.getCourseEnrollments(courseId),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students', { search: studentSearch, limit: 10 }],
    queryFn: () => studentsApi.getStudents({ page: 1, limit: 10, search: studentSearch }),
    enabled: !!studentSearch && studentSearch.length > 1,
  });

  const enrollMutation = useMutation({
    mutationFn: (studentId: string) => coursesApi.enrollStudent(courseId, studentId),
    onSuccess: () => {
      toast.success('Student enrolled');
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'enrollments'] });
      setShowAddDialog(false);
      setStudentSearch('');
    },
    onError: () => toast.error('Error', 'Could not enroll student.'),
  });

  const unenrollMutation = useMutation({
    mutationFn: (enrollmentId: string) => coursesApi.unenrollStudent(courseId, enrollmentId),
    onSuccess: () => {
      toast.success('Student removed from course');
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'enrollments'] });
      setRemovingId(null);
    },
    onError: () => toast.error('Error', 'Could not unenroll student.'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const existingStudentIds = new Set((enrollments || []).map((e) => e.studentId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {(enrollments || []).filter((e) => e.status === 'ACTIVE').length} active enrollment(s)
        </p>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Student
        </Button>
      </div>

      {(!enrollments || enrollments.length === 0) ? (
        <p className="text-sm text-gray-500 text-center py-8">No students enrolled yet.</p>
      ) : (
        <div className="space-y-2">
          {(enrollments as Enrollment[]).map((enrollment) => {
            const profile = enrollment.student?.user?.profile;
            const name = profile
              ? `${profile.firstName} ${profile.lastName}`
              : enrollment.student?.user?.email || 'Unknown';

            return (
              <div
                key={enrollment.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => enrollment.student?.id && navigate(`/students/${enrollment.student.id}`)}
              >
                <Avatar name={name} size="sm" src={profile?.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enrolled {format(new Date(enrollment.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <EnrollmentStatusBadge status={enrollment.status} />
                <button
                  onClick={(e) => { e.stopPropagation(); setRemovingId(enrollment.id); }}
                  className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove student"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add student dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Enroll Student"
        description="Search for a student to add to this course."
      >
        <div className="space-y-3">
          <SearchInput
            value={studentSearch}
            onChange={setStudentSearch}
            placeholder="Search students..."
            autoFocus
          />

          {studentsData && (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {studentsData.data
                .filter((s) => !existingStudentIds.has(s.id))
                .map((student) => {
                  const profile = student.user?.profile;
                  const name = profile
                    ? `${profile.firstName} ${profile.lastName}`
                    : student.user?.email || 'Unknown';
                  return (
                    <button
                      key={student.id}
                      onClick={() => enrollMutation.mutate(student.id)}
                      disabled={enrollMutation.isPending}
                      className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Avatar name={name} size="sm" src={profile?.avatarUrl} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p>
                        <p className="text-xs text-gray-500">{student.user?.email}</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Confirm removal */}
      <ConfirmDialog
        open={!!removingId}
        onOpenChange={(open) => !open && setRemovingId(null)}
        title="Remove Student"
        description="Are you sure you want to remove this student from the course? This cannot be undone."
        confirmLabel="Remove"
        onConfirm={() => removingId && unenrollMutation.mutate(removingId)}
        isLoading={unenrollMutation.isPending}
      />
    </div>
  );
};

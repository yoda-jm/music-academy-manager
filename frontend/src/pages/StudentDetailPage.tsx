import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Mail, Phone, Calendar, Users, Home, UserX, UserCheck, Trash2 } from 'lucide-react';
import { studentsApi } from '@/api/students';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, EnrollmentStatusBadge, AttendanceStatusBadge } from '@/components/ui/Badge';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { StudentForm } from '@/components/students/StudentForm';
import { InstrumentLevelManager } from '@/components/students/InstrumentLevelManager';
import { useSetBreadcrumb } from '@/components/layout/BreadcrumbContext';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: student, isLoading } = useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsApi.getStudent(id!),
    enabled: !!id,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['students', id, 'enrollments'],
    queryFn: () => studentsApi.getStudentEnrollments(id!),
    enabled: !!id,
  });

  const { data: attendance } = useQuery({
    queryKey: ['students', id, 'attendance'],
    queryFn: () => studentsApi.getStudentAttendance(id!),
    enabled: !!id,
  });

  const isActive = student?.user?.isActive ?? false;

  const toggleActiveMutation = useMutation({
    mutationFn: () => studentsApi.updateStudent(id!, { isActive: !isActive }),
    onSuccess: () => {
      toast.success(isActive ? 'Student deactivated' : 'Student reactivated');
      queryClient.invalidateQueries({ queryKey: ['students', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowDeactivate(false);
    },
    onError: () => toast.error('Error', 'Could not update student status.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => studentsApi.deleteStudent(id!),
    onSuccess: () => {
      toast.success('Student deleted');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/students');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not delete student.';
      toast.error('Cannot delete', msg);
      setShowDelete(false);
    },
  });

  const studentName = student?.user?.profile
    ? `${student.user.profile.firstName} ${student.user.profile.lastName}`
    : student?.user?.email;
  useSetBreadcrumb(id, studentName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Student not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/students')}>
          Back to Students
        </Button>
      </div>
    );
  }

  const profile = student.user?.profile;
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : student.user?.email || 'Unknown';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/students')}
        >
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {displayName}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Edit2 className="h-4 w-4" />}
          onClick={() => setShowEdit(true)}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          onClick={() => setShowDeactivate(true)}
          className={isActive ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'}
          data-testid="student-toggle-active-btn"
        >
          {isActive ? 'Deactivate' : 'Reactivate'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={() => setShowDelete(true)}
          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          data-testid="student-delete-btn"
        >
          Delete
        </Button>
      </div>

      {/* Profile summary */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar src={profile?.avatarUrl} name={displayName} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h2>
                <Badge variant={isActive ? 'success' : 'gray'} dot>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {student.user?.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    <span>{student.user.email}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile?.dateOfBirth && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(profile.dateOfBirth), 'MMMM d, yyyy')}</span>
                  </div>
                )}
                {student.family && (
                  <Link
                    to={`/families/${student.familyId}`}
                    className="flex items-center gap-1.5 hover:text-primary-600 transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    <span>{student.family.name}</span>
                  </Link>
                )}
              </div>

              {student.notes && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  {student.notes}
                </p>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          { value: 'instruments', label: 'Instruments & Levels' },
          { value: 'enrollments', label: 'Enrollments', badge: enrollments?.length },
          { value: 'attendance', label: 'Attendance' },
          { value: 'billing', label: 'Billing' },
        ]}
      >
        <TabContent value="instruments">
          <Card>
            <Card.Body>
              <InstrumentLevelManager entityId={student.id} entityType="student" />
            </Card.Body>
          </Card>
        </TabContent>

        <TabContent value="enrollments">
          <Card>
            <Card.Body>
              {!enrollments?.length ? (
                <p className="text-sm text-gray-500 text-center py-8">Not enrolled in any courses.</p>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {e.course?.name || 'Unknown Course'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Enrolled {format(new Date(e.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <EnrollmentStatusBadge status={e.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </TabContent>

        <TabContent value="attendance">
          <Card>
            <Card.Body>
              {!attendance?.length ? (
                <p className="text-sm text-gray-500 text-center py-8">No attendance records.</p>
              ) : (
                <div className="space-y-2">
                  {attendance.slice(0, 20).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {a.session?.course?.name || 'Unknown Course'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {a.session?.startTime
                            ? format(new Date(a.session.startTime), 'MMM d, yyyy HH:mm')
                            : '—'}
                        </p>
                      </div>
                      <AttendanceStatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </TabContent>

        <TabContent value="billing">
          <Card>
            <Card.Body>
              <p className="text-sm text-gray-500 text-center py-8">
                View billing history in the{' '}
                <Link to="/billing/invoices" className="text-primary-600 hover:underline">
                  Billing section
                </Link>
                .
              </p>
            </Card.Body>
          </Card>
        </TabContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit} title="Edit Student" size="lg">
        <StudentForm
          student={student}
          onSuccess={() => setShowEdit(false)}
          onCancel={() => setShowEdit(false)}
        />
      </Dialog>

      <Dialog
        open={showDeactivate}
        onOpenChange={setShowDeactivate}
        title={isActive ? 'Deactivate Student' : 'Reactivate Student'}
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isActive
            ? 'This will mark the student as inactive. Their enrollments and history will be preserved.'
            : 'This will reactivate the student, allowing them to enrol in courses again.'}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeactivate(false)}>Cancel</Button>
          <Button
            variant={isActive ? 'destructive' : 'primary'}
            isLoading={toggleActiveMutation.isPending}
            onClick={() => toggleActiveMutation.mutate()}
            data-testid="confirm-toggle-active-btn"
          >
            {isActive ? 'Deactivate' : 'Reactivate'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete} title="Delete Student" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Permanently delete this student. This is only possible if they have no enrollments or
          attendance records. To keep the student but hide them, use <strong>Deactivate</strong> instead.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button
            variant="destructive"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            data-testid="confirm-delete-student-btn"
          >
            Delete permanently
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

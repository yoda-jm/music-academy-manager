import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Mail, Phone, Calendar, UserX, UserCheck, CalendarDays, Trash2 } from 'lucide-react';
import { InstrumentLevel } from '@/types';
import { teachersApi } from '@/api/teachers';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { DialogFooter } from '@/components/ui/Dialog';
import { InstrumentLevelManager } from '@/components/students/InstrumentLevelManager';
import { TeacherAvailabilityEditor } from '@/components/teachers/TeacherAvailabilityEditor';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { useSetBreadcrumb } from '@/components/layout/BreadcrumbContext';

// TeacherForm is used internally and exported for potential re-use

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

type FD = z.infer<typeof schema>;

function TeacherForm({
  teacher,
  onSuccess,
  onCancel,
}: {
  teacher: import('@/types').Teacher;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FD>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: teacher.user?.profile?.firstName || '',
      lastName: teacher.user?.profile?.lastName || '',
      phone: teacher.user?.profile?.phone || '',
      bio: teacher.bio || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FD) => teachersApi.updateTeacher(teacher.id, data),
    onSuccess: () => {
      toast.success('Teacher updated');
      queryClient.invalidateQueries({ queryKey: ['teachers', teacher.id] });
      onSuccess();
    },
    onError: () => toast.error('Error', 'Could not update teacher.'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" {...register('firstName')} error={errors.firstName?.message} required />
        <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} required />
      </div>
      <Input label="Phone" {...register('phone')} />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
        <textarea
          {...register('bio')}
          rows={3}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
      </DialogFooter>
    </form>
  );
}

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teachers', id],
    queryFn: () => teachersApi.getTeacher(id!),
    enabled: !!id,
  });

  const isActive = teacher?.user?.isActive ?? false;

  const deleteMutation = useMutation({
    mutationFn: () => teachersApi.deleteTeacher(id!),
    onSuccess: () => {
      toast.success('Teacher deleted');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      navigate('/teachers');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not delete teacher.';
      toast.error('Cannot delete', msg);
      setShowDelete(false);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () => teachersApi.updateTeacher(id!, { isActive: !isActive }),
    onSuccess: () => {
      toast.success(isActive ? 'Teacher deactivated' : 'Teacher reactivated');
      queryClient.invalidateQueries({ queryKey: ['teachers', id] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setShowDeactivate(false);
    },
    onError: () => toast.error('Error', 'Could not update teacher status.'),
  });

  const teacherName = teacher?.user?.profile
    ? `${teacher.user.profile.firstName} ${teacher.user.profile.lastName}`
    : teacher?.user?.email;
  useSetBreadcrumb(id, teacherName);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="xl" /></div>;
  }

  if (!teacher) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Teacher not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/teachers')}>Back</Button>
      </div>
    );
  }

  const profile = teacher.user?.profile;
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : teacher.user?.email || 'Unknown';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/teachers')}>
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1 truncate">{displayName}</h1>
        <Button variant="outline" size="sm" leftIcon={<CalendarDays className="h-4 w-4" />} onClick={() => navigate(`/calendar?teacher=${id}`)}>
          Schedule
        </Button>
        <Button variant="outline" size="sm" leftIcon={<Edit2 className="h-4 w-4" />} onClick={() => setShowEdit(true)}>
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          onClick={() => setShowDeactivate(true)}
          className={isActive ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'}
          data-testid="teacher-toggle-active-btn"
        >
          {isActive ? 'Deactivate' : 'Reactivate'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={() => setShowDelete(true)}
          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          data-testid="teacher-delete-btn"
        >
          Delete
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar src={profile?.avatarUrl} name={displayName} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h2>
                <Badge variant={isActive ? 'success' : 'gray'} dot>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {teacher.user?.email && (
                  <div className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{teacher.user.email}</div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{profile.phone}</div>
                )}
                {teacher.hireDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Hired {format(new Date(teacher.hireDate), 'MMMM yyyy')}
                  </div>
                )}
              </div>
              {teacher.bio && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  {teacher.bio}
                </p>
              )}
              {(teacher as any).specializations?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {((teacher as any).specializations as { instrumentId: string; level: string; instrument?: { name: string } }[]).map((s) => {
                    const levelLabel: Record<string, string> = {
                      BEGINNER: 'Beginner (Initiation)',
                      ELEMENTARY: 'Elementary (Cycle 1)',
                      INTERMEDIATE: 'Intermediate (Cycle 2)',
                      ADVANCED: 'Advanced (Cycle 3)',
                      PROFESSIONAL: 'Professional',
                    };
                    return (
                      <Badge key={s.instrumentId} variant="info">
                        {s.instrument?.name || s.instrumentId} — {levelLabel[s.level] ?? s.level}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      <Tabs
        tabs={[
          { value: 'instruments', label: 'Qualifications' },
          { value: 'availability', label: 'Availability' },
          { value: 'courses', label: 'Courses' },
        ]}
      >
        <TabContent value="instruments">
          <Card>
            <Card.Body>
              <InstrumentLevelManager entityId={teacher.id} entityType="teacher" />
            </Card.Body>
          </Card>
        </TabContent>

        <TabContent value="availability">
          <Card>
            <Card.Body>
              <TeacherAvailabilityEditor teacherId={teacher.id} />
            </Card.Body>
          </Card>
        </TabContent>

        <TabContent value="courses">
          <Card>
            <Card.Body>
              {!teacher.courses?.length ? (
                <p className="text-sm text-gray-500 text-center py-8">No courses assigned.</p>
              ) : (
                <div className="space-y-3">
                  {teacher.courses.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/courses/${c.id}`)}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{c.type.toLowerCase()}</p>
                      </div>
                      <Badge variant={c.isActive ? 'success' : 'gray'} dot>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </TabContent>
      </Tabs>

      <Dialog open={showEdit} onOpenChange={setShowEdit} title="Edit Teacher" size="lg">
        <TeacherForm teacher={teacher} onSuccess={() => setShowEdit(false)} onCancel={() => setShowEdit(false)} />
      </Dialog>

      <Dialog
        open={showDeactivate}
        onOpenChange={setShowDeactivate}
        title={isActive ? 'Deactivate Teacher' : 'Reactivate Teacher'}
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isActive
            ? 'This will mark the teacher as inactive. Their courses and history will be preserved.'
            : 'This will reactivate the teacher, allowing them to be assigned to courses again.'}
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

      <Dialog open={showDelete} onOpenChange={setShowDelete} title="Delete Teacher" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Permanently delete this teacher. This is only possible if they have no assigned courses.
          Their historical data (if any) will be preserved. To keep the teacher but hide them,
          use <strong>Deactivate</strong> instead.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button
            variant="destructive"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            data-testid="confirm-delete-teacher-btn"
          >
            Delete permanently
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

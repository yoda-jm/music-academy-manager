import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi, CreateCourseData } from '@/api/courses';
import { teachersApi } from '@/api/teachers';
import { roomsApi } from '@/api/rooms';
import { Course, CourseType } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import apiClient from '@/api/client';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(CourseType),
  teacherId: z.string().min(1, 'Teacher is required'),
  roomId: z.string().min(1, 'Room is required'),
  instrumentId: z.string().optional(),
  maxStudents: z.number().optional(),
  durationMinutes: z.number().min(15, 'Min 15 minutes').max(480, 'Max 8 hours').optional(),
  recurrenceRule: z.string().optional(),
  pricePerSession: z.number().min(0).optional(),
  priceMonthly: z.number().min(0).optional(),
  priceYearly: z.number().min(0).optional(),
  color: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CourseFormProps {
  course?: Course;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const typeOptions = Object.values(CourseType).map((t) => ({
  value: t,
  label: t.charAt(0) + t.slice(1).toLowerCase(),
}));

export const CourseForm: React.FC<CourseFormProps> = ({ course, onSuccess, onCancel }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!course;

  const { data: teachersData } = useQuery({
    queryKey: ['teachers', 'list'],
    queryFn: () => teachersApi.getTeachers({ page: 1, limit: 100 }),
  });

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', 'list'],
    queryFn: () => roomsApi.getRooms({ page: 1, limit: 100, isActive: true }),
  });

  const { data: instrumentsData } = useQuery({
    queryKey: ['instruments'],
    queryFn: async () => {
      const res = await apiClient.get('/instruments');
      const raw = res.data;
      return (Array.isArray(raw) ? raw : (raw?.data ?? [])) as { id: string; name: string }[];
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: course
      ? {
          name: course.name,
          description: course.description,
          type: course.type,
          teacherId: course.teacherId,
          roomId: course.roomId,
          instrumentId: course.instrumentId,
          maxStudents: course.maxStudents,
          durationMinutes: course.durationMinutes,
          recurrenceRule: course.recurrenceRule,
          pricePerSession: course.pricePerSession,
          priceMonthly: course.priceMonthly,
          priceYearly: course.priceYearly,
          color: course.color,
        }
      : {
          type: CourseType.PRIVATE_LESSON,
          durationMinutes: 60,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCourseData) => coursesApi.createCourse(data),
    onSuccess: () => {
      toast.success('Course created');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not create course.'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateCourseData>) => coursesApi.updateCourse(course!.id, data),
    onSuccess: () => {
      toast.success('Course updated');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', course!.id] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not update course.'),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const watchedType = watch('type');
  const watchedTeacherId = watch('teacherId');
  const watchedRoomId = watch('roomId');
  const watchedInstrumentId = watch('instrumentId');

  const teacherOptions = (teachersData?.data || []).map((t) => ({
    value: t.id,
    label: t.user?.profile
      ? `${t.user.profile.firstName} ${t.user.profile.lastName}`
      : t.user?.email || t.id,
  }));

  const roomOptions = (roomsData?.data || []).map((r) => ({
    value: r.id,
    label: `${r.name} (cap. ${r.capacity})`,
  }));

  const instrumentOptions = [
    { value: '__none__', label: 'No instrument specified' },
    ...(instrumentsData || []).map((i) => ({ value: i.id, label: i.name })),
  ];

  const onSubmit = (data: FormData) => {
    const payload: CreateCourseData = {
      ...data,
      roomId: data.roomId,
      instrumentId: data.instrumentId && data.instrumentId !== '__none__' ? data.instrumentId : undefined,
    };
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Course Name"
        {...register('name')}
        error={errors.name?.message}
        required
        placeholder="e.g. Piano Lessons — Beginner"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={2}
          placeholder="Optional course description..."
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Course Type"
          options={typeOptions}
          value={watchedType}
          onValueChange={(v) => setValue('type', v as CourseType)}
          error={errors.type?.message}
          required
        />
        <Select
          label="Instrument"
          options={instrumentOptions}
          value={watchedInstrumentId || '__none__'}
          onValueChange={(v) => setValue('instrumentId', v === '__none__' ? undefined : v)}
        />
      </div>

      <Select
        label="Teacher"
        options={teacherOptions}
        value={watchedTeacherId}
        onValueChange={(v) => setValue('teacherId', v)}
        error={errors.teacherId?.message}
        required
      />

      <Select
        label="Room"
        options={roomOptions}
        value={watchedRoomId || undefined}
        onValueChange={(v) => setValue('roomId', v)}
        error={errors.roomId?.message}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Duration (minutes)"
          type="number"
          min="15"
          step="15"
          {...register('durationMinutes', { valueAsNumber: true })}
          error={errors.durationMinutes?.message}
        />
        <Input
          label="Max Students"
          type="number"
          min="1"
          {...register('maxStudents', { valueAsNumber: true })}
          helperText="Leave empty for unlimited"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Price / Session ($)"
          type="number"
          step="0.01"
          min="0"
          {...register('pricePerSession', { valueAsNumber: true })}
        />
        <Input
          label="Price / Month ($)"
          type="number"
          step="0.01"
          min="0"
          {...register('priceMonthly', { valueAsNumber: true })}
        />
        <Input
          label="Price / Year ($)"
          type="number"
          step="0.01"
          min="0"
          {...register('priceYearly', { valueAsNumber: true })}
        />
      </div>

      <Input
        label="Recurrence Rule"
        {...register('recurrenceRule')}
        placeholder="e.g. FREQ=WEEKLY;BYDAY=MO;BYHOUR=10;BYMINUTE=0"
        helperText="RRULE string for recurring sessions"
      />

      <Input
        label="Color (hex)"
        {...register('color')}
        placeholder="#8B5CF6"
        helperText="Optional color for calendar display"
      />

      <DialogFooter>
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {isEdit ? 'Update Course' : 'Create Course'}
        </Button>
      </DialogFooter>
    </form>
  );
};

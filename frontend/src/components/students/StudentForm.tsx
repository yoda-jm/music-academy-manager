import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentsApi, CreateStudentData, UpdateStudentData } from '@/api/students';
import { familiesApi } from '@/api/families';
import { Student } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

const createSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  notes: z.string().optional(),
  familyId: z.string().optional(),
});

const updateSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  familyId: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

interface StudentFormProps {
  student?: Student;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ student, onSuccess, onCancel }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!student;

  const { data: familiesData } = useQuery({
    queryKey: ['families', { page: 1, limit: 200 }],
    queryFn: () => familiesApi.getFamilies({ page: 1, limit: 200 }),
  });

  const familyOptions = [
    { value: '__none__', label: 'No family' },
    ...(familiesData?.data || []).map((f) => ({ value: f.id, label: f.name })),
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema) as ReturnType<typeof zodResolver>,
    defaultValues: isEdit
      ? {
          firstName: student.user?.profile?.firstName || '',
          lastName: student.user?.profile?.lastName || '',
          phone: student.user?.profile?.phone || '',
          dateOfBirth: student.user?.profile?.dateOfBirth || '',
          notes: student.notes || '',
          familyId: student.familyId || '',
        }
      : {},
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStudentData) => studentsApi.createStudent(data),
    onSuccess: () => {
      toast.success('Student created', 'The student account has been created.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not create student.'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateStudentData) => studentsApi.updateStudent(student!.id, data),
    onSuccess: () => {
      toast.success('Student updated');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', student!.id] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not update student.'),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const watchedDOB = watch('dateOfBirth');
  const watchedFamilyId = watch('familyId');

  const onSubmit = (data: CreateFormData | UpdateFormData) => {
    const rawFamilyId = (data as { familyId?: string }).familyId;
    const payload = {
      ...data,
      familyId: rawFamilyId && rawFamilyId !== '__none__' ? rawFamilyId : undefined,
    };
    if (isEdit) {
      updateMutation.mutate(payload as UpdateStudentData);
    } else {
      createMutation.mutate(payload as CreateStudentData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          {...register('firstName')}
          error={errors.firstName?.message}
          required
        />
        <Input
          label="Last Name"
          {...register('lastName')}
          error={errors.lastName?.message}
          required
        />
      </div>

      {!isEdit && (
        <>
          <Input
            label="Email Address"
            type="email"
            {...register('email' as keyof CreateFormData)}
            error={(errors as { email?: { message?: string } }).email?.message}
            required
          />
          <Input
            label="Password"
            type="password"
            {...register('password' as keyof CreateFormData)}
            error={(errors as { password?: { message?: string } }).password?.message}
            helperText="Minimum 8 characters"
            required
          />
        </>
      )}

      <Input
        label="Phone"
        type="tel"
        {...register('phone')}
        error={errors.phone?.message}
      />

      <DatePicker
        label="Date of Birth"
        value={watchedDOB as string}
        onChange={(v) => setValue('dateOfBirth', v)}
        error={errors.dateOfBirth?.message}
      />

      <Select
        label="Family"
        options={familyOptions}
        value={watchedFamilyId as string || '__none__'}
        onValueChange={(v) => setValue('familyId' as keyof (CreateFormData | UpdateFormData), v === '__none__' ? undefined : v)}
        helperText="Assign this student to a family for sibling grouping"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Optional notes about this student..."
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        />
      </div>

      <DialogFooter>
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel} data-testid="cancel-student-btn">
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading} data-testid="submit-student-btn">
          {isEdit ? 'Update Student' : 'Create Student'}
        </Button>
      </DialogFooter>
    </form>
  );
};

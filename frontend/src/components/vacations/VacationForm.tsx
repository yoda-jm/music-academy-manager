import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vacationsApi, CreateVacationData } from '@/api/vacations';
import { Vacation, VacationType } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(VacationType),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  affectsCourses: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface VacationFormProps {
  vacation?: Vacation;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const typeOptions = Object.values(VacationType).map((t) => ({
  value: t,
  label: t.replace(/_/g, ' ').charAt(0) + t.replace(/_/g, ' ').slice(1).toLowerCase(),
}));

export const VacationForm: React.FC<VacationFormProps> = ({ vacation, onSuccess, onCancel }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!vacation;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: vacation
      ? {
          name: vacation.name,
          type: vacation.type,
          startDate: vacation.startDate.split('T')[0],
          endDate: vacation.endDate.split('T')[0],
          affectsCourses: vacation.affectsCourses,
        }
      : {
          type: VacationType.SCHOOL_HOLIDAY,
          affectsCourses: true,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVacationData) => vacationsApi.createVacation(data),
    onSuccess: () => {
      toast.success('Vacation period created');
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not create vacation period.'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateVacationData>) =>
      vacationsApi.updateVacation(vacation!.id, data),
    onSuccess: () => {
      toast.success('Vacation period updated');
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not update vacation period.'),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const watchedType = watch('type');
  const watchedStart = watch('startDate');
  const watchedEnd = watch('endDate');
  const watchedAffects = watch('affectsCourses');

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name"
        {...register('name')}
        error={errors.name?.message}
        required
        placeholder="e.g. Summer Holiday, Christmas Break"
      />

      <Select
        label="Type"
        options={typeOptions}
        value={watchedType}
        onValueChange={(v) => setValue('type', v as VacationType)}
        error={errors.type?.message}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <DatePicker
          label="Start Date"
          value={watchedStart}
          onChange={(v) => setValue('startDate', v)}
          error={errors.startDate?.message}
          required
        />
        <DatePicker
          label="End Date"
          value={watchedEnd}
          onChange={(v) => setValue('endDate', v)}
          min={watchedStart}
          error={errors.endDate?.message}
          required
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={watchedAffects}
          onClick={() => setValue('affectsCourses', !watchedAffects)}
          className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            watchedAffects ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              watchedAffects ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <label className="text-sm text-gray-700 dark:text-gray-300">
          Affects all courses (academy-wide closure)
        </label>
      </div>

      <DialogFooter>
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
};

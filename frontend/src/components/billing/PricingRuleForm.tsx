import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, CreatePricingRuleData } from '@/api/billing';
import { CourseType, PricingRule } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

const optionalPrice = z.preprocess(
  (v) => (typeof v === 'number' && isNaN(v) ? undefined : v),
  z.number().min(0).optional()
);

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  courseType: z.nativeEnum(CourseType).optional(),
  pricePerSession: optionalPrice,
  priceMonthly: optionalPrice,
  priceYearly: optionalPrice,
  isDefault: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface PricingRuleFormProps {
  rule?: PricingRule;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const COURSE_TYPE_NONE = '__none__';

const courseTypeOptions = [
  { value: COURSE_TYPE_NONE, label: 'All types' },
  ...Object.values(CourseType).map((t) => ({
    value: t,
    label: t.charAt(0) + t.slice(1).toLowerCase(),
  })),
];

export const PricingRuleForm: React.FC<PricingRuleFormProps> = ({
  rule,
  onSuccess,
  onCancel,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: rule
      ? {
          name: rule.name,
          courseType: rule.courseType,
          pricePerSession: rule.pricePerSession != null ? Number(rule.pricePerSession) : undefined,
          priceMonthly: rule.priceMonthly != null ? Number(rule.priceMonthly) : undefined,
          priceYearly: rule.priceYearly != null ? Number(rule.priceYearly) : undefined,
          isDefault: rule.isDefault,
        }
      : { isDefault: false },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePricingRuleData) => billingApi.createPricingRule(data),
    onSuccess: () => {
      toast.success('Pricing rule created');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not save pricing rule.'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreatePricingRuleData) =>
      billingApi.updatePricingRule(rule!.id, data),
    onSuccess: () => {
      toast.success('Pricing rule updated');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not update pricing rule.'),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const watchedCourseType = watch('courseType');
  const watchedIsDefault = watch('isDefault');

  const onSubmit = (data: FormData) => {
    const payload: CreatePricingRuleData = {
      name: data.name,
      courseType: data.courseType || undefined,
      pricePerSession: data.pricePerSession,
      priceMonthly: data.priceMonthly,
      priceYearly: data.priceYearly,
      isDefault: data.isDefault,
    };
    rule ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Rule Name"
        placeholder="e.g. Standard Individual Lesson"
        {...register('name')}
        error={errors.name?.message}
        required
      />

      <Select
        label="Course Type"
        options={courseTypeOptions}
        value={watchedCourseType || COURSE_TYPE_NONE}
        onValueChange={(v) => setValue('courseType', v === COURSE_TYPE_NONE ? undefined : (v as CourseType))}
        error={errors.courseType?.message}
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Per Session ($)"
          type="number"
          step="0.01"
          min="0"
          {...register('pricePerSession', { valueAsNumber: true })}
        />
        <Input
          label="Monthly ($)"
          type="number"
          step="0.01"
          min="0"
          {...register('priceMonthly', { valueAsNumber: true })}
        />
        <Input
          label="Yearly ($)"
          type="number"
          step="0.01"
          min="0"
          {...register('priceYearly', { valueAsNumber: true })}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={watchedIsDefault}
          onClick={() => setValue('isDefault', !watchedIsDefault)}
          className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            watchedIsDefault ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              watchedIsDefault ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <label className="text-sm text-gray-700 dark:text-gray-300">
          Set as default pricing rule
        </label>
      </div>

      <DialogFooter>
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </DialogFooter>
    </form>
  );
};

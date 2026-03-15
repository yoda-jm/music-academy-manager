import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { familiesApi, CreateFamilyData } from '@/api/families';
import { Family } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  name: z.string().min(1, 'Family name is required'),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostal: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface FamilyFormProps {
  family?: Family;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const FamilyForm: React.FC<FamilyFormProps> = ({ family, onSuccess, onCancel }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!family;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          name: family.name,
          billingAddress: family.billingAddress || '',
          billingCity: family.billingCity || '',
          billingPostal: family.billingPostal || '',
        }
      : {},
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFamilyData) => familiesApi.createFamily(data),
    onSuccess: () => {
      toast.success('Family created');
      queryClient.invalidateQueries({ queryKey: ['families'] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not create family.'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateFamilyData) => familiesApi.updateFamily(family!.id, data),
    onSuccess: () => {
      toast.success('Family updated');
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['families', family!.id] });
      onSuccess?.();
    },
    onError: () => toast.error('Error', 'Could not update family.'),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormData) => {
    isEdit ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Family Name"
        placeholder="e.g. Smith Family"
        {...register('name')}
        error={errors.name?.message}
        required
      />

      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billing Address</p>
        <div className="space-y-3">
          <Input
            label="Street Address"
            placeholder="e.g. 12 Rue de la Paix"
            {...register('billingAddress')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="e.g. Paris"
              {...register('billingCity')}
            />
            <Input
              label="Postal Code"
              placeholder="e.g. 75001"
              {...register('billingPostal')}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {isEdit ? 'Update Family' : 'Create Family'}
        </Button>
      </DialogFooter>
    </form>
  );
};

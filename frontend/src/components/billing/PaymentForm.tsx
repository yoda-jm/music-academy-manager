import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, RecordPaymentData } from '@/api/billing';
import { PaymentMethod } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  amount: z.number({ invalid_type_error: 'Amount is required' }).positive('Amount must be positive'),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PaymentFormProps {
  invoiceId: string;
  invoiceTotal: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const methodOptions = Object.values(PaymentMethod).map((m) => ({
  value: m,
  label: m.charAt(0) + m.slice(1).toLowerCase(),
}));

export const PaymentForm: React.FC<PaymentFormProps> = ({
  invoiceId,
  invoiceTotal,
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
    defaultValues: {
      amount: invoiceTotal,
      method: PaymentMethod.BANK_TRANSFER,
      paidAt: new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: RecordPaymentData) => billingApi.recordPayment(invoiceId, data),
    onSuccess: () => {
      toast.success('Payment recorded', 'The payment has been recorded successfully.');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'stats'] });
      onSuccess?.();
    },
    onError: () => {
      toast.error('Error', 'Could not record payment. Please try again.');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      paidAt: data.paidAt,
      notes: data.notes,
    });
  };

  const watchedMethod = watch('method');
  const watchedDate = watch('paidAt');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Amount"
        type="number"
        step="0.01"
        {...register('amount', { valueAsNumber: true })}
        error={errors.amount?.message}
        required
      />

      <Select
        label="Payment Method"
        options={methodOptions}
        value={watchedMethod}
        onValueChange={(v) => setValue('method', v as PaymentMethod)}
        error={errors.method?.message}
        required
      />

      <Input
        label="Reference / Transaction ID"
        placeholder="e.g. check #1234, transfer ref..."
        {...register('reference')}
        error={errors.reference?.message}
      />

      <DatePicker
        label="Payment Date"
        value={watchedDate}
        onChange={(v) => setValue('paidAt', v)}
        error={errors.paidAt?.message}
        required
      />

      <Input
        label="Notes"
        placeholder="Optional notes..."
        {...register('notes')}
        error={errors.notes?.message}
      />

      <DialogFooter>
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={mutation.isPending}>
          Record Payment
        </Button>
      </DialogFooter>
    </form>
  );
};

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { eventsApi, CreateEventData } from '@/api/events';
import { Event } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

// Format a Date object or ISO string for datetime-local input (local time, no TZ)
function toDatetimeLocal(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateOnly(value?: string): string {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  isAllDay: z.boolean().default(false),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface EventFormProps {
  event?: Event;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({ event, onSuccess, onCancel }) => {
  const toast = useToast();
  const isEdit = !!event;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: event
      ? {
          name: event.name,
          description: event.description,
          isAllDay: event.isAllDay,
          startDate: event.isAllDay ? toDateOnly(event.startDate) : toDatetimeLocal(event.startDate),
          endDate: event.isAllDay ? toDateOnly(event.endDate) : toDatetimeLocal(event.endDate),
          location: event.location,
          isPublic: event.isPublic,
        }
      : { isPublic: true, isAllDay: false },
  });

  const isAllDay = watch('isAllDay');

  const createMutation = useMutation({
    mutationFn: (data: CreateEventData) => eventsApi.createEvent(data),
    onSuccess: () => { toast.success('Event created'); onSuccess?.(); },
    onError: () => toast.error('Error', 'Could not create event.'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateEventData>) => eventsApi.updateEvent(event!.id, data),
    onSuccess: () => { toast.success('Event updated'); onSuccess?.(); },
    onError: () => toast.error('Error', 'Could not update event.'),
  });

  const onSubmit = (data: FormData) => {
    // For all-day events, use start of day / end of day
    const startISO = data.isAllDay
      ? new Date(data.startDate + 'T00:00:00').toISOString()
      : new Date(data.startDate).toISOString();
    const endISO = data.isAllDay
      ? new Date(data.endDate + 'T23:59:59').toISOString()
      : new Date(data.endDate).toISOString();

    const payload: CreateEventData = {
      name: data.name,
      description: data.description || undefined,
      startDate: startISO,
      endDate: endISO,
      isAllDay: data.isAllDay,
      location: data.location || undefined,
      isPublic: data.isPublic,
    };
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Event Name" {...register('name')} error={errors.name?.message} required />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Optional description..."
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        />
      </div>

      {/* All-day toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register('isAllDay')}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">All-day / multi-day event</span>
      </label>

      {/* Date fields — date-only when all-day, datetime-local otherwise */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={isAllDay ? 'Start Date' : 'Start Date & Time'}
          type={isAllDay ? 'date' : 'datetime-local'}
          data-testid="event-start-date"
          {...register('startDate')}
          error={errors.startDate?.message}
          required
        />
        <Input
          label={isAllDay ? 'End Date' : 'End Date & Time'}
          type={isAllDay ? 'date' : 'datetime-local'}
          data-testid="event-end-date"
          {...register('endDate')}
          error={errors.endDate?.message}
          required
        />
      </div>

      <Input label="Location" {...register('location')} placeholder="e.g. Auditorium, Salle polyvalente" />

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register('isPublic')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Public event (visible to all)</span>
      </label>

      <DialogFooter>
        {onCancel && <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" isLoading={isLoading} data-testid="submit-event-btn">
          {isEdit ? 'Update Event' : 'Create Event'}
        </Button>
      </DialogFooter>
    </form>
  );
};

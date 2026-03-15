import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from '@/api/teachers';
import { TeacherAvailability } from '@/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { clsx } from 'clsx';
import { Plus, Trash2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TimeSlot {
  startTime: string;
  endTime: string;
}

type WeekAvailability = Record<number, TimeSlot[]>;

function parseAvailability(slots: TeacherAvailability[]): WeekAvailability {
  const result: WeekAvailability = {};
  slots.forEach((slot) => {
    if (!result[slot.dayOfWeek]) result[slot.dayOfWeek] = [];
    result[slot.dayOfWeek].push({ startTime: slot.startTime, endTime: slot.endTime });
  });
  return result;
}

interface TeacherAvailabilityEditorProps {
  teacherId: string;
}

export const TeacherAvailabilityEditor: React.FC<TeacherAvailabilityEditorProps> = ({
  teacherId,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [weekAvail, setWeekAvail] = useState<WeekAvailability>({});

  const { data: availability } = useQuery({
    queryKey: ['teachers', teacherId, 'availability'],
    queryFn: () => teachersApi.getTeacherAvailability(teacherId),
  });

  useEffect(() => {
    if (availability) {
      setWeekAvail(parseAvailability(availability));
    }
  }, [availability]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
      Object.entries(weekAvail).forEach(([day, timeSlots]) => {
        timeSlots.forEach((slot) => {
          slots.push({
            dayOfWeek: Number(day),
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        });
      });
      return teachersApi.updateTeacherAvailability(teacherId, slots);
    },
    onSuccess: () => {
      toast.success('Availability saved');
      queryClient.invalidateQueries({ queryKey: ['teachers', teacherId, 'availability'] });
    },
    onError: () => toast.error('Error', 'Could not save availability.'),
  });

  const addSlot = (day: number) => {
    setWeekAvail((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { startTime: '09:00', endTime: '17:00' }],
    }));
  };

  const removeSlot = (day: number, index: number) => {
    setWeekAvail((prev) => {
      const slots = [...(prev[day] || [])];
      slots.splice(index, 1);
      return { ...prev, [day]: slots };
    });
  };

  const updateSlot = (day: number, index: number, field: 'startTime' | 'endTime', value: string) => {
    setWeekAvail((prev) => {
      const slots = [...(prev[day] || [])];
      slots[index] = { ...slots[index], [field]: value };
      return { ...prev, [day]: slots };
    });
  };

  const toggleDay = (day: number) => {
    setWeekAvail((prev) => {
      if (prev[day]?.length > 0) {
        const next = { ...prev };
        delete next[day];
        return next;
      }
      return { ...prev, [day]: [{ startTime: '09:00', endTime: '17:00' }] };
    });
  };

  return (
    <div className="space-y-3">
      {DAYS.map((dayName, dayNum) => {
        const slots = weekAvail[dayNum] || [];
        const isActive = slots.length > 0;

        return (
          <div
            key={dayNum}
            className={clsx(
              'rounded-lg border p-3 transition-colors',
              isActive
                ? 'border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Day toggle */}
              <button
                onClick={() => toggleDay(dayNum)}
                className={clsx(
                  'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                  isActive ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                )}
                role="switch"
                aria-checked={isActive}
              >
                <span
                  className={clsx(
                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform',
                    isActive ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>

              <span
                className={clsx(
                  'text-sm font-medium w-24',
                  isActive
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {dayName}
              </span>

              {/* Time slots */}
              <div className="flex-1 flex flex-col gap-2">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(dayNum, i, 'startTime', e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <span className="text-gray-400 text-sm">—</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(dayNum, i, 'endTime', e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => removeSlot(dayNum, i)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {isActive && (
                <button
                  onClick={() => addSlot(dayNum)}
                  className="flex-shrink-0 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add slot
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end pt-2">
        <Button
          variant="primary"
          onClick={() => updateMutation.mutate()}
          isLoading={updateMutation.isPending}
        >
          Save Availability
        </Button>
      </div>
    </div>
  );
};

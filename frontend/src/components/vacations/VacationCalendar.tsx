import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWithinInterval, parseISO } from 'date-fns';
import { vacationsApi } from '@/api/vacations';
import { Vacation } from '@/types';
import { VacationTypeBadge } from '@/components/ui/Badge';
import { clsx } from 'clsx';

interface VacationCalendarProps {
  year?: number;
  onVacationClick?: (vacation: Vacation) => void;
}

const TYPE_COLORS: Record<string, string> = {
  SCHOOL_HOLIDAY: 'bg-blue-100 border-blue-200 text-blue-700',
  SUMMER_BREAK: 'bg-orange-100 border-orange-200 text-orange-700',
  SPECIAL_CLOSURE: 'bg-red-100 border-red-200 text-red-700',
  TEACHER_TRAINING: 'bg-yellow-100 border-yellow-200 text-yellow-700',
  OTHER: 'bg-gray-100 border-gray-200 text-gray-700',
};

const DAY_VACATION_COLORS: Record<string, string> = {
  SCHOOL_HOLIDAY: 'bg-blue-100',
  SUMMER_BREAK: 'bg-orange-100',
  SPECIAL_CLOSURE: 'bg-red-100',
  TEACHER_TRAINING: 'bg-yellow-100',
  OTHER: 'bg-gray-100',
};

export const VacationCalendar: React.FC<VacationCalendarProps> = ({
  year = new Date().getFullYear(),
  onVacationClick,
}) => {
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);

  const { data: vacations } = useQuery({
    queryKey: ['vacations', year],
    queryFn: () =>
      vacationsApi.getVacations({
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      }),
  });

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  });

  function getVacationForDay(date: Date): Vacation | undefined {
    return (vacations || []).find((v) => {
      const start = parseISO(v.startDate);
      const end = parseISO(v.endDate);
      return isWithinInterval(date, { start, end });
    });
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_COLORS).map(([type, colorClass]) => (
          <div
            key={type}
            className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium', colorClass)}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {type.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      {/* Year grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((monthStart) => {
          const monthEnd = endOfMonth(monthStart);
          const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
          const firstDayOfWeek = (monthStart.getDay() + 6) % 7; // Monday = 0

          return (
            <div
              key={monthStart.toISOString()}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
                {format(monthStart, 'MMMM')}
              </p>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium py-0.5"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {/* Offset for first day */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`offset-${i}`} />
                ))}

                {days.map((day) => {
                  const vacation = getVacationForDay(day);
                  const bgColor = vacation ? DAY_VACATION_COLORS[vacation.type] : '';
                  const isToday =
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        if (vacation) {
                          setSelectedVacation(vacation);
                          onVacationClick?.(vacation);
                        }
                      }}
                      className={clsx(
                        'relative flex items-center justify-center text-xs rounded-sm',
                        'h-6 w-full transition-colors',
                        bgColor && 'cursor-pointer hover:opacity-80',
                        !bgColor && 'cursor-default',
                        bgColor,
                        isToday &&
                          'ring-1 ring-primary-500 ring-inset font-bold text-primary-700 dark:text-primary-300'
                      )}
                      title={vacation?.name}
                    >
                      <span
                        className={clsx(
                          'text-xs',
                          vacation ? 'font-medium' : 'text-gray-600 dark:text-gray-400'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vacations list */}
      {vacations && vacations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {year} Vacations ({vacations.length})
          </h3>
          <div className="space-y-2">
            {vacations.map((v) => (
              <div
                key={v.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity',
                  TYPE_COLORS[v.type]
                )}
                onClick={() => {
                  setSelectedVacation(v);
                  onVacationClick?.(v);
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{v.name}</p>
                  <p className="text-xs mt-0.5">
                    {format(parseISO(v.startDate), 'MMM d')} —{' '}
                    {format(parseISO(v.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <VacationTypeBadge type={v.type} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

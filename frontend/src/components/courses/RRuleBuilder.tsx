import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface RRuleValue {
  freq: Frequency;
  interval: number;
  byDay?: string[];
  byMonthDay?: number;
  startTime?: string;
  endTime?: string;
  until?: string;
}

interface RRuleBuilderProps {
  value?: string;
  onChange: (rrule: string) => void;
  startDate?: string;
}

const DAYS_OF_WEEK = [
  { short: 'MO', label: 'Mon' },
  { short: 'TU', label: 'Tue' },
  { short: 'WE', label: 'Wed' },
  { short: 'TH', label: 'Thu' },
  { short: 'FR', label: 'Fri' },
  { short: 'SA', label: 'Sat' },
  { short: 'SU', label: 'Sun' },
];

const freqOptions = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'MONTHLY', label: 'Monthly' },
];

function buildRRule(val: RRuleValue): string {
  let rule = `FREQ=${val.freq};INTERVAL=${val.interval}`;
  if (val.freq === 'WEEKLY' && val.byDay && val.byDay.length > 0) {
    rule += `;BYDAY=${val.byDay.join(',')}`;
  }
  if (val.freq === 'MONTHLY' && val.byMonthDay) {
    rule += `;BYMONTHDAY=${val.byMonthDay}`;
  }
  if (val.until) {
    rule += `;UNTIL=${val.until.replace(/-/g, '')}T235959Z`;
  }
  return rule;
}

function parseRRule(rrule: string): Partial<RRuleValue> {
  const params: Record<string, string> = {};
  rrule.split(';').forEach((part) => {
    const [key, value] = part.split('=');
    params[key] = value;
  });

  return {
    freq: (params['FREQ'] as Frequency) || 'WEEKLY',
    interval: parseInt(params['INTERVAL'] || '1', 10),
    byDay: params['BYDAY']?.split(','),
    byMonthDay: params['BYMONTHDAY'] ? parseInt(params['BYMONTHDAY'], 10) : undefined,
  };
}

export const RRuleBuilder: React.FC<RRuleBuilderProps> = ({ value, onChange }) => {
  const parsed = value ? parseRRule(value) : {};

  const [freq, setFreq] = useState<Frequency>(parsed.freq || 'WEEKLY');
  const [interval, setInterval] = useState(parsed.interval || 1);
  const [byDay, setByDay] = useState<string[]>(parsed.byDay || ['MO']);
  const [byMonthDay, setByMonthDay] = useState(parsed.byMonthDay || 1);
  const [until, setUntil] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const update = (updates: Partial<RRuleValue>) => {
    const newVal: RRuleValue = {
      freq,
      interval,
      byDay,
      byMonthDay,
      until,
      startTime,
      endTime,
      ...updates,
    };
    onChange(buildRRule(newVal));
  };

  const handleFreqChange = (f: Frequency) => {
    setFreq(f);
    update({ freq: f });
  };

  const handleIntervalChange = (v: number) => {
    setInterval(v);
    update({ interval: v });
  };

  const toggleDay = (day: string) => {
    const newDays = byDay.includes(day) ? byDay.filter((d) => d !== day) : [...byDay, day];
    if (newDays.length > 0) {
      setByDay(newDays);
      update({ byDay: newDays });
    }
  };

  const intervalLabel =
    freq === 'DAILY' ? 'day(s)' : freq === 'WEEKLY' ? 'week(s)' : 'month(s)';

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurrence Schedule</p>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Repeats"
          options={freqOptions}
          value={freq}
          onValueChange={(v) => handleFreqChange(v as Frequency)}
        />
        <div className="flex items-end gap-2">
          <Input
            label={`Every`}
            type="number"
            min="1"
            max="52"
            value={interval}
            onChange={(e) => handleIntervalChange(parseInt(e.target.value, 10) || 1)}
            containerClassName="flex-1"
          />
          <span className="pb-2 text-sm text-gray-500">{intervalLabel}</span>
        </div>
      </div>

      {/* Day selector for weekly */}
      {freq === 'WEEKLY' && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">On days</p>
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.short}
                type="button"
                onClick={() => toggleDay(day.short)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  byDay.includes(day.short)
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              update({ startTime: e.target.value });
            }}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              update({ endTime: e.target.value });
            }}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Until date */}
      <DatePicker
        label="Repeat until (optional)"
        value={until}
        onChange={(v) => {
          setUntil(v);
          update({ until: v });
        }}
        helperText="Leave empty for no end date"
      />

      {/* Preview */}
      {value && (
        <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono break-all">{value}</p>
        </div>
      )}
    </div>
  );
};

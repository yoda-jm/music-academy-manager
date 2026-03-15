import React from 'react';
import { clsx } from 'clsx';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  includeTime?: boolean;
  placeholder?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      min,
      max,
      error,
      helperText,
      disabled,
      required,
      className,
      includeTime = false,
      placeholder,
    },
    ref
  ) => {
    const id = label ? label.toLowerCase().replace(/\s+/g, '-') : undefined;

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Calendar className="h-4 w-4" />
          </div>
          <input
            ref={ref}
            id={id}
            type={includeTime ? 'datetime-local' : 'date'}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            min={min}
            max={max}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            className={clsx(
              'block w-full rounded-lg border pl-10 pr-3 py-2 text-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'dark:bg-gray-800 dark:text-gray-100',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600',
              disabled && 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
            )}
          />
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

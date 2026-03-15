import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Select an option...',
  options,
  value,
  onValueChange,
  error,
  helperText,
  disabled = false,
  required = false,
  containerClassName,
}) => {
  const inputId = label ? label.toLowerCase().replace(/\s+/g, '-') : undefined;

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          id={inputId}
          className={clsx(
            'inline-flex items-center justify-between w-full rounded-lg border px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
            'dark:bg-gray-800 dark:text-gray-100',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600',
            disabled && 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={clsx(
              'z-50 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200',
              'bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700',
              'animate-fade-in'
            )}
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.ScrollUpButton className="flex items-center justify-center py-1 text-gray-500">
              <ChevronDown className="h-3 w-3 rotate-180" />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={clsx(
                    'relative flex items-center px-3 py-2 text-sm rounded-md cursor-pointer',
                    'select-none outline-none transition-colors',
                    'data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-900',
                    'dark:data-[highlighted]:bg-gray-700 dark:data-[highlighted]:text-white',
                    'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
                    'text-gray-700 dark:text-gray-200'
                  )}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="absolute right-2">
                    <Check className="h-4 w-4 text-primary-600" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex items-center justify-center py-1 text-gray-500">
              <ChevronDown className="h-3 w-3" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

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
};

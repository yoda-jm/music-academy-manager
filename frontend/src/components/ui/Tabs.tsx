import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { clsx } from 'clsx';

export interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) => {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue || tabs[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <RadixTabs.List className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap',
              'border-b-2 border-transparent -mb-px transition-colors',
              'focus:outline-none',
              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-600',
              'data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300',
              'dark:data-[state=active]:border-primary-400 dark:data-[state=active]:text-primary-400',
              'dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium dark:bg-primary-900/30 dark:text-primary-400">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
};

export const TabContent = RadixTabs.Content;

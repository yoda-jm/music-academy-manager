import React from 'react';
import { Inbox } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'There are no items to display at this time.',
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        {icon || <Inbox className="h-8 w-8 text-gray-400" />}
      </div>

      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>

      {action && (
        <div className="mt-6">
          <Button variant="primary" leftIcon={action.icon} onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

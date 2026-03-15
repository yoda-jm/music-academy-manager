import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg';
}

const widthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

const sideStyles = {
  right: {
    position: 'fixed inset-y-0 right-0',
    open: 'translate-x-0',
    closed: 'translate-x-full',
  },
  left: {
    position: 'fixed inset-y-0 left-0',
    open: 'translate-x-0',
    closed: '-translate-x-full',
  },
};

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'right',
  width = 'md',
}) => {
  const positionClass = sideStyles[side].position;

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={clsx(
            'fixed inset-0 z-50 bg-black/40',
            'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out'
          )}
        />
        <RadixDialog.Content
          className={clsx(
            positionClass,
            'z-50 h-full w-full bg-white dark:bg-gray-900 shadow-2xl',
            'flex flex-col overflow-hidden focus:outline-none',
            widthStyles[width],
            open ? 'animate-slide-in-right' : 'animate-slide-out-right'
          )}
        >
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              {title && (
                <RadixDialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </RadixDialog.Title>
              )}
              {description && (
                <RadixDialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <button
                className="ml-4 flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </RadixDialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};

import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-4xl',
};

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={clsx(
            'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out'
          )}
        />
        <RadixDialog.Content
          className={clsx(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full bg-white dark:bg-gray-900 rounded-xl shadow-xl',
            'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
            'focus:outline-none',
            sizeStyles[size],
            'mx-4'
          )}
        >
          {(title || showCloseButton) && (
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
              {showCloseButton && (
                <RadixDialog.Close asChild>
                  <button
                    className="ml-4 flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close dialog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </RadixDialog.Close>
              )}
            </div>
          )}

          <div className="p-6">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};

// Dialog sub-components for flexible composition
export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={clsx(
      'flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4',
      className
    )}
  >
    {children}
  </div>
);

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogFooter } from './Dialog';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: 'destructive' | 'warning';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  variant = 'destructive',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={
            variant === 'destructive'
              ? 'flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4'
              : 'flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4'
          }
        >
          <AlertTriangle
            className={
              variant === 'destructive'
                ? 'h-7 w-7 text-red-600 dark:text-red-400'
                : 'h-7 w-7 text-yellow-600 dark:text-yellow-400'
            }
          />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>

      <DialogFooter className="mt-6 justify-center">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'primary'}
          onClick={() => {
            onConfirm();
          }}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

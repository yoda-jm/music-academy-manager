import React, { createContext, useContext, useState, useCallback } from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; className: string }
> = {
  success: {
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    className: 'border-l-4 border-green-500',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    className: 'border-l-4 border-red-500',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    className: 'border-l-4 border-yellow-500',
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-500" />,
    className: 'border-l-4 border-blue-500',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<ToastItem, 'id'>) => addToast(opts), [addToast]);
  const success = useCallback((title: string, description?: string) => addToast({ title, description, variant: 'success' }), [addToast]);
  const error = useCallback((title: string, description?: string) => addToast({ title, description, variant: 'error' }), [addToast]);
  const warning = useCallback((title: string, description?: string) => addToast({ title, description, variant: 'warning' }), [addToast]);
  const info = useCallback((title: string, description?: string) => addToast({ title, description, variant: 'info' }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => {
          const config = variantConfig[t.variant];
          return (
            <RadixToast.Root
              key={t.id}
              open={true}
              onOpenChange={(open) => {
                if (!open) removeToast(t.id);
              }}
              duration={t.duration || 4000}
              className={clsx(
                'group flex items-start gap-3 p-4 rounded-lg shadow-lg',
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
                'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
                'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
                'min-w-[320px] max-w-sm',
                config.className
              )}
            >
              <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
              <div className="flex-1 min-w-0">
                <RadixToast.Title className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t.title}
                </RadixToast.Title>
                {t.description && (
                  <RadixToast.Description className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                    {t.description}
                  </RadixToast.Description>
                )}
              </div>
              <RadixToast.Close asChild>
                <button
                  className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </RadixToast.Close>
            </RadixToast.Root>
          );
        })}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none [&>*]:pointer-events-auto" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

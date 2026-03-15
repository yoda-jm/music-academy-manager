import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText, Calendar, User, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { Invoice } from '@/types';
import { InvoiceStatusBadge } from '@/components/ui/Badge';

interface InvoiceCardProps {
  invoice: Invoice;
  className?: string;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, className }) => {
  const navigate = useNavigate();
  const isOverdue =
    invoice.status === 'OVERDUE' ||
    (invoice.status === 'SENT' && new Date(invoice.dueDate) < new Date());

  return (
    <div
      onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
      className={clsx(
        'bg-white dark:bg-gray-900 rounded-xl border cursor-pointer transition-all hover:shadow-md',
        isOverdue
          ? 'border-red-200 dark:border-red-900/40'
          : 'border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                #{invoice.number}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {invoice.family?.name || 'Unknown family'}
              </p>
            </div>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              ${Number(invoice.total).toFixed(2)}
            </span>
            {invoice.payments && invoice.payments.length > 0 && (
              <span className="text-gray-500 text-xs">
                (${invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)} paid)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              Period:{' '}
              <span className="text-gray-800 dark:text-gray-200">
                {format(new Date(invoice.periodStart), 'MMM d')} – {format(new Date(invoice.periodEnd), 'MMM d, yyyy')}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className={clsx('h-4 w-4 flex-shrink-0', isOverdue ? 'text-red-500' : 'text-gray-400')} />
            <span className={clsx(isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400')}>
              Due:{' '}
              <span>
                {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
              </span>
            </span>
          </div>

          {invoice.student?.user?.profile && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {invoice.student.user.profile.firstName}{' '}
                {invoice.student.user.profile.lastName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { Music2 } from 'lucide-react';
import { Invoice } from '@/types';

interface InvoicePrintViewProps {
  invoice: Invoice;
}

export const InvoicePrintView = forwardRef<HTMLDivElement, InvoicePrintViewProps>(
  ({ invoice }, ref) => {
    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Number(invoice.total) - totalPaid;

    const statusLabel: Record<string, string> = {
      DRAFT: 'DRAFT',
      SENT: 'DUE',
      PAID: 'PAID',
      OVERDUE: 'OVERDUE',
      CANCELLED: 'VOID',
      PARTIAL: 'PARTIALLY PAID',
    };

    return (
      <div ref={ref} className="bg-white text-gray-900 p-12 max-w-2xl mx-auto print:max-w-full print:p-8 font-sans">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
              <Music2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Music Academy</h1>
              <p className="text-sm text-gray-500">Music Education Center</p>
            </div>
          </div>

          <div className="text-right">
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold border-2 ${
              invoice.status === 'PAID'
                ? 'text-green-700 border-green-500'
                : invoice.status === 'OVERDUE'
                ? 'text-red-700 border-red-500'
                : 'text-gray-700 border-gray-400'
            }`}>
              {statusLabel[invoice.status] || invoice.status}
            </div>
          </div>
        </div>

        {/* Invoice info */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h2>
            <p className="text-gray-600">#{invoice.number}</p>
          </div>
          <div className="text-right space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Period:</span>
              <span className="font-medium">{format(new Date(invoice.periodStart), 'MMM d')} – {format(new Date(invoice.periodEnd), 'MMMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Due Date:</span>
              <span className="font-medium">{format(new Date(invoice.dueDate), 'MMMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Bill to */}
        <div className="mb-8 p-5 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
          <p className="font-semibold text-gray-900 text-base">{invoice.family?.name}</p>
          {invoice.family?.address && <p className="text-sm text-gray-600">{invoice.family.address}</p>}
          {invoice.family?.city && (
            <p className="text-sm text-gray-600">
              {invoice.family.city}{invoice.family.postalCode ? `, ${invoice.family.postalCode}` : ''}
            </p>
          )}
          {invoice.family?.email && <p className="text-sm text-gray-600">{invoice.family.email}</p>}
          {invoice.family?.phone && <p className="text-sm text-gray-600">{invoice.family.phone}</p>}
          {invoice.student?.user?.profile && (
            <p className="text-sm text-gray-500 mt-1">
              For: {invoice.student.user.profile.firstName} {invoice.student.user.profile.lastName}
            </p>
          )}
        </div>

        {/* Items table */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="pb-3 text-left font-semibold text-gray-700">Description</th>
                <th className="pb-3 text-center font-semibold text-gray-700 w-16">Qty</th>
                <th className="pb-3 text-right font-semibold text-gray-700 w-24">Unit Price</th>
                <th className="pb-3 text-right font-semibold text-gray-700 w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
                <tr key={item.id || i} className="border-b border-gray-100">
                  <td className="py-3 text-gray-800">{item.description}</td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">${Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-3 text-right font-medium text-gray-800">${Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium">-${Number(invoice.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-gray-900 text-base font-bold">
              <span>Total</span>
              <span>${Number(invoice.total).toFixed(2)}</span>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-green-700">
                  <span>Amount Paid</span>
                  <span>-${totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-300 font-semibold">
                  <span>Balance Due</span>
                  <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                    ${balance.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment history */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment History</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left text-gray-500">Date</th>
                  <th className="pb-2 text-left text-gray-500">Method</th>
                  <th className="pb-2 text-left text-gray-500">Reference</th>
                  <th className="pb-2 text-right text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-600">{format(new Date(p.paidAt), 'MMM d, yyyy')}</td>
                    <td className="py-2 text-gray-600 capitalize">{p.method.toLowerCase()}</td>
                    <td className="py-2 text-gray-500">{p.reference || '—'}</td>
                    <td className="py-2 text-right font-medium text-green-700">${Number(p.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">Notes</p>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Thank you for choosing Music Academy!</p>
          <p className="mt-1">Questions? Contact us at info@musicacademy.com</p>
        </div>
      </div>
    );
  }
);

InvoicePrintView.displayName = 'InvoicePrintView';

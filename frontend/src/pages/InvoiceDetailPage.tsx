import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Printer, Send, CreditCard, Trash2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { billingApi } from '@/api/billing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InvoiceStatusBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InvoicePrintView } from '@/components/billing/InvoicePrintView';
import { PaymentForm } from '@/components/billing/PaymentForm';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => billingApi.getInvoice(id!),
    enabled: !!id,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoice?.number || ''}`,
  });

  const sendMutation = useMutation({
    mutationFn: () => billingApi.sendInvoice(id!),
    onSuccess: () => {
      toast.success('Invoice sent', 'The invoice has been sent to the family.');
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
    },
    onError: () => toast.error('Error', 'Could not send invoice.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => billingApi.deleteInvoice(id!),
    onSuccess: () => {
      toast.success('Invoice deleted');
      navigate('/billing/invoices');
    },
    onError: () => toast.error('Error', 'Could not delete invoice.'),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="xl" /></div>;

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Invoice not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/billing/invoices')}>Back</Button>
      </div>
    );
  }

  const totalPaid = (invoice.payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(invoice.total) - totalPaid;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/billing/invoices')}>
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1">
          Invoice #{invoice.number}
        </h1>
        <InvoiceStatusBadge status={invoice.status} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={() => handlePrint()}>
            Print
          </Button>
          {invoice.status === 'DRAFT' && (
            <Button variant="outline" size="sm" leftIcon={<Send className="h-4 w-4" />} isLoading={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
              Send
            </Button>
          )}
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <Button variant="primary" size="sm" leftIcon={<CreditCard className="h-4 w-4" />} onClick={() => setShowPaymentForm(true)}>
              Record Payment
            </Button>
          )}
          <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setShowDeleteConfirm(true)} className="text-red-600 hover:bg-red-50 dark:text-red-400">
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main invoice */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="hidden">
              <InvoicePrintView ref={printRef} invoice={invoice} />
            </div>
            <InvoicePrintView ref={undefined} invoice={invoice} />
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-5">
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${Number(invoice.subtotal).toFixed(2)}</span>
                </div>
                {Number(invoice.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span>-${Number(invoice.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span>Total</span>
                  <span>${Number(invoice.total).toFixed(2)}</span>
                </div>
                {totalPaid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Paid</span>
                      <span>-${totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span>Balance</span>
                      <span className={balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                        ${balance.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>

          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <Card.Header>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Payments</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          ${Number(p.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(p.paidAt), 'MMM d, yyyy')} · {p.method}
                          {p.reference && ` · #${p.reference}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm} title="Record Payment" size="md">
        <PaymentForm
          invoiceId={invoice.id}
          invoiceTotal={balance}
          onSuccess={() => setShowPaymentForm(false)}
          onCancel={() => setShowPaymentForm(false)}
        />
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Invoice"
        description="This will permanently delete the invoice and all payment records. This cannot be undone."
        confirmLabel="Delete Invoice"
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

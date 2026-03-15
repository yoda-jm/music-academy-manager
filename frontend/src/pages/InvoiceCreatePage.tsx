import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { billingApi, CreateInvoiceData } from '@/api/billing';
import { familiesApi } from '@/api/families';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/Toast';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

const today = new Date();
const defaultPeriodStart = format(startOfMonth(today), 'yyyy-MM-dd');
const defaultPeriodEnd = format(endOfMonth(today), 'yyyy-MM-dd');
const defaultDueDate = format(addDays(endOfMonth(today), 15), 'yyyy-MM-dd');

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [familyId, setFamilyId] = useState('');
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const { data: familiesData } = useQuery({
    queryKey: ['families', { page: 1, limit: 200 }],
    queryFn: () => familiesApi.getFamilies({ page: 1, limit: 200 }),
  });

  const familyOptions = [
    { value: '__none__', label: 'Select a family...' },
    ...(familiesData?.data || []).map((f) => ({ value: f.id, label: f.name })),
  ];

  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceData) => billingApi.createInvoice(data),
    onSuccess: (invoice) => {
      toast.success('Invoice created');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/billing/invoices/${invoice.id}`);
    },
    onError: () => toast.error('Error', 'Could not create invoice.'),
  });

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!familyId || familyId === '__none__') {
      toast.error('Validation', 'Please select a family.');
      return;
    }
    if (!periodStart || !periodEnd || !dueDate) {
      toast.error('Validation', 'Please fill in all dates.');
      return;
    }
    const validItems = items.filter((i) => i.description.trim());
    if (!validItems.length) {
      toast.error('Validation', 'Add at least one line item with a description.');
      return;
    }

    createMutation.mutate({
      familyId,
      periodStart,
      periodEnd,
      dueDate,
      discount: discount || undefined,
      notes: notes || undefined,
      items: validItems.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/billing/invoices')}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1">
          Create Invoice
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Family & dates */}
            <Card>
              <Card.Header>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Invoice Details</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                <Select
                  label="Family"
                  options={familyOptions}
                  value={familyId || '__none__'}
                  onValueChange={(v) => setFamilyId(v === '__none__' ? '' : v)}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    label="Period Start"
                    value={periodStart}
                    onChange={(v) => setPeriodStart(v || defaultPeriodStart)}
                    required
                  />
                  <DatePicker
                    label="Period End"
                    value={periodEnd}
                    onChange={(v) => setPeriodEnd(v || defaultPeriodEnd)}
                    required
                  />
                </div>

                <DatePicker
                  label="Due Date"
                  value={dueDate}
                  onChange={(v) => setDueDate(v || defaultDueDate)}
                  required
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Optional notes..."
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </Card.Body>
            </Card>

            {/* Line items */}
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Line Items</h2>
                  <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addItem}>
                    Add Item
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                    <span className="col-span-6">Description</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-3 text-right">Unit Price</span>
                    <span className="col-span-1" />
                  </div>

                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(i, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', Number(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar summary */}
          <div className="space-y-5">
            <Card>
              <Card.Header>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 flex-shrink-0">Discount ($)</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="text-right"
                    />
                  </div>
                  <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-700 pt-2 text-base">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={createMutation.isPending}
            >
              Create Invoice
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

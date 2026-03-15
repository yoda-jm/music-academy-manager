import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { billingApi } from '@/api/billing';
import { PricingRule } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge, CourseTypeBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PricingRuleForm } from '@/components/billing/PricingRuleForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

export default function PricingPage() {
  const [formRule, setFormRule] = useState<PricingRule | null | 'new'>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: () => billingApi.getPricingRules(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => billingApi.deletePricingRule(id),
    onSuccess: () => {
      toast.success('Pricing rule deleted');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      setDeletingId(null);
    },
    onError: () => toast.error('Error', 'Could not delete rule.'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pricing Rules</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure pricing for courses and enrollment types</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormRule('new')}>
          Add Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="xl" /></div>
      ) : !rules?.length ? (
        <EmptyState
          icon={<Tag className="h-8 w-8 text-gray-400" />}
          title="No pricing rules"
          description="Create pricing rules to standardize course fees."
          action={{ label: 'Add Rule', onClick: () => setFormRule('new'), icon: <Plus className="h-4 w-4" /> }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Course Type</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Per Session</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Monthly</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Yearly</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Default</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{rule.name}</p>
                    {rule.instrument && <p className="text-xs text-gray-500 mt-0.5">{rule.instrument.name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {rule.courseType ? <CourseTypeBadge type={rule.courseType} /> : <span className="text-gray-400">All types</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {rule.pricePerSession != null ? `$${Number(rule.pricePerSession).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {rule.priceMonthly != null ? `$${Number(rule.priceMonthly).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {rule.priceYearly != null ? `$${Number(rule.priceYearly).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={rule.isDefault ? 'success' : 'gray'} dot>
                      {rule.isDefault ? 'Default' : 'Custom'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setFormRule(rule)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeletingId(rule.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!formRule} onOpenChange={(open) => !open && setFormRule(null)} title={formRule === 'new' ? 'Add Pricing Rule' : 'Edit Pricing Rule'} size="md">
        <PricingRuleForm
          rule={formRule !== 'new' ? (formRule as PricingRule) : undefined}
          onSuccess={() => setFormRule(null)}
          onCancel={() => setFormRule(null)}
        />
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Pricing Rule"
        description="Are you sure you want to delete this pricing rule?"
        confirmLabel="Delete"
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

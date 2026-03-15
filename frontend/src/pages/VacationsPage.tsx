import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { vacationsApi } from '@/api/vacations';
import { Vacation } from '@/types';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { VacationCalendar } from '@/components/vacations/VacationCalendar';
import { VacationForm } from '@/components/vacations/VacationForm';
import { VacationTypeBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { format, parseISO } from 'date-fns';

export default function VacationsPage() {
  const [formVacation, setFormVacation] = useState<Vacation | null | 'new'>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const toast = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vacationsApi.deleteVacation(id),
    onSuccess: () => {
      toast.success('Vacation period deleted');
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      setDeletingId(null);
    },
    onError: () => toast.error('Error', 'Could not delete vacation.'),
  });

  const { data: vacations } = useQuery({
    queryKey: ['vacations', calendarYear],
    queryFn: () => vacationsApi.getVacations({
      startDate: `${calendarYear}-01-01`,
      endDate: `${calendarYear}-12-31`,
    }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vacations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage academy holidays and closures
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarYear((y) => y - 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors"
            >
              ←
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-12 text-center">{calendarYear}</span>
            <button
              onClick={() => setCalendarYear((y) => y + 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors"
            >
              →
            </button>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setFormVacation('new')}
          >
            Add Vacation
          </Button>
        </div>
      </div>

      <VacationCalendar
        year={calendarYear}
        onVacationClick={(v) => setFormVacation(v)}
      />

      {/* Vacation list */}
      {vacations && vacations.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {calendarYear} Vacation Periods
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Period</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Scope</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {vacations.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{v.name}</td>
                  <td className="px-4 py-3"><VacationTypeBadge type={v.type} /></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {format(parseISO(v.startDate), 'MMM d')} — {format(parseISO(v.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    {v.affectsCourses ? (
                      <span className="text-xs text-gray-500">All courses</span>
                    ) : (
                      <span className="text-xs text-blue-600">Specific</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setFormVacation(v)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeletingId(v.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors">
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

      <Dialog
        open={!!formVacation}
        onOpenChange={(open) => !open && setFormVacation(null)}
        title={formVacation === 'new' ? 'Add Vacation Period' : 'Edit Vacation Period'}
        size="md"
      >
        <VacationForm
          vacation={formVacation !== 'new' ? (formVacation as Vacation) : undefined}
          onSuccess={() => setFormVacation(null)}
          onCancel={() => setFormVacation(null)}
        />
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Vacation Period"
        description="Are you sure you want to delete this vacation period?"
        confirmLabel="Delete"
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

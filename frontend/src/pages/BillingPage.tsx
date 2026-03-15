import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, FileText, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { billingApi } from '@/api/billing';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InvoiceCard } from '@/components/billing/InvoiceCard';
import { Spinner } from '@/components/ui/Spinner';

export default function BillingPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['billing', 'stats'],
    queryFn: billingApi.getBillingStats,
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', { page: 1, limit: 6 }],
    queryFn: () => billingApi.getInvoices({ page: 1, limit: 6 }),
  });

  const { data: overdueInvoices } = useQuery({
    queryKey: ['invoices', 'overdue'],
    queryFn: billingApi.getOverdueInvoices,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Billing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of academy finances</p>
        </div>
        <Link to="/billing/invoices">
          <Button variant="primary" leftIcon={<FileText className="h-4 w-4" />}>
            Manage Invoices
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Revenue"
          value={statsLoading ? '—' : `$${Number(stats?.totalRevenue ?? 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          iconColor="text-green-600"
          iconBg="bg-green-50 dark:bg-green-900/20"
          isLoading={statsLoading}
        />
        <StatCard
          title="Collected This Month"
          value={statsLoading ? '—' : `$${Number(stats?.totalPaid ?? 0).toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6" />}
          iconColor="text-primary-600"
          iconBg="bg-primary-50 dark:bg-primary-900/20"
          isLoading={statsLoading}
        />
        <StatCard
          title="Outstanding"
          value={statsLoading ? '—' : `$${Number(stats?.totalOutstanding ?? 0).toLocaleString()}`}
          icon={<FileText className="h-6 w-6" />}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50 dark:bg-yellow-900/20"
          isLoading={statsLoading}
        />
        <StatCard
          title="Overdue Invoices"
          value={statsLoading ? '—' : stats?.byStatus?.OVERDUE ?? 0}
          icon={<AlertCircle className="h-6 w-6" />}
          iconColor="text-red-600"
          iconBg="bg-red-50 dark:bg-red-900/20"
          isLoading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent invoices */}
        <Card>
          <Card.Header
            action={
              <Link to="/billing/invoices">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  View all
                </Button>
              </Link>
            }
          >
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Recent Invoices
            </h2>
          </Card.Header>
          <Card.Body>
            {invoicesLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !recentInvoices?.data.length ? (
              <p className="text-sm text-gray-500 text-center py-8">No invoices found.</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.data.map((inv) => (
                  <InvoiceCard key={inv.id} invoice={inv} />
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Overdue */}
        <Card>
          <Card.Header
            action={
              <Link to="/billing/invoices?status=OVERDUE">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  View all
                </Button>
              </Link>
            }
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Overdue Invoices
              </h2>
            </div>
          </Card.Header>
          <Card.Body>
            {!overdueInvoices?.length ? (
              <p className="text-sm text-green-600 dark:text-green-400 text-center py-8 font-medium">
                All payments are up to date!
              </p>
            ) : (
              <div className="space-y-3">
                {overdueInvoices.slice(0, 5).map((inv) => (
                  <InvoiceCard key={inv.id} invoice={inv} />
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

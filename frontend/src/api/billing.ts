import apiClient from './client';
import {
  Invoice,
  Payment,
  PricingRule,
  PaginatedResponse,
  PaginationParams,
  InvoiceStatus,
  PaymentMethod,
  CourseType,
  PaymentType,
  BillingStats,
} from '@/types';

export interface CreateInvoiceData {
  familyId?: string;
  studentId?: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  discount?: number;
  notes?: string;
  items: {
    studentId?: string;
    description: string;
    quantity?: number;
    unitPrice: number;
    courseId?: string;
  }[];
}

export interface UpdateInvoiceData {
  dueDate?: string;
  status?: InvoiceStatus;
  discount?: number;
  notes?: string;
}

export interface RecordPaymentData {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt?: string;
  notes?: string;
}

export interface CreatePricingRuleData {
  name: string;
  courseType?: CourseType;
  instrumentId?: string;
  pricePerSession?: number;
  priceMonthly?: number;
  priceYearly?: number;
  isDefault?: boolean;
}

export const billingApi = {
  getPricingRules: async (): Promise<PricingRule[]> => {
    const response = await apiClient.get<{ data: PricingRule[] } | PricingRule[]>('/billing/pricing-rules');
    const result = response.data as unknown;
    if (result && typeof result === 'object' && 'data' in result) {
      return (result as { data: PricingRule[] }).data;
    }
    return result as PricingRule[];
  },

  createPricingRule: async (data: CreatePricingRuleData): Promise<PricingRule> => {
    const response = await apiClient.post<PricingRule>('/billing/pricing-rules', data);
    return response.data;
  },

  updatePricingRule: async (
    id: string,
    data: Partial<CreatePricingRuleData> & { isActive?: boolean }
  ): Promise<PricingRule> => {
    const response = await apiClient.patch<PricingRule>(`/billing/pricing-rules/${id}`, data);
    return response.data;
  },

  deletePricingRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/billing/pricing-rules/${id}`);
  },

  getInvoices: async (
    params?: PaginationParams & {
      status?: InvoiceStatus;
      familyId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<PaginatedResponse<Invoice>> => {
    const response = await apiClient.get<PaginatedResponse<Invoice>>('/billing/invoices', { params });
    return response.data;
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/billing/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>('/billing/invoices', data);
    return response.data;
  },

  updateInvoice: async (id: string, data: UpdateInvoiceData): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(`/billing/invoices/${id}`, data);
    return response.data;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/billing/invoices/${id}`);
  },

  sendInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(`/billing/invoices/${id}/send`);
    return response.data;
  },

  recordPayment: async (invoiceId: string, data: RecordPaymentData): Promise<Payment> => {
    const response = await apiClient.post<Payment>(
      `/billing/invoices/${invoiceId}/payments`,
      data
    );
    return response.data;
  },

  generateInvoices: async (params: {
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    familyId?: string;
  }): Promise<Invoice[]> => {
    const response = await apiClient.post<Invoice[]>('/billing/invoices/generate', params);
    return response.data;
  },

  getOverdueInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<Invoice[]>('/billing/invoices/overdue');
    return response.data;
  },

  getBillingStats: async (): Promise<BillingStats> => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const response = await apiClient.get<BillingStats>('/billing/stats', { params: { start, end } });
    return response.data;
  },
};

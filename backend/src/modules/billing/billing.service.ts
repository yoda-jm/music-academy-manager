import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import {
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  RecordPaymentDto,
  GenerateInvoicesDto,
} from './dto/billing.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ---- Pricing Rules ----

  async getPricingRules(pagination: PaginationDto) {
    const { skip, take } = getPaginationParams(pagination);
    const [rules, total] = await Promise.all([
      this.prisma.pricingRule.findMany({
        skip,
        take,
        include: { instrument: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pricingRule.count(),
    ]);
    return paginatedResponse(rules, total, pagination.page || 1, take);
  }

  async createPricingRule(dto: CreatePricingRuleDto) {
    return this.prisma.pricingRule.create({
      data: {
        name: dto.name,
        courseType: dto.courseType,
        instrumentId: dto.instrumentId,
        pricePerSession: dto.pricePerSession,
        priceMonthly: dto.priceMonthly,
        priceYearly: dto.priceYearly,
        isDefault: dto.isDefault ?? false,
      },
      include: { instrument: true },
    });
  }

  async updatePricingRule(id: string, dto: UpdatePricingRuleDto) {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException(`Pricing rule ${id} not found`);

    return this.prisma.pricingRule.update({
      where: { id },
      data: dto,
    });
  }

  async deletePricingRule(id: string) {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException(`Pricing rule ${id} not found`);

    return this.prisma.pricingRule.delete({ where: { id } });
  }

  // ---- Invoices ----

  async getInvoices(pagination: PaginationDto, filters?: { status?: string; familyId?: string }) {
    const { skip, take } = getPaginationParams(pagination);

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.familyId) where.familyId = filters.familyId;

    if (pagination.search) {
      where.OR = [
        { number: { contains: pagination.search, mode: 'insensitive' } },
        { family: { name: { contains: pagination.search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take,
        include: {
          family: true,
          _count: { select: { items: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return paginatedResponse(invoices, total, pagination.page || 1, take);
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        family: true,
        items: { include: { student: { include: { user: { include: { profile: true } } } } } },
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return invoice;
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const subtotal = dto.items.reduce(
      (sum, item) => sum + (item.unitPrice * (item.quantity || 1)),
      0,
    );
    const discount = dto.discount || 0;
    const total = subtotal - discount;

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        number: invoiceNumber,
        familyId: dto.familyId,
        studentId: dto.studentId,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        dueDate: dto.dueDate,
        status: 'DRAFT',
        subtotal,
        discount,
        total,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            studentId: item.studentId,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            total: item.unitPrice * (item.quantity || 1),
            courseId: item.courseId,
          })),
        },
      },
      include: {
        family: true,
        items: { include: { student: { include: { user: { include: { profile: true } } } } } },
        payments: true,
      },
    });

    this.logger.log(`Invoice created: ${invoice.number}`);
    return invoice;
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.getInvoice(id);

    if (['PAID', 'CANCELLED'].includes(invoice.status) && dto.status !== 'CANCELLED') {
      throw new BadRequestException(`Cannot modify a ${invoice.status} invoice`);
    }

    let updateData: any = { ...dto };

    // Recalculate total if discount changed
    if (dto.discount !== undefined) {
      const newTotal = Number(invoice.subtotal) - dto.discount;
      updateData.total = newTotal;
    }

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        family: true,
        items: true,
        payments: true,
      },
    });
  }

  async deleteInvoice(id: string) {
    const invoice = await this.getInvoice(id);

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async sendInvoice(id: string) {
    const invoice = await this.getInvoice(id);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot send a cancelled invoice');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'SENT' },
      include: { family: true },
    });

    this.eventEmitter.emit('invoice.sent', updated);
    this.logger.log(`Invoice ${invoice.number} sent`);
    return updated;
  }

  async recordPayment(invoiceId: string, dto: RecordPaymentDto) {
    const invoice = await this.getInvoice(invoiceId);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot record payment for cancelled invoice');
    }

    const totalPaid = invoice.payments.reduce(
      (sum: number, p: any) => sum + Number(p.amount),
      0,
    );
    const newTotalPaid = totalPaid + dto.amount;
    const invoiceTotal = Number(invoice.total);

    if (newTotalPaid > invoiceTotal) {
      throw new BadRequestException(
        `Payment amount exceeds outstanding balance. Max: ${invoiceTotal - totalPaid}`,
      );
    }

    const newStatus = newTotalPaid >= invoiceTotal ? 'PAID' : 'PARTIAL';

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          invoiceId,
          amount: dto.amount,
          method: dto.method,
          reference: dto.reference,
          paidAt: dto.paidAt || new Date(),
          notes: dto.notes,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      }),
    ]);

    this.eventEmitter.emit('payment.recorded', { invoiceId, payment, newStatus });
    this.logger.log(`Payment of ${dto.amount} recorded for invoice ${invoice.number}`);
    return payment;
  }

  async getInvoicePayments(invoiceId: string) {
    await this.getInvoice(invoiceId);

    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    });
  }

  async generateInvoices(dto: GenerateInvoicesDto) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        status: 'ACTIVE',
        ...(dto.familyId
          ? { student: { familyId: dto.familyId } }
          : {}),
      },
      include: {
        student: {
          include: {
            user: { include: { profile: true } },
            family: true,
          },
        },
        course: {
          include: { instrument: true },
        },
      },
    });

    // Group enrollments by family (or student if no family)
    const groups = new Map<string, typeof enrollments>();

    for (const enrollment of enrollments) {
      const key = enrollment.student.familyId || `student:${enrollment.studentId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(enrollment);
    }

    const invoices: any[] = [];

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const [key, groupEnrollments] of groups.entries()) {
        const items: any[] = [];

        for (const enrollment of groupEnrollments) {
          // Count completed sessions in period
          const sessionCount = await tx.courseSession.count({
            where: {
              courseId: enrollment.courseId,
              startTime: { gte: new Date(dto.periodStart), lte: new Date(dto.periodEnd) },
              status: 'COMPLETED',
            },
          });

          if (sessionCount === 0 && enrollment.paymentType === 'PER_SESSION') {
            continue;
          }

          // Determine price based on payment type and pricing rules
          let unitPrice = 0;
          let quantity = 1;
          let description = '';

          const course = enrollment.course;

          if (enrollment.paymentType === 'PER_SESSION') {
            unitPrice = course.pricePerSession ? Number(course.pricePerSession) : 0;
            quantity = sessionCount;
            description = `${course.name} - ${sessionCount} sessions`;

            if (unitPrice === 0) {
              // Try pricing rules
              const rule = await tx.pricingRule.findFirst({
                where: {
                  OR: [
                    { courseType: course.type, isDefault: true },
                    { instrumentId: course.instrumentId || '', isDefault: true },
                  ],
                },
              });
              if (rule?.pricePerSession) {
                unitPrice = Number(rule.pricePerSession);
              }
            }
          } else if (enrollment.paymentType === 'MONTHLY') {
            unitPrice = course.priceMonthly ? Number(course.priceMonthly) : 0;
            description = `${course.name} - Monthly fee`;
          } else if (enrollment.paymentType === 'YEARLY') {
            unitPrice = course.priceYearly ? Number(course.priceYearly) : 0;
            description = `${course.name} - Yearly fee`;
          } else if (enrollment.paymentType === 'FREE') {
            continue;
          }

          if (unitPrice > 0) {
            items.push({
              studentId: enrollment.studentId,
              description,
              quantity,
              unitPrice,
              total: unitPrice * quantity,
              courseId: enrollment.courseId,
            });
          }
        }

        if (items.length === 0) continue;

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const invoiceNumber = await this.generateInvoiceNumber(tx);

        const familyId = key.startsWith('student:') ? null : key;
        const studentId = key.startsWith('student:') ? key.replace('student:', '') : null;

        const invoice = await tx.invoice.create({
          data: {
            number: invoiceNumber,
            familyId,
            studentId,
            periodStart: new Date(dto.periodStart),
            periodEnd: new Date(dto.periodEnd),
            dueDate: new Date(dto.dueDate),
            status: 'DRAFT',
            subtotal,
            discount: 0,
            total: subtotal,
            items: { create: items },
          },
          include: { items: true },
        });

        invoices.push(invoice);
      }
    });

    this.logger.log(`Generated ${invoices.length} invoices for period ${dto.periodStart} - ${dto.periodEnd}`);
    return { generated: invoices.length, invoices };
  }

  async getOverdueInvoices() {
    const now = new Date();

    return this.prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: { lt: now },
      },
      include: {
        family: true,
        _count: { select: { items: true, payments: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getStats(startDate: Date, endDate: Date) {
    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' },
        },
        include: { payments: true },
      }),
      this.prisma.payment.findMany({
        where: { paidAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOutstanding = invoices
      .filter((i) => ['SENT', 'PARTIAL', 'OVERDUE'].includes(i.status))
      .reduce((sum, i) => {
        const paid = i.payments.reduce((s, p) => s + Number(p.amount), 0);
        return sum + (Number(i.total) - paid);
      }, 0);
    const totalPaid = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.total), 0);

    return {
      period: { startDate, endDate },
      totalInvoices: invoices.length,
      totalRevenue,
      totalOutstanding,
      totalPaid,
      byStatus: {
        DRAFT: invoices.filter((i) => i.status === 'DRAFT').length,
        SENT: invoices.filter((i) => i.status === 'SENT').length,
        PAID: invoices.filter((i) => i.status === 'PAID').length,
        PARTIAL: invoices.filter((i) => i.status === 'PARTIAL').length,
        OVERDUE: invoices.filter((i) => i.status === 'OVERDUE').length,
      },
    };
  }

  private async generateInvoiceNumber(tx?: any): Promise<string> {
    const client = tx || this.prisma;
    const year = new Date().getFullYear();
    const prefix = `MAM-${year}-`;

    const lastInvoice = await client.invoice.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
    });

    let nextNum = 1;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.number.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }
}

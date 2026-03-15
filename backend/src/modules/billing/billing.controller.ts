import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  RecordPaymentDto,
  GenerateInvoicesDto,
  InvoiceQueryDto,
} from './dto/billing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('billing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ---- Pricing Rules ----

  @Get('pricing-rules')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all pricing rules' })
  async getPricingRules(@Query() pagination: PaginationDto) {
    return this.billingService.getPricingRules(pagination);
  }

  @Post('pricing-rules')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create pricing rule' })
  async createPricingRule(@Body() dto: CreatePricingRuleDto) {
    return this.billingService.createPricingRule(dto);
  }

  @Patch('pricing-rules/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update pricing rule' })
  async updatePricingRule(@Param('id') id: string, @Body() dto: UpdatePricingRuleDto) {
    return this.billingService.updatePricingRule(id, dto);
  }

  @Delete('pricing-rules/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete pricing rule' })
  async deletePricingRule(@Param('id') id: string) {
    return this.billingService.deletePricingRule(id);
  }

  // ---- Invoices ----

  @Get('invoices')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all invoices' })
  async getInvoices(@Query() query: InvoiceQueryDto) {
    return this.billingService.getInvoices(query, { status: query.status, familyId: query.familyId });
  }

  @Post('invoices')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Create invoice manually' })
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(dto);
  }

  @Get('invoices/overdue')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all overdue invoices' })
  async getOverdueInvoices() {
    return this.billingService.getOverdueInvoices();
  }

  @Get('invoices/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get invoice by ID' })
  async getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoice(id);
  }

  @Patch('invoices/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Update invoice' })
  async updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.billingService.updateInvoice(id, dto);
  }

  @Delete('invoices/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Cancel invoice' })
  async deleteInvoice(@Param('id') id: string) {
    return this.billingService.deleteInvoice(id);
  }

  @Post('invoices/:id/send')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark invoice as SENT and trigger notification' })
  async sendInvoice(@Param('id') id: string) {
    return this.billingService.sendInvoice(id);
  }

  @Post('invoices/:id/payments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Record a payment for an invoice' })
  async recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.billingService.recordPayment(id, dto);
  }

  @Get('invoices/:id/payments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all payments for an invoice' })
  async getInvoicePayments(@Param('id') id: string) {
    return this.billingService.getInvoicePayments(id);
  }

  @Post('invoices/generate')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Auto-generate invoices for a period' })
  async generateInvoices(@Body() dto: GenerateInvoicesDto) {
    return this.billingService.generateInvoices(dto);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get billing statistics for a period' })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  async getStats(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.billingService.getStats(new Date(start), new Date(end));
  }
}

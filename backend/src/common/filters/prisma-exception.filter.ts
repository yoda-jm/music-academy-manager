import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[]) || [];
        message = `A record with the same ${fields.join(', ')} already exists`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string) || 'Record not found';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        message = `Foreign key constraint failed on field: ${field}`;
        break;
      }
      case 'P2014': {
        status = HttpStatus.BAD_REQUEST;
        message = 'The relation violates a required relation constraint';
        break;
      }
      case 'P2016': {
        status = HttpStatus.NOT_FOUND;
        message = 'Query interpretation error - record not found';
        break;
      }
      case 'P2021': {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Table not found in the database';
        break;
      }
      case 'P2022': {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Column not found in the database';
        break;
      }
      default: {
        this.logger.error(
          `Unhandled Prisma error: ${exception.code}`,
          exception.stack,
        );
        break;
      }
    }

    const errorResponse = {
      statusCode: status,
      message,
      error: HttpStatus[status],
      timestamp: new Date().toISOString(),
      path: request.url,
      prismaCode: exception.code,
    };

    this.logger.warn(
      `Prisma error ${exception.code} on ${request.method} ${request.url}: ${message}`,
    );

    response.status(status).json(errorResponse);
  }
}

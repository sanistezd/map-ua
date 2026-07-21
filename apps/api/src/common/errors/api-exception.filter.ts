import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  type ApiErrorBody,
  type ApiErrorCode,
  type ApiErrorResponse,
} from '@root/shared';
import { API_ERROR_CODES } from '@root/shared/api-error';
import type { Request, Response } from 'express';

const statusCodes: Partial<Record<number, ApiErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: API_ERROR_CODES.badRequest,
  [HttpStatus.NOT_FOUND]: API_ERROR_CODES.notFound,
  [HttpStatus.CONFLICT]: API_ERROR_CODES.conflict,
  [HttpStatus.TOO_MANY_REQUESTS]: API_ERROR_CODES.tooManyRequests,
  [HttpStatus.SERVICE_UNAVAILABLE]: API_ERROR_CODES.unavailable,
};

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    Object.values(API_ERROR_CODES).includes(
      (value as { code: ApiErrorCode }).code,
    )
  );
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const error: ApiErrorBody = isApiErrorBody(exceptionBody)
      ? exceptionBody
      : {
          code:
            statusCodes[status] ??
            (status >= 500
              ? API_ERROR_CODES.internal
              : API_ERROR_CODES.badRequest),
        };

    if (status >= 500) {
      this.logger.error(exception);
    }

    const body: ApiErrorResponse = {
      error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: (request as Request & { id?: string }).id,
    };
    response.status(status).json(body);
  }
}

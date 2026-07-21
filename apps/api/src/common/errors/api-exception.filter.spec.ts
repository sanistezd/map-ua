import type { ArgumentsHost } from '@nestjs/common';
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { API_ERROR_CODES } from '@root/shared/api-error';
import { describe, expect, it, vi } from 'vitest';

import { ApiExceptionFilter } from './api-exception.filter';

function createHost(request: { url: string; id?: string }) {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('ApiExceptionFilter', () => {
  it('passes through a structured error body as-is', () => {
    const filter = new ApiExceptionFilter();
    const { host, status, json } = createHost({ url: '/api/users' });

    filter.catch(
      new ConflictException({ code: API_ERROR_CODES.userEmailTaken }),
      host,
    );

    expect(status).toHaveBeenCalledExactlyOnceWith(409);
    expect(json).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: { code: API_ERROR_CODES.userEmailTaken },
        statusCode: 409,
        path: '/api/users',
      }),
    );
  });

  it('maps a mapped status without a structured body to its known code', () => {
    const filter = new ApiExceptionFilter();
    const { host, json } = createHost({ url: '/api/users/1' });

    filter.catch(new NotFoundException(), host);

    expect(json).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: { code: API_ERROR_CODES.notFound },
        statusCode: 404,
      }),
    );
  });

  it('maps HTTP 429 to tooManyRequests (rate limit)', () => {
    const filter = new ApiExceptionFilter();
    const { host, status, json } = createHost({ url: '/api/health' });

    filter.catch(
      new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS),
      host,
    );

    expect(status).toHaveBeenCalledExactlyOnceWith(429);
    expect(json).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: { code: API_ERROR_CODES.tooManyRequests },
        statusCode: 429,
      }),
    );
  });

  it('maps an unmapped 4xx status to badRequest', () => {
    const filter = new ApiExceptionFilter();
    const { host, json } = createHost({ url: '/api/x' });

    filter.catch(new ForbiddenException(), host);

    expect(json).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: { code: API_ERROR_CODES.badRequest },
        statusCode: 403,
      }),
    );
  });

  it('maps an unmapped 5xx HttpException to internal and logs it', () => {
    const filter = new ApiExceptionFilter();
    const logSpy = vi
      .spyOn(filter['logger'], 'error')
      .mockImplementation(() => undefined);
    const { host, json } = createHost({ url: '/api/x' });
    const exception = new HttpException('Bad gateway', 502);

    filter.catch(exception, host);

    expect(json).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: { code: API_ERROR_CODES.internal },
        statusCode: 502,
      }),
    );
    expect(logSpy).toHaveBeenCalledExactlyOnceWith(exception);
  });

  it('maps a non-HttpException to a 500 internal error and logs it', () => {
    const filter = new ApiExceptionFilter();
    const logSpy = vi
      .spyOn(filter['logger'], 'error')
      .mockImplementation(() => undefined);
    const { host, status, json } = createHost({ url: '/api/x' });
    const exception = new Error('connection refused');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledExactlyOnceWith(500);
    expect(json).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        error: { code: API_ERROR_CODES.internal },
        statusCode: 500,
      }),
    );
    expect(logSpy).toHaveBeenCalledExactlyOnceWith(exception);
  });

  it('never logs for a sub-500 status', () => {
    const filter = new ApiExceptionFilter();
    const logSpy = vi
      .spyOn(filter['logger'], 'error')
      .mockImplementation(() => undefined);
    const { host } = createHost({ url: '/api/x' });

    filter.catch(new NotFoundException(), host);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('includes the request id when present, and a valid ISO timestamp', () => {
    const filter = new ApiExceptionFilter();
    const { host, json } = createHost({ url: '/api/x', id: 'req-1' });

    filter.catch(new NotFoundException(), host);

    const body = json.mock.calls[0]?.[0] as {
      requestId?: string;
      timestamp: string;
    };
    expect(body.requestId).toBe('req-1');
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});

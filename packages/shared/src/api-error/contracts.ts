import type { ApiErrorCode } from './codes.js';

export interface ApiErrorBody {
  code: ApiErrorCode;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId?: string;
}

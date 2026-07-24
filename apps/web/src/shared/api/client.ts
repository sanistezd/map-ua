import type { ApiErrorCode, ApiErrorResponse } from '@root/shared';
import { API_ERROR_CODES } from '@root/shared/api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiClientError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    readonly details?: Record<string, unknown>,
  ) {
    super(code);
    this.name = ApiClientError.name;
  }
}

import { createClient as createBrowserClient } from './supabase/client';

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const isServer = typeof window === 'undefined';
  let token: string | undefined;

  if (!isServer) {
    const supabase = createBrowserClient();
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }

  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as ApiErrorResponse | null;
    throw new ApiClientError(
      body?.error.code ??
        (response.status >= 500
          ? API_ERROR_CODES.unavailable
          : API_ERROR_CODES.badRequest),
      response.status,
      body?.error.details,
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

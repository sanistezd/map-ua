/* eslint-disable no-restricted-imports */
import { type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { updateSession } from '@/shared/api/supabase/middleware';

import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  try {
    const supabaseResponse = await updateSession(request);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
  } catch (error) {
    console.error('updateSession failed:', error);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};

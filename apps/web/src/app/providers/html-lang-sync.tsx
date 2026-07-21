'use client';

import { useEffect } from 'react';

/**
 * <html lang> lives in the locale-independent root layout so ThemeProvider
 * never remounts on locale switches; this keeps it in sync client-side.
 */
export function HtmlLangSync({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

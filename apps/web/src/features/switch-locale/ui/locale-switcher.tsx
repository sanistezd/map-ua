'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { Button } from '@/shared/ui';

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('Locale');
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextLocale: AppLocale = locale === 'en' ? 'uk' : 'en';

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={t('label')}
      disabled={pending}
      onClick={() => {
        startTransition(() => router.replace(pathname, { locale: nextLocale }));
      }}
    >
      <Languages aria-hidden="true" />
      <span>{nextLocale === 'en' ? t('english') : t('ukrainian')}</span>
    </Button>
  );
}

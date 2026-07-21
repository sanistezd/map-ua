'use client';

import { useTranslations } from 'next-intl';

import { TestEmailCard } from '@/features/test/email';
import { TestHealthCard } from '@/features/test/health';
import { TestStorageCard } from '@/features/test/storage';
import { CornerTicks } from '@/shared/ui';

export function IntegrationTestsPanel() {
  const t = useTranslations('Integrations');

  return (
    <div className="panel relative p-4 sm:p-6">
      <CornerTicks />
      <div className="panel-label">
        <span className="tag">FIG. C</span>
        <span>{t('panelLabel')}</span>
      </div>
      <p className="mb-4 max-w-md text-sm text-muted-foreground">
        {t('description')}
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="min-w-0 rounded-md border border-border bg-background/40 p-4">
          <TestHealthCard />
        </div>
        <div className="min-w-0 rounded-md border border-border bg-background/40 p-4">
          <TestEmailCard />
        </div>
        <div className="min-w-0 rounded-md border border-border bg-background/40 p-4">
          <TestStorageCard />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { healthApi } from '@/entities/health';
import { Button } from '@/shared/ui';

export function TestHealthCard() {
  const [status, setStatus] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const t = useTranslations('Integrations.health');

  async function check() {
    setPending(true);
    try {
      const outcome = await healthApi.get();
      setStatus(outcome.status === 'ok');
      toast.success(t('success'));
    } catch (error) {
      setStatus(false);
      toast.error(t('failed', { error: (error as Error).message }));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={
            status === null
              ? 'h-1.5 w-1.5 rounded-full bg-graphite'
              : status
                ? 'h-1.5 w-1.5 rounded-full bg-ok'
                : 'h-1.5 w-1.5 rounded-full bg-alert'
          }
          aria-hidden="true"
        />
        <h3 className="font-mono text-xs font-semibold tracking-wide uppercase">
          {t('title')}
          <span className="font-normal text-muted-foreground">
            {' '}
            · {t('endpoint')}
          </span>
        </h3>
      </div>
      <Button type="button" disabled={pending} onClick={() => void check()}>
        {pending ? t('checking') : t('check')}
      </Button>
    </div>
  );
}

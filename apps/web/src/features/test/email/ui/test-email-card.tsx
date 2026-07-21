'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { integrationApi } from '@/entities/integration';
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from '@/shared/ui';

import {
  testEmailFormDefaults,
  testEmailFormSchema,
  type TestEmailFormValues,
} from '../model/schema';

export function TestEmailCard() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const t = useTranslations('Integrations.email');

  const formSchema = useMemo(
    () => testEmailFormSchema({ emailInvalid: t('emailInvalid') }),
    [t],
  );

  const form = useForm<TestEmailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: testEmailFormDefaults,
  });

  useEffect(() => {
    void integrationApi
      .emailStatus()
      .then((status) => setConfigured(status.configured))
      .catch(() => setConfigured(false));
  }, []);

  async function onSubmit(values: TestEmailFormValues) {
    setPending(true);
    try {
      const outcome = await integrationApi.sendTestEmail({ to: values.to });
      if (outcome.success) {
        toast.success(t('success', { provider: outcome.provider }));
        form.reset();
      } else {
        toast.error(t('failed', { error: outcome.error ?? outcome.provider }));
      }
    } catch (error) {
      toast.error(t('failed', { error: (error as Error).message }));
    } finally {
      setPending(false);
    }
  }

  const disabled = pending || configured !== true;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={
            configured === null
              ? 'h-1.5 w-1.5 rounded-full bg-graphite'
              : configured
                ? 'h-1.5 w-1.5 rounded-full bg-ok'
                : 'h-1.5 w-1.5 rounded-full bg-blueprint-soft'
          }
          aria-hidden="true"
        />
        <h3 className="font-mono text-xs font-semibold tracking-wide uppercase">
          {t('title')}
        </h3>
      </div>
      {configured === false && (
        <p className="mb-3 text-xs text-muted-foreground">
          {t('notConfiguredHint')}
        </p>
      )}
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FieldGroup className="gap-2">
          <Controller
            name="to"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.5">
                <FieldLabel htmlFor="test-email-to" className="sr-only">
                  {t('emailLabel')}
                </FieldLabel>
                <Input
                  {...field}
                  id="test-email-to"
                  type="email"
                  autoComplete="email"
                  placeholder={t('placeholder')}
                  aria-invalid={fieldState.invalid}
                  disabled={configured === false || pending}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Button className="w-full" type="submit" disabled={disabled}>
            {pending ? t('sending') : t('send')}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}

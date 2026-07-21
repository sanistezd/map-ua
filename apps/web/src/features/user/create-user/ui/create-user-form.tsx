'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { API_ERROR_CODES } from '@root/shared/api-error';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { userApi } from '@/entities/user';
import { ApiClientError } from '@/shared/api';
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from '@/shared/ui';

import {
  createUserFormDefaults,
  createUserFormSchema,
  type CreateUserFormValues,
} from '../model/schema';

export function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [pending, setPending] = useState(false);
  const t = useTranslations('Users');
  const tError = useTranslations('ApiErrors');

  const formSchema = useMemo(
    () => createUserFormSchema({ emailInvalid: t('emailInvalid') }),
    [t],
  );

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: createUserFormDefaults,
  });

  async function onSubmit(values: CreateUserFormValues) {
    setPending(true);
    try {
      await userApi.create({ email: values.email });
      form.reset();
      onCreated();
      toast.success(t('created', { email: values.email }));
    } catch (caught) {
      toast.error(
        tError(
          caught instanceof ApiClientError
            ? caught.code
            : API_ERROR_CODES.internal,
        ),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <FieldGroup className="gap-2 sm:flex-row sm:items-start">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="min-w-0 flex-1 gap-1.5"
            >
              <FieldLabel htmlFor="create-user-email" className="sr-only">
                {t('emailLabel')}
              </FieldLabel>
              <Input
                {...field}
                id="create-user-email"
                type="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                aria-invalid={fieldState.invalid}
                disabled={pending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? t('adding') : t('add')}
        </Button>
      </FieldGroup>
    </form>
  );
}

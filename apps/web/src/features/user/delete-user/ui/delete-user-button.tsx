'use client';

import { API_ERROR_CODES } from '@root/shared/api-error';
import type { UserDto } from '@root/shared/user';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { userApi } from '@/entities/user';
import { ApiClientError } from '@/shared/api';
import { Button, ConfirmDialog } from '@/shared/ui';

export function DeleteUserButton({
  user,
  onDeleted,
}: {
  user: UserDto;
  onDeleted: () => void;
}) {
  const [pending, setPending] = useState(false);
  const t = useTranslations('Users');
  const tError = useTranslations('ApiErrors');

  async function handleConfirm() {
    setPending(true);
    try {
      await userApi.remove(user.id);
      onDeleted();
      toast.success(t('deleted', { email: user.email }));
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
    <ConfirmDialog
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={t('deleteAria', { email: user.email })}
        >
          {t('delete')}
        </Button>
      }
      title={t('deleteTitle')}
      description={t('deleteDescription', { email: user.email })}
      confirmLabel={t('deleteConfirm')}
      cancelLabel={t('deleteCancel')}
      onConfirm={() => void handleConfirm()}
    />
  );
}

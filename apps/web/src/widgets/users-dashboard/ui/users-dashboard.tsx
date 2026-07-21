'use client';

import { API_ERROR_CODES } from '@root/shared/api-error';
import type { UserDto } from '@root/shared/user';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { userApi, UserList } from '@/entities/user';
import { CreateUserForm } from '@/features/user/create-user';
import { DeleteUserButton } from '@/features/user/delete-user';
import { CornerTicks } from '@/shared/ui';

export function UsersDashboard() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [hasError, setHasError] = useState(false);
  const t = useTranslations('Users');
  const tError = useTranslations('ApiErrors');

  const refresh = useCallback(() => {
    void userApi
      .list()
      .then(setUsers)
      .then(() => setHasError(false))
      .catch(() => setHasError(true));
  }, []);

  useEffect(refresh, [refresh]);

  return (
    <div className="panel relative p-4 sm:p-6">
      <CornerTicks />
      <div className="panel-label">
        <span className="tag">FIG. B</span>
        <span>{t('panelLabel')}</span>
      </div>
      <CreateUserForm onCreated={refresh} />
      {hasError ? (
        <p className="error mt-4">{tError(API_ERROR_CODES.unavailable)}</p>
      ) : (
        <UserList
          users={users}
          renderActions={(user) => (
            <DeleteUserButton user={user} onDeleted={refresh} />
          )}
        />
      )}
    </div>
  );
}

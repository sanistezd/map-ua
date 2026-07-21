'use client';

import type { UserDto } from '@root/shared/user';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export function UserList({
  users,
  renderActions,
}: {
  users: UserDto[];
  renderActions?: (user: UserDto) => ReactNode;
}) {
  const t = useTranslations('Users');
  const format = useFormatter();
  if (!users.length) {
    return <p className="mt-4 text-sm text-muted-foreground">{t('empty')}</p>;
  }
  return (
    <ul className="data-list mt-4">
      {users.map((user) => (
        <li key={user.id}>
          <span>{user.email}</span>
          <span className="flex items-center gap-3">
            <small>{format.dateTime(new Date(user.createdAt))}</small>
            {renderActions?.(user)}
          </span>
        </li>
      ))}
    </ul>
  );
}

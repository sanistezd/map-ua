import type { CreateUserDto, UserDto } from '@root/shared/user';

import { apiRequest } from '@/shared/api';

export const userApi = {
  list: () => apiRequest<UserDto[]>('/users', { cache: 'no-store' }),
  create: (input: CreateUserDto) =>
    apiRequest<UserDto>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/users/${id}`, { method: 'DELETE' }),
};

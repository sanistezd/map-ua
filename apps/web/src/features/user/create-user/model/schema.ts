import { z } from 'zod';

import { emailField } from '@/shared/lib';

export function createUserFormSchema(messages: { emailInvalid: string }) {
  return z.object({
    email: emailField(messages.emailInvalid),
  });
}

export type CreateUserFormValues = z.infer<
  ReturnType<typeof createUserFormSchema>
>;

export const createUserFormDefaults: CreateUserFormValues = {
  email: '',
};

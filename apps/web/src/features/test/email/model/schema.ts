import { z } from 'zod';

import { emailField } from '@/shared/lib';

export function testEmailFormSchema(messages: { emailInvalid: string }) {
  return z.object({
    to: emailField(messages.emailInvalid),
  });
}

export type TestEmailFormValues = z.infer<
  ReturnType<typeof testEmailFormSchema>
>;

export const testEmailFormDefaults: TestEmailFormValues = {
  to: '',
};

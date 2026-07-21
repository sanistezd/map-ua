import { z } from 'zod';

/** Shared email field; pass a translated invalid-message from the caller. */
export function emailField(invalidMessage: string) {
  return z.email(invalidMessage);
}

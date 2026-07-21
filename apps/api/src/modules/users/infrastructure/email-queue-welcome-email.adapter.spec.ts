import { describe, expect, it, vi } from 'vitest';

import type { EmailQueueService } from '@/modules/email/email-queue.service';

import { EmailQueueWelcomeEmailAdapter } from './email-queue-welcome-email.adapter';

describe('EmailQueueWelcomeEmailAdapter', () => {
  it('delegates welcome emails to the technical email queue', async () => {
    const emailQueue = {
      enqueueWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as EmailQueueService;

    await expect(
      new EmailQueueWelcomeEmailAdapter(emailQueue).enqueue('a@b.com'),
    ).resolves.toBeUndefined();
    expect(emailQueue.enqueueWelcomeEmail).toHaveBeenCalledExactlyOnceWith(
      'a@b.com',
    );
  });
});

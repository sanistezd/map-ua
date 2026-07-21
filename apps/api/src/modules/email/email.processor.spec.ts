import type { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { EmailProcessor } from './email.processor';
import type { EmailService } from './email.service';

function createEmailService(
  result: Partial<Awaited<ReturnType<EmailService['send']>>>,
): EmailService {
  return {
    send: vi
      .fn()
      .mockResolvedValue({ success: true, provider: 'resend', ...result }),
  } as unknown as EmailService;
}

function createJob(name: string, data: unknown): Job {
  return { name, data } as Job;
}

describe('EmailProcessor', () => {
  it('sends a welcome email for "welcome" jobs', async () => {
    const email = createEmailService({});
    const processor = new EmailProcessor(email);

    await processor.process(createJob('welcome', { email: 'a@b.com' }));

    expect(email.send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ to: 'a@b.com' }),
    );
  });

  it('does not throw when email is simply not configured (noop)', async () => {
    const email = createEmailService({
      success: false,
      provider: 'noop',
      error: 'No email provider is configured.',
    });
    const processor = new EmailProcessor(email);

    await expect(
      processor.process(createJob('welcome', { email: 'a@b.com' })),
    ).resolves.toBeUndefined();
  });

  it('throws so BullMQ retries when a configured provider actually fails', async () => {
    const email = createEmailService({
      success: false,
      provider: 'smtp',
      error: 'boom',
    });
    const processor = new EmailProcessor(email);

    await expect(
      processor.process(createJob('welcome', { email: 'a@b.com' })),
    ).rejects.toThrow('boom');
  });

  it('ignores unknown job names without calling EmailService', async () => {
    const email = createEmailService({});
    const processor = new EmailProcessor(email);

    await expect(
      processor.process(createJob('unknown', {})),
    ).resolves.toBeUndefined();
    expect(email.send).not.toHaveBeenCalled();
  });
});

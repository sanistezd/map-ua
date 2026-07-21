import type { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { EmailQueueService } from './email-queue.service';

function createQueue(): Queue {
  return { add: vi.fn().mockResolvedValue(undefined) } as unknown as Queue;
}

describe('EmailQueueService', () => {
  it('enqueues a welcome email job with retry options', async () => {
    const queue = createQueue();
    const service = new EmailQueueService(queue);

    await service.enqueueWelcomeEmail('a@b.com');

    expect(queue.add).toHaveBeenCalledExactlyOnceWith(
      'welcome',
      { email: 'a@b.com' },
      expect.objectContaining({ attempts: 3 }),
    );
  });

  it('swallows errors instead of throwing when the queue is unreachable', async () => {
    const queue = {
      add: vi.fn().mockRejectedValue(new Error('redis down')),
    } as unknown as Queue;
    const service = new EmailQueueService(queue);

    await expect(
      service.enqueueWelcomeEmail('a@b.com'),
    ).resolves.toBeUndefined();
  });
});

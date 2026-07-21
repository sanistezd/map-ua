import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { JobsOptions, Queue } from 'bullmq';

import { EMAIL_QUEUE, type WelcomeEmailJobData } from './email.types';

const JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
  removeOnFail: 50,
};

/**
 * Enqueues email jobs instead of sending inline, so a slow or failing
 * provider never blocks the request that triggered the email (e.g. user
 * creation). Never throws — a failed enqueue is logged, not propagated,
 * for the same reason EmailService itself never throws on send failure.
 */
@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@InjectQueue(EMAIL_QUEUE) private readonly queue: Queue) {}

  async enqueueWelcomeEmail(email: string): Promise<void> {
    try {
      await this.queue.add(
        'welcome',
        { email } satisfies WelcomeEmailJobData,
        JOB_OPTIONS,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to enqueue welcome email: ${(error as Error).message}`,
      );
    }
  }
}

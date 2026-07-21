import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { EmailService } from './email.service';
import { EMAIL_QUEUE, type WelcomeEmailJobData } from './email.types';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly email: EmailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'welcome':
        await this.sendWelcomeEmail(job.data as WelcomeEmailJobData);
        return;
      default:
        this.logger.warn(`Unknown email job "${job.name}", skipping.`);
    }
  }

  private async sendWelcomeEmail({
    email,
  }: WelcomeEmailJobData): Promise<void> {
    const result = await this.email.send({
      to: email,
      subject: 'Welcome!',
      text: `Thanks for creating an account with ${email}. This email was sent asynchronously through the email queue.`,
    });

    // "noop" means email isn't configured at all — retrying won't help, so
    // don't fail the job. Any other failure is a real, possibly transient
    // error and should retry per the job's backoff policy.
    if (!result.success && result.provider !== 'noop') {
      throw new Error(result.error ?? 'Welcome email failed to send');
    }
  }
}

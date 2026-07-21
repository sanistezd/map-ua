import { Injectable } from '@nestjs/common';

import { EmailQueueService } from '@/modules/email/email-queue.service';

import type { WelcomeEmailPort } from '../domain/welcome-email.port';

@Injectable()
export class EmailQueueWelcomeEmailAdapter implements WelcomeEmailPort {
  constructor(private readonly emailQueue: EmailQueueService) {}

  enqueue(email: string): Promise<void> {
    return this.emailQueue.enqueueWelcomeEmail(email);
  }
}

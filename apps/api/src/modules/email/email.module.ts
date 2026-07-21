import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { EmailController } from './email.controller';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { EMAIL_QUEUE } from './email.types';
import { EmailQueueService } from './email-queue.service';

@Module({
  imports: [BullModule.registerQueue({ name: EMAIL_QUEUE })],
  controllers: [EmailController],
  providers: [EmailService, EmailQueueService, EmailProcessor],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {}

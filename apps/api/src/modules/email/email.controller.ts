import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type {
  EmailStatusDto,
  EmailTestResultDto,
  SendTestEmailDto,
} from '@root/shared/email';
import { IsEmail } from 'class-validator';

import { NonProductionGuard } from '@/common/guards/non-production.guard';

import { EmailService } from './email.service';

class SendTestEmailRequest implements SendTestEmailDto {
  @IsEmail()
  to!: string;
}

@Controller('email')
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Get('status')
  status(): EmailStatusDto {
    return { configured: this.email.isConfigured() };
  }

  @Post('test')
  @UseGuards(NonProductionGuard)
  test(@Body() body: SendTestEmailRequest): Promise<EmailTestResultDto> {
    return this.email.send({
      to: body.to,
      subject: 'Test email from the starter template',
      text: 'If you received this, your email configuration works.',
    });
  }
}

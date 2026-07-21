import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import type {
  EmailAttachment,
  EmailParams,
  EmailSendResult,
} from './email.types';

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_SMTP_PORT = 587;

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

interface ResendResponseBody {
  id?: string;
  message?: string;
}

/**
 * Resend is tried first; SMTP (via Nodemailer) is the fallback when Resend
 * is unconfigured or the request fails. Both are optional — if neither is
 * configured, sends are logged and reported as a no-op rather than thrown,
 * since a failed notification email should not break the calling flow.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private smtpTransporter:
    nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null | undefined;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.getResendApiKey() ?? this.getSmtpConfig());
  }

  async send(params: EmailParams): Promise<EmailSendResult> {
    this.validateParams(params);

    const resendResult = await this.sendViaResend(params);
    if (resendResult) {
      return resendResult;
    }

    const smtpResult = await this.sendViaSmtp(params);
    if (smtpResult) {
      return smtpResult;
    }

    this.logger.warn('Email send skipped: no email provider is configured.');
    return {
      success: false,
      provider: 'noop',
      error: 'No email provider is configured.',
    };
  }

  private getResendApiKey(): string | null {
    return this.config.get<string>('RESEND_API_KEY') ?? null;
  }

  private getSmtpConfig(): SmtpConfig | null {
    const host = this.config.get<string>('EMAIL_HOST');
    const user = this.config.get<string>('EMAIL_USER');
    const pass = this.config.get<string>('EMAIL_PASS');

    if (!host || !user || !pass) {
      return null;
    }

    const port = this.config.get<number>('EMAIL_PORT') ?? DEFAULT_SMTP_PORT;
    const secure = this.config.get<boolean>('EMAIL_SECURE') ?? port === 465;

    return { host, port, secure, auth: { user, pass } };
  }

  private resolveFromAddress(params: EmailParams): string {
    const from = params.from ?? this.config.get<string>('EMAIL_FROM');

    if (!from) {
      throw new Error(
        'No email from address configured. Set EMAIL_FROM or provide params.from.',
      );
    }

    return from;
  }

  private normalizeRecipients(value: EmailParams['to']): string[] {
    return Array.isArray(value) ? value : [value];
  }

  private validateParams(params: EmailParams): void {
    if (!params.subject.trim()) {
      throw new Error('Email subject is required.');
    }
    if (!params.text && !params.html) {
      throw new Error('Email text or html content is required.');
    }
    if (this.normalizeRecipients(params.to).length === 0) {
      throw new Error('At least one recipient is required.');
    }
  }

  private encodeAttachment(attachment: EmailAttachment) {
    const content =
      attachment.encoding === 'base64'
        ? attachment.content
        : Buffer.from(
            attachment.content,
            attachment.encoding ?? 'utf-8',
          ).toString('base64');

    return {
      filename: attachment.filename,
      content,
      ...(attachment.contentType ? { type: attachment.contentType } : {}),
    };
  }

  private async sendViaResend(
    params: EmailParams,
  ): Promise<EmailSendResult | null> {
    const apiKey = this.getResendApiKey();
    if (!apiKey) {
      return null;
    }

    const payload = {
      from: this.resolveFromAddress(params),
      to: this.normalizeRecipients(params.to),
      subject: params.subject,
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      ...(params.cc ? { cc: this.normalizeRecipients(params.cc) } : {}),
      ...(params.bcc ? { bcc: this.normalizeRecipients(params.bcc) } : {}),
      ...(params.html ? { html: params.html } : {}),
      ...(!params.html && params.text ? { text: params.text } : {}),
      ...(params.attachments?.length
        ? {
            attachments: params.attachments.map((attachment) =>
              this.encodeAttachment(attachment),
            ),
          }
        : {}),
    };

    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = (await response
        .json()
        .catch(() => null)) as ResendResponseBody | null;

      if (!response.ok) {
        const error =
          body?.message ??
          `Resend request failed with status ${response.status}`;
        this.logger.warn(
          `Email send failed via Resend, falling back to SMTP: ${error}`,
        );
        return null;
      }

      this.logger.log(
        `Email sent via Resend to ${this.normalizeRecipients(params.to).join(', ')}`,
      );
      return { success: true, provider: 'resend', messageId: body?.id };
    } catch (error) {
      this.logger.warn(
        `Email send threw via Resend, falling back to SMTP: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private getSmtpTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null {
    if (this.smtpTransporter !== undefined) {
      return this.smtpTransporter;
    }

    const smtpConfig = this.getSmtpConfig();
    if (!smtpConfig) {
      this.smtpTransporter = null;
      return this.smtpTransporter;
    }

    this.smtpTransporter = nodemailer.createTransport(smtpConfig);
    return this.smtpTransporter;
  }

  private async sendViaSmtp(
    params: EmailParams,
  ): Promise<EmailSendResult | null> {
    const transporter = this.getSmtpTransporter();
    if (!transporter) {
      return null;
    }

    try {
      const info = await transporter.sendMail({
        from: this.resolveFromAddress(params),
        to: this.normalizeRecipients(params.to).join(', '),
        ...(params.replyTo ? { replyTo: params.replyTo } : {}),
        ...(params.cc
          ? { cc: this.normalizeRecipients(params.cc).join(', ') }
          : {}),
        ...(params.bcc
          ? { bcc: this.normalizeRecipients(params.bcc).join(', ') }
          : {}),
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments: params.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content:
            attachment.encoding === 'base64'
              ? Buffer.from(attachment.content, 'base64')
              : attachment.content,
          ...(attachment.contentType
            ? { contentType: attachment.contentType }
            : {}),
        })),
      });

      this.logger.log(
        `Email sent via SMTP to ${this.normalizeRecipients(params.to).join(', ')}`,
      );
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (error) {
      this.logger.error(
        `Email send failed via SMTP: ${(error as Error).message}`,
      );
      return null;
    }
  }
}

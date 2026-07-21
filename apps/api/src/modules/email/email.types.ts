export interface EmailAttachment {
  filename: string;
  content: string;
  encoding?: 'base64' | BufferEncoding;
  contentType?: string;
}

export interface EmailParams {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export type EmailProvider = 'resend' | 'smtp' | 'noop';

export interface EmailSendResult {
  success: boolean;
  provider: EmailProvider;
  messageId?: string;
  error?: string;
}

export const EMAIL_QUEUE = 'email';

export interface WelcomeEmailJobData {
  email: string;
}

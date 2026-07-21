export type EmailProvider = 'resend' | 'smtp' | 'noop';

/** Framework-independent email configuration status shared across applications. */
export interface EmailStatusDto {
  configured: boolean;
}

/** Framework-independent send-test-email result shared across applications. */
export interface EmailTestResultDto {
  success: boolean;
  provider: EmailProvider;
  messageId?: string;
  error?: string;
}

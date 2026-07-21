import { describe, expect, it, vi } from 'vitest';

import { EmailController } from './email.controller';
import type { EmailService } from './email.service';

function createEmail(): EmailService {
  return {
    isConfigured: vi.fn(),
    send: vi.fn(),
  } as unknown as EmailService;
}

describe('EmailController', () => {
  it('reports whether email is configured', () => {
    const email = createEmail();
    (email.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const controller = new EmailController(email);

    expect(controller.status()).toEqual({ configured: true });
  });

  it('sends a fixed test email to the requested address', async () => {
    const email = createEmail();
    const result = { success: true, provider: 'resend' as const };
    (email.send as ReturnType<typeof vi.fn>).mockResolvedValue(result);
    const controller = new EmailController(email);

    await expect(controller.test({ to: 'a@b.com' })).resolves.toEqual(result);
    expect(email.send).toHaveBeenCalledExactlyOnceWith({
      to: 'a@b.com',
      subject: 'Test email from the starter template',
      text: 'If you received this, your email configuration works.',
    });
  });
});

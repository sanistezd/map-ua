import type { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailService } from './email.service';

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn() },
}));

function createConfig(
  values: Record<string, string | undefined> = {},
): ConfigService {
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('validation', () => {
    it('throws when subject is missing', async () => {
      const service = new EmailService(createConfig());
      await expect(
        service.send({ to: 'a@b.com', subject: '  ', text: 'hi' }),
      ).rejects.toThrow('Email subject is required.');
    });

    it('throws when neither text nor html is provided', async () => {
      const service = new EmailService(createConfig());
      await expect(
        service.send({ to: 'a@b.com', subject: 'Hi' }),
      ).rejects.toThrow('Email text or html content is required.');
    });

    it('throws when there are no recipients', async () => {
      const service = new EmailService(createConfig());
      await expect(
        service.send({ to: [], subject: 'Hi', text: 'hi' }),
      ).rejects.toThrow('At least one recipient is required.');
    });
  });

  describe('isConfigured', () => {
    it('is false when neither Resend nor SMTP is configured', () => {
      expect(new EmailService(createConfig()).isConfigured()).toBe(false);
    });

    it('is true when RESEND_API_KEY is set', () => {
      const service = new EmailService(createConfig({ RESEND_API_KEY: 'key' }));
      expect(service.isConfigured()).toBe(true);
    });

    it('is true when full SMTP config is set', () => {
      const service = new EmailService(
        createConfig({
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_USER: 'user',
          EMAIL_PASS: 'pass',
        }),
      );
      expect(service.isConfigured()).toBe(true);
    });

    it('is false when SMTP config is only partially set', () => {
      const service = new EmailService(
        createConfig({ EMAIL_HOST: 'smtp.example.com' }),
      );
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('send', () => {
    it('returns a noop result when nothing is configured', async () => {
      const service = new EmailService(createConfig());
      await expect(
        service.send({ to: 'a@b.com', subject: 'Hi', text: 'hi' }),
      ).resolves.toEqual({
        success: false,
        provider: 'noop',
        error: 'No email provider is configured.',
      });
    });

    it('sends via Resend when configured', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'resend-1' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      const service = new EmailService(
        createConfig({
          RESEND_API_KEY: 'key',
          EMAIL_FROM: 'from@example.com',
        }),
      );

      await expect(
        service.send({ to: 'a@b.com', subject: 'Hi', text: 'hi' }),
      ).resolves.toEqual({
        success: true,
        provider: 'resend',
        messageId: 'resend-1',
      });
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('falls back to SMTP when the Resend request fails', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'boom' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      const sendMail = vi.fn().mockResolvedValue({ messageId: 'smtp-1' });
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail,
      } as never);

      const service = new EmailService(
        createConfig({
          RESEND_API_KEY: 'key',
          EMAIL_FROM: 'from@example.com',
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_USER: 'user',
          EMAIL_PASS: 'pass',
        }),
      );

      await expect(
        service.send({ to: 'a@b.com', subject: 'Hi', text: 'hi' }),
      ).resolves.toEqual({
        success: true,
        provider: 'smtp',
        messageId: 'smtp-1',
      });
      expect(sendMail).toHaveBeenCalledOnce();
    });

    it('falls back to SMTP when the Resend request throws', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('network down')),
      );
      const sendMail = vi.fn().mockResolvedValue({ messageId: 'smtp-2' });
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail,
      } as never);

      const service = new EmailService(
        createConfig({
          RESEND_API_KEY: 'key',
          EMAIL_FROM: 'from@example.com',
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_USER: 'user',
          EMAIL_PASS: 'pass',
        }),
      );

      await expect(
        service.send({ to: 'a@b.com', subject: 'Hi', text: 'hi' }),
      ).resolves.toEqual({
        success: true,
        provider: 'smtp',
        messageId: 'smtp-2',
      });
    });

    it('throws a clear error when no from address is configured', async () => {
      vi.stubGlobal('fetch', vi.fn());
      const service = new EmailService(createConfig({ RESEND_API_KEY: 'key' }));

      await expect(
        service.send({ to: 'a@b.com', subject: 'Hi', text: 'hi' }),
      ).rejects.toThrow('No email from address configured');
    });
  });
});

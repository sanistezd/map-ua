import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { StorageController } from './storage.controller';
import type { StorageService } from './storage.service';
import { StorageNotConfiguredError } from './storage-not-configured.error';

function createFile(): Express.Multer.File {
  return {
    originalname: 'test.txt',
    buffer: Buffer.from('hello'),
    mimetype: 'text/plain',
  } as Express.Multer.File;
}

describe('StorageController', () => {
  it('rejects a test upload with no file', async () => {
    const controller = new StorageController({} as StorageService);
    await expect(controller.test(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns the key on a successful upload', async () => {
    const storage = {
      upload: vi.fn().mockResolvedValue({ key: 'ignored' }),
    } as unknown as StorageService;
    const controller = new StorageController(storage);

    const result = await controller.test(createFile());

    expect(result.success).toBe(true);
    expect(result.key).toMatch(/test\.txt$/);
  });

  it('surfaces the not-configured message as-is (it is our own safe text)', async () => {
    const storage = {
      upload: vi.fn().mockRejectedValue(new StorageNotConfiguredError()),
    } as unknown as StorageService;
    const controller = new StorageController(storage);

    await expect(controller.test(createFile())).resolves.toEqual({
      success: false,
      error: new StorageNotConfiguredError().message,
    });
  });

  it('never leaks a raw unexpected error message to the client', async () => {
    const storage = {
      upload: vi
        .fn()
        .mockRejectedValue(
          new Error('AccessDenied: arn:aws:s3:::internal-bucket-name'),
        ),
    } as unknown as StorageService;
    const controller = new StorageController(storage);

    const result = await controller.test(createFile());

    expect(result.success).toBe(false);
    expect(result.error).not.toContain('arn:aws:s3');
    expect(result.error).not.toContain('AccessDenied');
  });

  describe('files', () => {
    it('lists objects with a signed URL for each', async () => {
      const storage = {
        list: vi
          .fn()
          .mockResolvedValue([
            { key: 'test-uploads/a.txt', size: 3, lastModified: new Date(0) },
            { key: 'test-uploads/b.txt' },
          ]),
        getSignedDownloadUrl: vi
          .fn()
          .mockResolvedValue('https://signed.example.com/file'),
      } as unknown as StorageService;
      const controller = new StorageController(storage);

      await expect(controller.files()).resolves.toEqual([
        {
          key: 'test-uploads/a.txt',
          url: 'https://signed.example.com/file',
          size: 3,
          lastModifiedAt: new Date(0).toISOString(),
        },
        {
          key: 'test-uploads/b.txt',
          url: 'https://signed.example.com/file',
          size: undefined,
          lastModifiedAt: undefined,
        },
      ]);
    });

    it('maps not-configured to a 503 with a stable error code', async () => {
      const storage = {
        list: vi.fn().mockRejectedValue(new StorageNotConfiguredError()),
      } as unknown as StorageService;
      const controller = new StorageController(storage);

      await expect(controller.files()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('rethrows unexpected errors for the central filter to log and genericize', async () => {
      const storage = {
        list: vi
          .fn()
          .mockRejectedValue(
            new Error('AccessDenied: arn:aws:s3:::internal-bucket-name'),
          ),
      } as unknown as StorageService;
      const controller = new StorageController(storage);

      await expect(controller.files()).rejects.toThrow('AccessDenied');
    });
  });

  describe('deleteFile', () => {
    it('rejects when no key is given', async () => {
      const controller = new StorageController({} as StorageService);
      await expect(controller.deleteFile()).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a key outside the test-uploads/ namespace', async () => {
      const controller = new StorageController({} as StorageService);
      await expect(
        controller.deleteFile('some-other-prefix/file.txt'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deletes and returns the key on success', async () => {
      const storage = {
        delete: vi.fn().mockResolvedValue(undefined),
      } as unknown as StorageService;
      const controller = new StorageController(storage);

      await expect(
        controller.deleteFile('test-uploads/a.txt'),
      ).resolves.toEqual({ success: true, key: 'test-uploads/a.txt' });
      expect(storage.delete).toHaveBeenCalledExactlyOnceWith(
        'test-uploads/a.txt',
      );
    });

    it('surfaces the not-configured message as-is (it is our own safe text)', async () => {
      const storage = {
        delete: vi.fn().mockRejectedValue(new StorageNotConfiguredError()),
      } as unknown as StorageService;
      const controller = new StorageController(storage);

      await expect(
        controller.deleteFile('test-uploads/a.txt'),
      ).resolves.toEqual({
        success: false,
        error: new StorageNotConfiguredError().message,
      });
    });

    it('never leaks a raw unexpected error message to the client', async () => {
      const storage = {
        delete: vi
          .fn()
          .mockRejectedValue(
            new Error('AccessDenied: arn:aws:s3:::internal-bucket-name'),
          ),
      } as unknown as StorageService;
      const controller = new StorageController(storage);

      const result = await controller.deleteFile('test-uploads/a.txt');

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('arn:aws:s3');
      expect(result.error).not.toContain('AccessDenied');
    });
  });
});

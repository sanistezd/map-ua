import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StorageService } from './storage.service';

const { sendMock, S3ClientMock } = vi.hoisted(() => {
  const sendMock = vi.fn();
  const S3ClientMock = vi.fn().mockImplementation(function S3Client() {
    return { send: sendMock };
  });
  return { sendMock, S3ClientMock };
});

function commandMock(name: string) {
  return vi.fn().mockImplementation(function (input: unknown) {
    return { name, input };
  });
}

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: S3ClientMock,
  PutObjectCommand: commandMock('PutObjectCommand'),
  DeleteObjectCommand: commandMock('DeleteObjectCommand'),
  GetObjectCommand: commandMock('GetObjectCommand'),
  ListObjectsV2Command: commandMock('ListObjectsV2Command'),
}));

const { getSignedUrlMock } = vi.hoisted(() => ({
  getSignedUrlMock: vi
    .fn()
    .mockResolvedValue('https://signed.example.com/file'),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: getSignedUrlMock,
}));

function createConfig(
  values: Record<string, string | undefined> = {},
): ConfigService {
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

const CONFIGURED = {
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'key',
  AWS_SECRET_ACCESS_KEY: 'secret',
  AWS_S3_BUCKET: 'bucket',
};

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockResolvedValue({});
  });

  describe('isConfigured', () => {
    it('is false when nothing is set', () => {
      expect(new StorageService(createConfig()).isConfigured()).toBe(false);
    });

    it('is false when credentials are set but no bucket is configured', () => {
      const { AWS_S3_BUCKET: _bucket, ...withoutBucket } = CONFIGURED;
      expect(
        new StorageService(createConfig(withoutBucket)).isConfigured(),
      ).toBe(false);
    });

    it('is true when region, credentials, and bucket are all set', () => {
      expect(new StorageService(createConfig(CONFIGURED)).isConfigured()).toBe(
        true,
      );
    });
  });

  describe('upload', () => {
    it('throws when not configured', async () => {
      const service = new StorageService(createConfig());
      await expect(
        service.upload({ key: 'file.txt', body: 'hello' }),
      ).rejects.toThrow('S3 storage is not configured');
    });

    it('uploads through the S3 client when configured', async () => {
      const service = new StorageService(createConfig(CONFIGURED));
      await expect(
        service.upload({
          key: 'file.txt',
          body: 'hello',
          contentType: 'text/plain',
        }),
      ).resolves.toEqual({ key: 'file.txt' });
      expect(sendMock).toHaveBeenCalledOnce();
    });
  });

  describe('delete', () => {
    it('throws when not configured', async () => {
      const service = new StorageService(createConfig());
      await expect(service.delete('file.txt')).rejects.toThrow(
        'S3 storage is not configured',
      );
    });

    it('deletes through the S3 client when configured', async () => {
      const service = new StorageService(createConfig(CONFIGURED));
      await expect(service.delete('file.txt')).resolves.toBeUndefined();
      expect(sendMock).toHaveBeenCalledOnce();
    });
  });

  describe('getSignedDownloadUrl', () => {
    it('throws when not configured', () => {
      const service = new StorageService(createConfig());
      expect(() => service.getSignedDownloadUrl({ key: 'file.txt' })).toThrow(
        'S3 storage is not configured',
      );
    });

    it('returns a signed URL when configured', async () => {
      const service = new StorageService(createConfig(CONFIGURED));
      await expect(
        service.getSignedDownloadUrl({ key: 'file.txt' }),
      ).resolves.toBe('https://signed.example.com/file');
    });
  });

  describe('list', () => {
    it('throws when not configured', async () => {
      const service = new StorageService(createConfig());
      await expect(service.list()).rejects.toThrow(
        'S3 storage is not configured',
      );
    });

    it('returns objects from a single page', async () => {
      sendMock.mockResolvedValueOnce({
        Contents: [
          { Key: 'test-uploads/a.txt', Size: 3, LastModified: new Date(0) },
          { Key: 'test-uploads/b.txt', Size: 5 },
        ],
        IsTruncated: false,
      });
      const service = new StorageService(createConfig(CONFIGURED));

      await expect(service.list('test-uploads/')).resolves.toEqual([
        { key: 'test-uploads/a.txt', size: 3, lastModified: new Date(0) },
        { key: 'test-uploads/b.txt', size: 5, lastModified: undefined },
      ]);
      expect(sendMock).toHaveBeenCalledOnce();
    });

    it('follows pagination until IsTruncated is false', async () => {
      sendMock
        .mockResolvedValueOnce({
          Contents: [{ Key: 'test-uploads/a.txt' }],
          IsTruncated: true,
          NextContinuationToken: 'token-1',
        })
        .mockResolvedValueOnce({
          Contents: [{ Key: 'test-uploads/b.txt' }],
          IsTruncated: false,
        });
      const service = new StorageService(createConfig(CONFIGURED));

      const result = await service.list('test-uploads/');

      expect(result.map((object) => object.key)).toEqual([
        'test-uploads/a.txt',
        'test-uploads/b.txt',
      ]);
      expect(sendMock).toHaveBeenCalledTimes(2);
    });

    it('returns an empty list when the page has no contents', async () => {
      sendMock.mockResolvedValueOnce({ IsTruncated: false });
      const service = new StorageService(createConfig(CONFIGURED));

      await expect(service.list()).resolves.toEqual([]);
    });

    it('skips entries without a key', async () => {
      sendMock.mockResolvedValueOnce({
        Contents: [{ Size: 3 }, { Key: 'test-uploads/a.txt' }],
        IsTruncated: false,
      });
      const service = new StorageService(createConfig(CONFIGURED));

      const result = await service.list();

      expect(result).toEqual([
        { key: 'test-uploads/a.txt', size: undefined, lastModified: undefined },
      ]);
    });
  });
});

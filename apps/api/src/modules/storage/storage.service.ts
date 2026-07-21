import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  ListedStorageObject,
  SignedUrlParams,
  StorageObject,
  UploadObjectParams,
} from './storage.types';
import { StorageNotConfiguredError } from './storage-not-configured.error';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 900;

/**
 * Works against AWS S3 by default; setting AWS_S3_ENDPOINT points the same
 * client at any S3-compatible provider (R2, MinIO, ...) with no code change.
 * Unlike EmailService, failures here throw — a failed upload usually means
 * the caller's primary operation failed, not a best-effort side effect.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null | undefined;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.getClient() && this.getBucket());
  }

  async upload({
    key,
    body,
    contentType,
  }: UploadObjectParams): Promise<StorageObject> {
    const client = this.requireClient();
    const bucket = this.requireBucket();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ...(contentType ? { ContentType: contentType } : {}),
      }),
    );

    this.logger.log(`Uploaded object to S3: ${key}`);
    return { key };
  }

  async list(prefix?: string): Promise<ListedStorageObject[]> {
    const client = this.requireClient();
    const bucket = this.requireBucket();

    const objects: ListedStorageObject[] = [];
    let continuationToken: string | undefined;

    do {
      const page = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ...(prefix ? { Prefix: prefix } : {}),
          ...(continuationToken
            ? { ContinuationToken: continuationToken }
            : {}),
        }),
      );

      for (const object of page.Contents ?? []) {
        if (object.Key) {
          objects.push({
            key: object.Key,
            size: object.Size,
            lastModified: object.LastModified,
          });
        }
      }

      continuationToken = page.IsTruncated
        ? page.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return objects;
  }

  async delete(key: string): Promise<void> {
    const client = this.requireClient();
    const bucket = this.requireBucket();

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    this.logger.log(`Deleted object from S3: ${key}`);
  }

  getSignedDownloadUrl({ key, expiresInSeconds }: SignedUrlParams) {
    const client = this.requireClient();
    const bucket = this.requireBucket();

    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: expiresInSeconds ?? DEFAULT_SIGNED_URL_TTL_SECONDS },
    );
  }

  getSignedUploadUrl({ key, contentType, expiresInSeconds }: SignedUrlParams) {
    const client = this.requireClient();
    const bucket = this.requireBucket();

    return getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(contentType ? { ContentType: contentType } : {}),
      }),
      { expiresIn: expiresInSeconds ?? DEFAULT_SIGNED_URL_TTL_SECONDS },
    );
  }

  private getBucket(): string | null {
    return this.config.get<string>('AWS_S3_BUCKET') ?? null;
  }

  private requireBucket(): string {
    const bucket = this.getBucket();
    if (!bucket) {
      throw new StorageNotConfiguredError();
    }
    return bucket;
  }

  private getClient(): S3Client | null {
    if (this.client !== undefined) {
      return this.client;
    }

    const region = this.config.get<string>('AWS_REGION');
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const endpoint = this.config.get<string>('AWS_S3_ENDPOINT');

    if (!region || !accessKeyId || !secretAccessKey) {
      this.client = null;
      this.logger.warn(new StorageNotConfiguredError().message);
      return this.client;
    }

    this.client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });

    return this.client;
  }

  private requireClient(): S3Client {
    const client = this.getClient();
    if (!client) {
      throw new StorageNotConfiguredError();
    }
    return client;
  }
}

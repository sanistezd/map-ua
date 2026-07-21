/// <reference types="multer" />
import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Query,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { API_ERROR_CODES } from '@root/shared/api-error';
import type {
  StorageFileDto,
  StorageStatusDto,
  StorageTestResultDto,
} from '@root/shared/storage';

import { NonProductionGuard } from '@/common/guards/non-production.guard';

import { StorageService } from './storage.service';
import { StorageNotConfiguredError } from './storage-not-configured.error';

const TEST_UPLOADS_PREFIX = 'test-uploads/';

@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storage: StorageService) {}

  @Get('status')
  status(): StorageStatusDto {
    return { configured: this.storage.isConfigured() };
  }

  @Get('files')
  async files(): Promise<StorageFileDto[]> {
    try {
      const objects = await this.storage.list(TEST_UPLOADS_PREFIX);
      return await Promise.all(
        objects.map(async (object) => ({
          key: object.key,
          url: await this.storage.getSignedDownloadUrl({ key: object.key }),
          size: object.size,
          lastModifiedAt: object.lastModified?.toISOString(),
        })),
      );
    } catch (error) {
      if (error instanceof StorageNotConfiguredError) {
        throw new ServiceUnavailableException({
          code: API_ERROR_CODES.unavailable,
        });
      }
      throw error;
    }
  }

  @Delete('files')
  @UseGuards(NonProductionGuard)
  async deleteFile(@Query('key') key?: string): Promise<StorageTestResultDto> {
    if (!key || !key.startsWith(TEST_UPLOADS_PREFIX)) {
      throw new BadRequestException('A valid file key is required.');
    }

    try {
      await this.storage.delete(key);
      return { success: true, key };
    } catch (error) {
      if (error instanceof StorageNotConfiguredError) {
        return { success: false, error: error.message };
      }
      this.logger.error('Storage delete failed', error);
      return {
        success: false,
        error: 'Delete failed. Check server logs for details.',
      };
    }
  }

  @Post('test')
  @UseGuards(NonProductionGuard)
  @UseInterceptors(FileInterceptor('file'))
  async test(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<StorageTestResultDto> {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    const key = `${TEST_UPLOADS_PREFIX}${randomUUID()}-${file.originalname}`;

    try {
      await this.storage.upload({
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });
      return { success: true, key };
    } catch (error) {
      // Known, safe-to-surface error: it's our own text, not derived from
      // the SDK. Anything else is unexpected — log the real cause server-side
      // and hand the client a generic message instead of a raw SDK error
      // that could contain internal details (bucket policy, ARNs, ...).
      if (error instanceof StorageNotConfiguredError) {
        return { success: false, error: error.message };
      }
      this.logger.error('Storage test upload failed', error);
      return {
        success: false,
        error: 'Upload failed. Check server logs for details.',
      };
    }
  }
}

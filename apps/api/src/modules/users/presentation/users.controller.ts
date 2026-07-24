import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { API_ERROR_CODES } from '@root/shared/api-error';
import type { UserDto } from '@root/shared/user';

// removed createClient import
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthUser } from '../../auth/auth-user';
import { CurrentUser } from '../../auth/current-user.decorator';
import { StorageService } from '../../storage/storage.service';
import { UsersService } from '../application/users.service';
import type { User } from '../domain/user';
import { UserEmailTakenError } from '../domain/user-email-taken.error';
import { UserNotFoundError } from '../domain/user-not-found.error';
import { CreateUserRequest } from './create-user.request';
import { UpdateProfileRequest } from './update-profile.request';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  async findAll(): Promise<UserDto[]> {
    return (await this.users.findAll()).map(toDto);
  }

  @Post()
  async create(@Body() body: CreateUserRequest): Promise<UserDto> {
    try {
      return toDto(await this.users.create(body.email));
    } catch (error) {
      if (error instanceof UserEmailTakenError) {
        throw new ConflictException({
          code: API_ERROR_CODES.userEmailTaken,
        });
      }
      throw error;
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() currentUser: AuthUser): Promise<UserDto> {
    const user = await this.users.findById(currentUser.id);
    if (!user) {
      throw new NotFoundException({ code: API_ERROR_CODES.notFound });
    }
    return toDto(user);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(
    @CurrentUser() currentUser: AuthUser,
    @Body() body: UpdateProfileRequest,
  ): Promise<UserDto> {
    const user = await this.users.update(currentUser.id, body);
    if (!user) {
      throw new NotFoundException({ code: API_ERROR_CODES.notFound });
    }
    return toDto(user);
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMe(@CurrentUser() currentUser: AuthUser): Promise<void> {
    try {
      // 1. Delete from DB
      await this.users.delete(currentUser.id);

      // 2. Delete avatars from S3 (best-effort)
      try {
        if (this.storage.isConfigured()) {
          const avatars = await this.storage.list(`avatars/${currentUser.id}/`);
          for (const avatar of avatars) {
            await this.storage.delete(avatar.key);
          }
        }
      } catch (err) {
        this.logger.error('Failed to delete user avatars', err);
      }

      // 3. Delete from Supabase Auth
      const supabaseUrl = this.config.get<string>('SUPABASE_URL');
      const supabaseServiceKey = this.config.get<string>(
        'SUPABASE_SERVICE_ROLE_KEY',
      );

      if (supabaseUrl && supabaseServiceKey) {
        const response = await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${currentUser.id}`,
          {
            method: 'DELETE',
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
          },
        );
        if (!response.ok) {
          const body = await response.text();
          this.logger.error(`Failed to delete user from Supabase: ${body}`);
        }
      }
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException({ code: API_ERROR_CODES.notFound });
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      await this.users.delete(id);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException({ code: API_ERROR_CODES.notFound });
      }
      throw error;
    }
  }
}

function toDto(user: User): UserDto {
  return { ...user, createdAt: user.createdAt.toISOString() };
}

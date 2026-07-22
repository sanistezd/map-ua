import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { API_ERROR_CODES } from '@root/shared/api-error';
import type { UserDto } from '@root/shared/user';

import type { AuthUser } from '../../auth/auth-user';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthGuard } from '../../auth/auth.guard';
import { UsersService } from '../application/users.service';
import type { User } from '../domain/user';
import { UserEmailTakenError } from '../domain/user-email-taken.error';
import { UserNotFoundError } from '../domain/user-not-found.error';
import { CreateUserRequest } from './create-user.request';
import { UpdateProfileRequest } from './update-profile.request';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

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

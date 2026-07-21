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
  Post,
} from '@nestjs/common';
import { API_ERROR_CODES } from '@root/shared/api-error';
import type { UserDto } from '@root/shared/user';

import { UsersService } from '../application/users.service';
import type { User } from '../domain/user';
import { UserEmailTakenError } from '../domain/user-email-taken.error';
import { UserNotFoundError } from '../domain/user-not-found.error';
import { CreateUserRequest } from './create-user.request';

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

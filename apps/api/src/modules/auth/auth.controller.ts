import { Controller, Get, UseGuards } from '@nestjs/common';
import type { AuthUserDto } from '@root/shared/auth';

import { AuthGuard } from './auth.guard';
import type { AuthUser } from './auth-user';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser): AuthUserDto {
    return user;
  }
}

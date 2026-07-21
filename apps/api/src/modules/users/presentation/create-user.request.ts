import type { CreateUserDto } from '@root/shared/user';
import { IsEmail } from 'class-validator';

export class CreateUserRequest implements CreateUserDto {
  @IsEmail()
  email!: string;
}

import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileRequest {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @IsUrl()
  @IsOptional()
  @MaxLength(1024)
  avatarUrl?: string;
}

import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FULL_ACCOUNT_KEY = 'requireFullAccount';
export const RequireFullAccount = () => SetMetadata(REQUIRE_FULL_ACCOUNT_KEY, true);

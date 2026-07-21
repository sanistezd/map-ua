import type { HealthDto } from '@root/shared/health';

import { apiRequest } from '@/shared/api';

export const healthApi = {
  get: () => apiRequest<HealthDto>('/health', { cache: 'no-store' }),
};

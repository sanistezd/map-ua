import { Controller, Get } from '@nestjs/common';
import type { HealthDto } from '@root/shared/health';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthDto {
    return { status: 'ok' };
  }
}

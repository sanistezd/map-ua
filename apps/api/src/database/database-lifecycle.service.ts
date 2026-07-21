import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import type postgres from 'postgres';

import { SQL_CLIENT } from './database.constants';

@Injectable()
export class DatabaseLifecycleService implements OnApplicationShutdown {
  constructor(@Inject(SQL_CLIENT) private readonly sql: postgres.Sql) {}

  async onApplicationShutdown() {
    await this.sql.end({ timeout: 5 });
  }
}

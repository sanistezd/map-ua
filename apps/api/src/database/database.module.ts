import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { DATABASE, SQL_CLIENT } from './database.constants';
import { DatabaseLifecycleService } from './database-lifecycle.service';
import { DatabaseTransactionService } from './database-transaction.service';

@Global()
@Module({
  providers: [
    {
      provide: SQL_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        postgres(config.getOrThrow<string>('DATABASE_URL'), { prepare: false }),
    },
    {
      provide: DATABASE,
      inject: [SQL_CLIENT],
      useFactory: (client: postgres.Sql) => drizzle(client),
    },
    DatabaseLifecycleService,
    DatabaseTransactionService,
  ],
  exports: [DATABASE, DatabaseTransactionService],
})
export class DatabaseModule {}

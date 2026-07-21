import { Inject, Injectable } from '@nestjs/common';

import { DATABASE } from './database.constants';
import type { Database } from './database.types';

@Injectable()
export class DatabaseTransactionService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  run<T>(work: (transaction: Database) => Promise<T>): Promise<T> {
    return this.database.transaction((transaction) =>
      work(transaction as Database),
    );
  }
}

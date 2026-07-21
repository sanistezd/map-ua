import { describe, expect, it, vi } from 'vitest';

import type { Database } from './database.types';
import { DatabaseTransactionService } from './database-transaction.service';

describe('DatabaseTransactionService', () => {
  it('runs the work callback inside a database transaction and returns its result', async () => {
    const transactionClient = { tag: 'transaction-client' };
    const transaction = vi
      .fn()
      .mockImplementation((work: (tx: unknown) => Promise<unknown>) =>
        work(transactionClient),
      );
    const database = { transaction } as unknown as Database;
    const service = new DatabaseTransactionService(database);
    const work = vi.fn().mockResolvedValue('result');

    await expect(service.run(work)).resolves.toBe('result');
    expect(transaction).toHaveBeenCalledOnce();
    expect(work).toHaveBeenCalledExactlyOnceWith(transactionClient);
  });

  it('propagates a rejection from the work callback', async () => {
    const error = new Error('rolled back');
    const transaction = vi
      .fn()
      .mockImplementation((work: (tx: unknown) => Promise<unknown>) =>
        work({}),
      );
    const database = { transaction } as unknown as Database;
    const service = new DatabaseTransactionService(database);

    await expect(service.run(() => Promise.reject(error))).rejects.toBe(error);
  });
});

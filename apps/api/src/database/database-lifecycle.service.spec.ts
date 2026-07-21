import type postgres from 'postgres';
import { describe, expect, it, vi } from 'vitest';

import { DatabaseLifecycleService } from './database-lifecycle.service';

describe('DatabaseLifecycleService', () => {
  it('closes the SQL connection with a bounded timeout on shutdown', async () => {
    const end = vi.fn().mockResolvedValue(undefined);
    const sql = { end } as unknown as postgres.Sql;
    const service = new DatabaseLifecycleService(sql);

    await service.onApplicationShutdown();

    expect(end).toHaveBeenCalledExactlyOnceWith({ timeout: 5 });
  });
});

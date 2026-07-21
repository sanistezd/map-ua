import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { AppModule as AppModuleType } from '../src/app.module.js';

describe('health endpoint', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/postgres';
    process.env.WEB_URL = 'http://localhost:3000';
    const { AppModule } = (await import('../src/app.module.js')) as {
      AppModule: typeof AppModuleType;
    };
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app?.close());

  it('returns a healthy status', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/health')
      .expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

import { BullModule } from '@nestjs/bullmq';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const logger = new Logger('QueueModule');

/**
 * Extracted as a standalone function so the connection wiring — in
 * particular the `error` handler, which is what stops a downed Redis from
 * crashing the process via an unhandled EventEmitter error — can be unit
 * tested directly.
 */
export function createBullRootOptions(config: ConfigService) {
  const connection = new Redis(config.getOrThrow<string>('REDIS_URL'), {
    maxRetriesPerRequest: null,
  });
  connection.on('error', (error: Error) => {
    logger.warn(`Redis connection error: ${error.message}`);
  });
  return { connection };
}

/**
 * Shared BullMQ connection, provided globally like DatabaseModule. Queues
 * themselves are registered by the module that owns them (e.g. EmailModule
 * registers the "email" queue), not here.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createBullRootOptions,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

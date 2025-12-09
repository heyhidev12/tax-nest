import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly enabled = process.env.REDIS_ENABLED === 'true';

  constructor() {
    if (!this.enabled) {
      console.log('Redis disabled (REDIS_ENABLED=false)');
      return;
    }

    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB) || 0,
      retryStrategy: () => null, // avoid infinite retry
    });
  }

  async onModuleInit() {
    if (!this.enabled || !this.client) return;

    try {
      await this.client.ping();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection error:', error);
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  getClient(): Redis | null {
    return this.client;
  }

  // ---------------- SAFE METHODS -----------------

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.enabled || !this.client) return;
    if (ttlSeconds) await this.client.setex(key, ttlSeconds, value);
    else await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    if (!this.enabled || !this.client) return null;
    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.client) return;
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.enabled || !this.client) return false;
    return (await this.client.exists(key)) === 1;
  }

  async setPasswordResetToken(userId: number, token: string, ttlSeconds: number = 600): Promise<void> {
    await this.set(`password_reset:${token}`, userId.toString(), ttlSeconds);
  }

  async getPasswordResetToken(token: string): Promise<number | null> {
    const value = await this.get(`password_reset:${token}`);
    return value ? parseInt(value, 10) : null;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await this.del(`password_reset:${token}`);
  }
}

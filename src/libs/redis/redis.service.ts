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
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: 0, // Serverless Redis faqat DB 0 ni ishlatadi
      retryStrategy: () => null,
      connectTimeout: 5000,
      lazyConnect: true,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    });

  }

  async onModuleInit() {
    if (!this.enabled || !this.client) return;

    // Non-blocking Redis connection check
    this.client.ping()
      .then(() => console.log('✅ Redis connected successfully'))
      .catch(err => console.warn('⚠️  Redis connection failed (non-critical):', err.message));
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

  async keys(pattern: string): Promise<string[]> {
    if (!this.enabled || !this.client) return [];
    return await this.client.keys(pattern);
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

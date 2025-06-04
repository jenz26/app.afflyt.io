import { createClient, RedisClientType } from 'redis';

class RedisConfig {
  private client: RedisClientType | null = null;
  private fallbackCache: Map<string, { value: any; expiry: number }> = new Map();

  async connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD || undefined,
      });

      this.client.on('error', (err) => {
        console.warn('⚠️ Redis Client Error:', err);
        console.log('📦 Falling back to in-memory cache');
      });

      this.client.on('connect', () => {
        console.log('🔗 Redis client connected');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready');
      });

      await this.client.connect();
    } catch (error) {
      console.warn('⚠️ Redis connection failed, using fallback cache:', error);
      this.client = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.disconnect();
      console.log('🔌 Disconnected from Redis');
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (this.client?.isOpen) {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
          await this.client.setEx(key, ttlSeconds, serialized);
        } else {
          await this.client.set(key, serialized);
        }
      } else {
        // Fallback to in-memory cache
        const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : Infinity;
        this.fallbackCache.set(key, { value, expiry });
      }
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async get(key: string): Promise<any> {
    try {
      if (this.client?.isOpen) {
        const result = await this.client.get(key);
        return result ? JSON.parse(result) : null;
      } else {
        // Fallback to in-memory cache
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.value;
        } else if (cached) {
          this.fallbackCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.client?.isOpen) {
        await this.client.del(key);
      } else {
        this.fallbackCache.delete(key);
      }
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }
}

export const redis = new RedisConfig();
export default redis;
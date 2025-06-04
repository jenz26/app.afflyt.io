import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (req: Request) => string;

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
  }

  private defaultKeyGenerator(req: Request): string {
    return req.ip || 'unknown';
  }

  public middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const key = `rate_limit:${this.keyGenerator(req)}`;
        const now = Date.now();
        const windowStart = now - this.windowMs;

        // Get current count from Redis/fallback
        const currentCountStr = await redis.get(key);
        let requests: number[] = [];

        if (currentCountStr) {
          const stored = JSON.parse(currentCountStr);
          // Filter out requests outside the current window
          requests = stored.filter((timestamp: number) => timestamp > windowStart);
        }

        // Check if limit exceeded
        if (requests.length >= this.maxRequests) {
          const oldestRequest = Math.min(...requests);
          const resetTime = new Date(oldestRequest + this.windowMs);

          res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again after ${resetTime.toISOString()}`,
            retryAfter: Math.ceil((oldestRequest + this.windowMs - now) / 1000),
            limit: this.maxRequests,
            remaining: 0,
            resetTime: resetTime.toISOString(),
            timestamp: new Date().toISOString()
          });
          return;
        }

        // Add current request
        requests.push(now);

        // Store updated requests with TTL
        await redis.set(key, JSON.stringify(requests), Math.ceil(this.windowMs / 1000));

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', this.maxRequests - requests.length);
        res.setHeader('X-RateLimit-Reset', new Date(now + this.windowMs).toISOString());

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        // On error, allow request to proceed
        next();
      }
    };
  }
}

// Predefined rate limiters
export const createGeneralLimiter = (): RateLimiter => {
  return new RateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    keyGenerator: (req: Request) => req.ip || 'unknown'
  });
};

export const createAPILimiter = (): RateLimiter => {
  return new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    keyGenerator: (req: Request) => {
      const apiKey = req.headers['x-api-key'] as string;
      if (apiKey) return `api:${apiKey}`;
      return `ip:${req.ip || 'unknown'}`;
    }
  });
};

export const createAuthLimiter = (): RateLimiter => {
  return new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    keyGenerator: (req: Request) => `auth:${req.ip || 'unknown'}`
  });
};
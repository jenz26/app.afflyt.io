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

// ===== 🚀 NEW v1.8.1: CONDITIONAL RATE LIMITING =====

/**
 * Centralized rate limiting control based on environment variables
 * 
 * @param limiter - The RateLimiter instance to conditionally apply
 * @param options - Optional configuration for conditional behavior
 * @returns Express middleware that applies rate limiting only when enabled
 * 
 * Environment Variables:
 * - DISABLE_RATE_LIMIT: if 'true', disables all rate limiting
 * - NODE_ENV: if 'development', logs rate limiting status
 */
export const conditionalRateLimit = (
  limiter: RateLimiter, 
  options: { 
    name?: string, 
    force?: boolean 
  } = {}
) => {
  const isDisabled = process.env.DISABLE_RATE_LIMIT === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const limiterName = options.name || 'Unknown';
  const forceEnable = options.force === true;

  // Log rate limiting status in development
  if (isDevelopment) {
    const status = (isDisabled && !forceEnable) ? '❌ DISABLED' : '✅ ENABLED';
    console.log(`🛡️  Rate Limiter [${limiterName}]: ${status}`);
  }

  // Return pass-through middleware if disabled (unless forced)
  if (isDisabled && !forceEnable) {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Add headers to indicate rate limiting is disabled
      res.setHeader('X-RateLimit-Status', 'disabled');
      res.setHeader('X-RateLimit-Disabled-Reason', 'DISABLE_RATE_LIMIT=true');
      next();
    };
  }

  // Return the actual rate limiting middleware
  return limiter.middleware();
};

// ===== PREDEFINED RATE LIMITERS (Updated) =====

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

// ===== 🚀 NEW v1.8.1: CONDITIONAL LIMITER FACTORIES =====

/**
 * Creates a conditional general rate limiter
 * Usage: const limiter = createConditionalGeneralLimiter();
 *        router.use(limiter);
 */
export const createConditionalGeneralLimiter = () => {
  const limiter = createGeneralLimiter();
  return conditionalRateLimit(limiter, { name: 'General' });
};

/**
 * Creates a conditional API rate limiter
 * Usage: const limiter = createConditionalAPILimiter();
 *        router.post('/api', limiter, controller.method);
 */
export const createConditionalAPILimiter = () => {
  const limiter = createAPILimiter();
  return conditionalRateLimit(limiter, { name: 'API' });
};

/**
 * Creates a conditional auth rate limiter
 * Usage: const limiter = createConditionalAuthLimiter();
 *        router.post('/login', limiter, controller.login);
 */
export const createConditionalAuthLimiter = () => {
  const limiter = createAuthLimiter();
  return conditionalRateLimit(limiter, { name: 'Auth' });
};

/**
 * Creates a conditional limiter that's always enabled (ignores DISABLE_RATE_LIMIT)
 * Use for critical endpoints that should always have rate limiting
 * Usage: const limiter = createForcedAuthLimiter();
 */
export const createForcedAuthLimiter = () => {
  const limiter = createAuthLimiter();
  return conditionalRateLimit(limiter, { name: 'Auth (Forced)', force: true });
};
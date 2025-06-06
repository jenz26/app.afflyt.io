import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations
import database from './config/database';
import redis from './config/redis';
import { logger, httpLogger, logUtils } from './config/logger';
import { 
  helmetConfig, 
  additionalSecurityHeaders, 
  securityMonitoring,
  cspReportHandler 
} from './config/security';
import { sanitize } from './middleware/validation';
import { Models } from './models';
import { createRoutes, createAPIRoutes, createPublicRoutes } from './routes';
import { createConditionalGeneralLimiter } from './middleware/rateLimiter';

// Types for error handling
interface ApiError extends Error {
  statusCode?: number;
  status?: string;
}

class App {
  public app: Application;
  private models: Models | null = null;

  constructor() {
    this.app = express();
    logUtils.app.starting();
    this.initializeMiddlewares();
  }

  private initializeMiddlewares(): void {
    // ===== 🔒 NEW v1.8.5: ENHANCED SECURITY MIDDLEWARE =====
    // Advanced security headers with Content Security Policy
    this.app.use(helmetConfig);
    this.app.use(additionalSecurityHeaders());
    this.app.use(securityMonitoring());
    logger.info('Enhanced security middleware (Helmet + CSP) initialized');

    // CORS configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    this.app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'limit', 'groupby', 'startdate', 'enddate'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
    }));
    logger.debug({ allowedOrigins }, 'CORS middleware initialized');

    // ===== 🚀 NEW v1.8.4: STRUCTURED LOGGING WITH PINO =====
    // Replace morgan with pino-http for better structured logging
    this.app.use(httpLogger);
    logger.info('HTTP logging middleware (Pino) initialized');

    // ===== 🔒 NEW v1.8.5: INPUT SANITIZATION =====
    // Sanitize all incoming data before processing
    this.app.use(sanitize());
    logger.debug('Input sanitization middleware initialized');

    // Body parsing with security limits
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true, // Only accept arrays and objects
      type: ['application/json', 'application/csp-report'] // CSP reports
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb',
      parameterLimit: 1000 // Prevent parameter pollution
    }));
    logger.debug('Body parsing middleware initialized with security limits');

    // ===== 🚀 v1.8.1: CONDITIONAL GLOBAL RATE LIMITING =====
    // General rate limiting - conditionally applied based on DISABLE_RATE_LIMIT
    const globalRateLimiter = createConditionalGeneralLimiter();
    this.app.use(globalRateLimiter);
    
    // Log rate limiting status with structured logging
    const rateLimitingEnabled = process.env.DISABLE_RATE_LIMIT !== 'true';
    logUtils.rateLimit.status(rateLimitingEnabled);
  }

  private initializeRoutes(): void {
    if (!this.models) {
      logger.error('Models not initialized. Call initializeDatabase() first.');
      throw new Error('Models not initialized. Call initializeDatabase() first.');
    }

    // Health check endpoint (exempt from rate limiting)
    this.app.get('/health', (req: Request, res: Response) => {
      const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.API_VERSION || 'v1.8.5',
        services: {
          database: 'connected',
          redis: 'connected'
        },
        security: {
          helmet: 'enabled',
          csp: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled',
          inputValidation: 'enabled',
          sanitization: 'enabled'
        },
        rateLimiting: {
          enabled: process.env.DISABLE_RATE_LIMIT !== 'true',
          globalLimiter: 'conditional'
        }
      };
      
      logger.debug('Health check requested');
      res.status(200).json(healthData);
    });

    // ===== 🔒 NEW v1.8.5: CSP VIOLATION REPORTING =====
    // Endpoint for Content Security Policy violation reports
    this.app.post('/api/security/csp-report', express.json({ type: 'application/csp-report' }), cspReportHandler());
    logger.debug('CSP violation reporting endpoint initialized');

    // Public routes (redirects and tracking)
    this.app.use('/', createPublicRoutes(this.models));
    logger.debug('Public routes initialized');

    // Legacy API routes (v1.2.0 - manteniamo per compatibilità)
    this.app.use('/api/v1', createRoutes(this.models));
    logger.debug('Legacy API routes (v1.2.0) initialized');

    // New API routes (v1.3.0 - nuova struttura)
    this.app.use('/api', createAPIRoutes(this.models));
    logger.debug('New API routes (v1.3.0+) initialized');

    // API info endpoint (updated for v1.8.5)
    this.app.get('/api/v1', (req: Request, res: Response) => {
      const apiInfo = {
        message: 'Afflyt.io API v1.8.5',
        status: 'active',
        timestamp: new Date().toISOString(),
        endpoints: {
          // Legacy endpoints (v1.2.0)
          auth: '/api/v1/auth',
          links: '/api/v1/links',
          
          // New endpoints (v1.3.0)
          user: '/api/user',
          userProfile: '/api/user/me',
          apiKeys: '/api/user/keys',
          dashboardLayout: '/api/user/dashboard-layout',
          analytics: '/api/user/analytics',
          conversions: '/api/user/conversions',
          
          // Public endpoints
          redirects: '/r/{hash}',
          tracking: '/track/conversion'
        },
        documentation: '/docs', // Future Swagger endpoint
        version: {
          current: 'v1.8.5',
          description: 'Input Validation & Security Hardening',
          changes: [
            'Implemented centralized input validation with Zod schemas',
            'Added comprehensive request sanitization middleware',
            'Enhanced Content Security Policy with environment-specific rules',
            'Strengthened security headers and monitoring',
            'Added CSP violation reporting endpoint',
            'Improved error handling for validation failures'
          ]
        },
        security: {
          inputValidation: 'zod-based schemas',
          sanitization: 'enabled',
          csp: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled',
          headers: 'enhanced helmet configuration',
          monitoring: 'suspicious request detection'
        },
        rateLimiting: {
          enabled: process.env.DISABLE_RATE_LIMIT !== 'true',
          global: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
          }
        },
        logging: {
          level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
          structured: true,
          format: process.env.NODE_ENV === 'development' ? 'pretty' : 'json'
        }
      };

      logger.debug('API info requested');
      res.status(200).json(apiInfo);
    });
    
    // Debug: Print all registered routes (only in development)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Registered routes:');
      this.app._router.stack.forEach((layer: any) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          logger.debug(`  ${methods} ${layer.route.path}`);
        }
      });
    }

    // Future: Swagger documentation endpoint
    this.app.get('/docs', (req: Request, res: Response) => {
      logger.debug('Documentation endpoint requested');
      res.status(200).json({
        message: 'API Documentation coming soon',
        swagger: 'Not implemented yet',
        endpoints: '/api/v1' // Redirect to API info for now
      });
    });

    // 404 handler
    this.app.all('*', (req: Request, res: Response) => {
      logger.warn({ method: req.method, url: req.originalUrl, ip: req.ip }, 'Route not found');
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        suggestion: 'Check /api/v1 for available endpoints'
      });
    });

    // Global error handler
    this.initializeErrorHandling();
  }

  private initializeErrorHandling(): void {
    // Global error handler with structured logging
    this.app.use((error: ApiError, req: Request, res: Response, next: NextFunction) => {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';

      // Log error with context
      const errorContext = {
        statusCode,
        message,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: {
          name: error.name,
          stack: error.stack
        }
      };

      if (statusCode >= 500) {
        logger.error(errorContext, 'Internal server error');
      } else {
        logger.warn(errorContext, 'Client error');
      }

      res.status(statusCode).json({
        error: {
          status: statusCode,
          message: message,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        },
        timestamp: new Date().toISOString()
      });
    });

    logger.debug('Global error handling initialized');
  }

  public async initializeDatabase(): Promise<void> {
    try {
      await database.connect();
      await redis.connect();
      
      // Initialize models after database connection
      this.models = new Models(database.getDb());
      
      // Initialize routes after models are ready
      this.initializeRoutes();
      
      // Log successful initialization with structured data
      logger.info({
        models: ['User', 'AffiliateLink', 'Click', 'UserSetting', 'Conversion'],
        routes: ['Legacy API (v1.2.0)', 'New API (v1.3.0+)', 'Public Routes'],
        security: {
          helmet: 'enabled',
          csp: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled',
          inputValidation: 'enabled',
          sanitization: 'enabled'
        },
        rateLimiting: process.env.DISABLE_RATE_LIMIT !== 'true' ? 'enabled' : 'disabled',
        version: 'v1.8.5'
      }, 'Application initialized successfully');
      
    } catch (error) {
      logUtils.app.error(error, 'Database initialization failed');
      throw error;
    }
  }

  public async closeDatabase(): Promise<void> {
    try {
      await database.disconnect();
      await redis.disconnect();
      logger.info('Database connections closed successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to close database connections');
    }
  }
}

export default App;
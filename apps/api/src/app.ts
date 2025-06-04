import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations
import database from './config/database';
import redis from './config/redis';
import { Models } from './models';
import { createRoutes, createAPIRoutes, createPublicRoutes } from './routes';
import { createGeneralLimiter } from './middleware/rateLimiter';

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
    this.initializeMiddlewares();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    this.app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // Logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // General rate limiting
    //const generalLimiter = createGeneralLimiter();
    //this.app.use(generalLimiter.middleware());
  }

  private initializeRoutes(): void {
    if (!this.models) {
      throw new Error('Models not initialized. Call initializeDatabase() first.');
    }

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.API_VERSION || 'v1',
        services: {
          database: 'connected',
          redis: 'connected'
        }
      });
    });

    // Public routes (redirects and tracking)
    this.app.use('/', createPublicRoutes(this.models));

    // Legacy API routes (v1.2.0 - manteniamo per compatibilità)
    this.app.use('/api/v1', createRoutes(this.models));

    // New API routes (v1.3.0 - nuova struttura)
    this.app.use('/api', createAPIRoutes(this.models));

    // API info endpoint (updated)
    this.app.get('/api/v1', (req: Request, res: Response) => {
      res.status(200).json({
        message: 'Afflyt.io API v1.3.0',
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
          current: 'v1.3.0',
          description: 'Backend API Completo MVP (Dashboard & Analytics)'
        }
      });
    });
    // Debug: Print all registered routes
if (process.env.NODE_ENV === 'development') {
  console.log('🛣️  Registered routes:');
  this.app._router.stack.forEach((layer: any) => {
    if (layer.route) {
      console.log(`  ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
    }
  });
}

    // Future: Swagger documentation endpoint
    this.app.get('/docs', (req: Request, res: Response) => {
      res.status(200).json({
        message: 'API Documentation coming soon',
        swagger: 'Not implemented yet',
        endpoints: '/api/v1' // Redirect to API info for now
      });
    });

    // 404 handler
    this.app.all('*', (req: Request, res: Response) => {
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
    // Global error handler
    this.app.use((error: ApiError, req: Request, res: Response, next: NextFunction) => {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';

      console.error(`Error ${statusCode}: ${message}`);
      console.error(error.stack);

      res.status(statusCode).json({
        error: {
          status: statusCode,
          message: message,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        },
        timestamp: new Date().toISOString()
      });
    });
  }

  public async initializeDatabase(): Promise<void> {
    try {
      await database.connect();
      await redis.connect();
      
      // Initialize models after database connection
      this.models = new Models(database.getDb());
      
      // Initialize routes after models are ready
      this.initializeRoutes();
      
      console.log('✅ Application initialized successfully');
      console.log('📊 Models loaded: User, AffiliateLink, Click, UserSetting, Conversion');
      console.log('🛣️  Routes configured: Legacy API (v1.2.0) + New API (v1.3.0)');
    } catch (error) {
      console.error('Failed to initialize database connections:', error);
      throw error;
    }
  }

  public async closeDatabase(): Promise<void> {
    try {
      await database.disconnect();
      await redis.disconnect();
    } catch (error) {
      console.error('Failed to close database connections:', error);
    }
  }
}

export default App;
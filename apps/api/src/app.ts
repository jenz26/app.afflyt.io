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
import { createRoutes, createPublicRoutes } from './routes';
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
    const generalLimiter = createGeneralLimiter();
    this.app.use(generalLimiter.middleware());
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

    // Public routes (redirects)
    this.app.use('/', createPublicRoutes(this.models));

    // API routes
    this.app.use('/api/v1', createRoutes(this.models));

    // API info endpoint
    this.app.get('/api/v1', (req: Request, res: Response) => {
      res.status(200).json({
        message: 'Afflyt.io API v1',
        status: 'active',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: '/api/v1/auth',
          links: '/api/v1/links',
          redirects: '/r/{hash}'
        },
        documentation: '/api/v1/docs' // Future Swagger endpoint
      });
    });

    // 404 handler
    this.app.all('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
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
import App from './app';
import { logger, logUtils } from './config/logger';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Create app instance
    const appInstance = new App();
    
    // Initialize database connections
    await appInstance.initializeDatabase();
    
    // Start the server
    const server = appInstance.app.listen(PORT, () => {
      // Use structured logging for server startup
      logUtils.app.started(Number(PORT), process.env.NODE_ENV || 'development');
      
      logger.info({
        port: Number(PORT),
        environment: process.env.NODE_ENV || 'development',
        apiVersion: process.env.API_VERSION || 'v1.8.4',
        healthCheck: `http://localhost:${PORT}/health`,
        apiInfo: `http://localhost:${PORT}/api/v1`,
        nodeVersion: process.version,
        platform: process.platform,
        processId: process.pid
      }, 'Afflyt.io API Server started successfully');
    });

    // Graceful shutdown with structured logging
    const gracefulShutdown = async (signal: string) => {
      logUtils.app.stopping(signal);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await appInstance.closeDatabase();
          logUtils.app.stopped();
          process.exit(0);
        } catch (error) {
          logUtils.app.error(error, 'Graceful shutdown failed');
          process.exit(1);
        }
      });

      // Force exit after timeout
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000); // 10 second timeout
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught exception occurred');
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal({ reason, promise }, 'Unhandled promise rejection');
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logUtils.app.error(error, 'Server startup failed');
    process.exit(1);
  }
}

// Start the server
startServer();
import App from './app';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Create app instance
    const appInstance = new App();
    
    // Initialize database connections
    await appInstance.initializeDatabase();
    
    // Start the server
    const server = appInstance.app.listen(PORT, () => {
      console.log('🚀 Afflyt.io API Server started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📋 API Version: ${process.env.API_VERSION || 'v1'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          await appInstance.closeDatabase();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
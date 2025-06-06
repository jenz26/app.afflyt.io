import { MongoClient, Db } from 'mongodb';

// We'll import logger dynamically to avoid circular dependency
let logUtils: any = null;
let dbLogger: any = null;

// Dynamic import function
async function initLogger() {
  if (!logUtils) {
    try {
      const { logUtils: lu, createModuleLogger } = await import('./logger');
      logUtils = lu;
      dbLogger = createModuleLogger('database');
    } catch (error) {
      // Logger not available, will use console fallback
      console.debug('Logger not yet available, using console fallback');
    }
  }
}

class Database {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private loggerInitialized = false;

  private async ensureLogger() {
    if (!this.loggerInitialized) {
      await initLogger();
      this.loggerInitialized = true;
    }
  }

  async connect(): Promise<void> {
    await this.ensureLogger();
    
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afflyt_dev';
      const dbName = process.env.MONGODB_DB_NAME || 'afflyt_dev';

      // Use logger if available, otherwise console
      if (dbLogger) {
        dbLogger.debug({ uri: uri.replace(/\/\/.*@/, '//***:***@'), dbName }, 'Attempting database connection');
      } else {
        console.log(`Attempting to connect to database: ${dbName}`);
      }

      this.client = new MongoClient(uri);
      await this.client.connect();
      
      this.db = this.client.db(dbName);
      
      // Test the connection
      await this.db.admin().ping();
      
      if (logUtils) {
        logUtils.database.connected(dbName);
      } else {
        console.log(`✅ Connected to MongoDB: ${dbName}`);
      }
      
      // Log database info
      if (dbLogger) {
        try {
          const collections = await this.db.listCollections().toArray();
          const serverStatus = await this.db.admin().serverStatus().catch(() => null);
          
          dbLogger.info({
            dbName,
            collections: collections.map((c: any) => c.name),
            serverInfo: serverStatus ? {
              version: (serverStatus as any).version || 'unknown',
              uptime: (serverStatus as any).uptime || 'unknown',
              connections: (serverStatus as any).connections || 'unknown'
            } : { info: 'Limited access to server status' }
          }, 'Database connection established');
        } catch (infoError) {
          dbLogger.debug('Could not retrieve detailed database info');
        }
      } else {
        try {
          const collections = await this.db.listCollections().toArray();
          console.log(`📊 Available collections: ${collections.map((c: any) => c.name).join(', ')}`);
        } catch (infoError) {
          console.log('📊 Could not retrieve collection information');
        }
      }
      
    } catch (error) {
      if (logUtils) {
        logUtils.database.error('connect', error);
      } else {
        console.error('❌ MongoDB connection error:', error);
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.ensureLogger();
    
    try {
      if (this.client) {
        await this.client.close();
        if (logUtils) {
          logUtils.database.disconnected();
        } else {
          console.log('🔌 Disconnected from MongoDB');
        }
        if (dbLogger) {
          dbLogger.debug('Database client closed');
        }
      }
    } catch (error) {
      if (logUtils) {
        logUtils.database.error('disconnect', error);
      } else {
        console.error('Failed to disconnect from MongoDB:', error);
      }
      throw error;
    }
  }

  getDb(): Db {
    if (!this.db) {
      const error = new Error('Database not connected. Call connect() first.');
      if (dbLogger) {
        dbLogger.error({ error }, 'Attempted to access database before connection');
      } else {
        console.error('Database not connected. Call connect() first.');
      }
      throw error;
    }
    return this.db;
  }

  getClient(): MongoClient {
    if (!this.client) {
      const error = new Error('Database client not available. Call connect() first.');
      if (dbLogger) {
        dbLogger.error({ error }, 'Attempted to access client before connection');
      } else {
        console.error('Database client not available. Call connect() first.');
      }
      throw error;
    }
    return this.client;
  }

  // Helper method to log slow queries
  async logQuery(collection: string, operation: string, duration: number, filter?: any): Promise<void> {
    await this.ensureLogger();
    
    const logData = {
      collection,
      operation,
      duration,
      ...(filter && { filter: JSON.stringify(filter) })
    };

    if (logUtils) {
      logUtils.database.query(collection, operation, duration);
    }
    
    // Warn about slow queries (threshold: 1000ms)
    if (duration > 1000) {
      if (dbLogger) {
        dbLogger.warn(logData, 'Slow database query detected');
      } else {
        console.warn(`⚠️  Slow query detected: ${collection}.${operation} took ${duration}ms`);
      }
    } else {
      if (dbLogger) {
        dbLogger.debug(logData, 'Database query completed');
      } else if (process.env.NODE_ENV === 'development') {
        console.debug(`🔍 Query: ${collection}.${operation} (${duration}ms)`);
      }
    }
  }

  // Wrapper method for monitoring collection operations
  async monitoredOperation<T>(
    collection: string, 
    operation: string, 
    callback: () => Promise<T>
  ): Promise<T> {
    await this.ensureLogger();
    
    const startTime = Date.now();
    try {
      const result = await callback();
      const duration = Date.now() - startTime;
      await this.logQuery(collection, operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (logUtils) {
        logUtils.database.error(`${collection}.${operation}`, error);
      }
      if (dbLogger) {
        dbLogger.error({
          collection,
          operation,
          duration,
          error
        }, 'Database operation failed');
      } else {
        console.error(`❌ Database operation failed: ${collection}.${operation} (${duration}ms)`, error);
      }
      throw error;
    }
  }
}

export const database = new Database();
export default database;
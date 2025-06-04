import { MongoClient, Db } from 'mongodb';

class Database {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afflyt_dev';
      const dbName = process.env.MONGODB_DB_NAME || 'afflyt_dev';

      this.client = new MongoClient(uri);
      await this.client.connect();
      
      this.db = this.client.db(dbName);
      
      console.log(`✅ Connected to MongoDB: ${dbName}`);
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getClient(): MongoClient {
    if (!this.client) {
      throw new Error('Database client not available. Call connect() first.');
    }
    return this.client;
  }
}

export const database = new Database();
export default database;
import { Collection, Db, ObjectId } from 'mongodb';
import { User, ApiKey } from '../types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class UserModel {
  private collection: Collection<User>;

  constructor(db: Db) {
    this.collection = db.collection<User>('users');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ email: 1 }, { unique: true });
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ 'apiKeys.id': 1 });
      console.log('✅ User indexes created');
    } catch (error) {
      console.error('❌ Error creating user indexes:', error);
    }
  }

  async create(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'apiKeys' | 'balance'>): Promise<User> {
    const now = new Date();
    const user: User = {
      ...userData,
      balance: 0,
      apiKeys: [],
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
  const result = await this.collection.updateOne(
    { id: userId },
    { 
      $pull: { apiKeys: { id: keyId } },
      $set: { updatedAt: new Date() }
    }
  );

  return result.modifiedCount > 0;
}

  async findById(id: string): Promise<User | null> {
    return await this.collection.findOne({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.collection.findOne({ email });
  }

  async updateById(id: string, updates: Partial<User>): Promise<User | null> {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async generateApiKey(userId: string, name: string): Promise<ApiKey> {
    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      name,
      keyHash: crypto.randomBytes(32).toString('hex'),
      isActive: true,
      createdAt: new Date()
    };

    await this.collection.updateOne(
      { id: userId },
      { 
        $push: { apiKeys: apiKey },
        $set: { updatedAt: new Date() }
      }
    );

    return apiKey;
  }

  async findByApiKey(apiKeyHash: string): Promise<{ user: User; apiKey: ApiKey } | null> {
    const user = await this.collection.findOne({
      'apiKeys.keyHash': apiKeyHash,
      'apiKeys.isActive': true
    });

    if (!user) return null;

    const apiKey = user.apiKeys.find(key => key.keyHash === apiKeyHash && key.isActive);
    if (!apiKey) return null;

    // Update last used
    await this.collection.updateOne(
      { id: user.id, 'apiKeys.id': apiKey.id },
      { 
        $set: { 
          'apiKeys.$.lastUsedAt': new Date(),
          updatedAt: new Date()
        }
      }
    );

    return { user, apiKey };
  }
}
import { Collection, Db, ObjectId } from 'mongodb';
import { AffiliateLink } from '../types';
import crypto from 'crypto';

export class AffiliateLinkModel {
  private collection: Collection<AffiliateLink>;

  constructor(db: Db) {
    this.collection = db.collection<AffiliateLink>('affiliate_links');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ hash: 1 }, { unique: true });
      await this.collection.createIndex({ userId: 1 });
      await this.collection.createIndex({ isActive: 1 });
      await this.collection.createIndex({ createdAt: -1 });
      console.log('✅ AffiliateLink indexes created');
    } catch (error) {
      console.error('❌ Error creating affiliate link indexes:', error);
    }
  }

  async create(linkData: Omit<AffiliateLink, '_id' | 'hash' | 'createdAt' | 'updatedAt' | 'clickCount' | 'uniqueClickCount' | 'conversionCount' | 'totalRevenue' | 'isActive'>): Promise<AffiliateLink> {

    const now = new Date();
    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const hash = this.generateHash();
        
        const affiliateLink: AffiliateLink = {
          ...linkData,
          hash,
          isActive: true,
          clickCount: 0,
          uniqueClickCount: 0,
          conversionCount: 0,
          totalRevenue: 0,
          createdAt: now,
          updatedAt: now
        };

        const result = await this.collection.insertOne(affiliateLink);
        return { ...affiliateLink, _id: result.insertedId };
        
      } catch (error: any) {
        // Gestisce specificamente l'errore di chiave duplicata di MongoDB
        if (error.code === 11000 && error.keyPattern?.hash) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(`Failed to generate unique hash after ${maxRetries} attempts`);
          }
          // Log per monitoraggio delle collisioni
          console.warn(`🔄 Hash collision detected, retrying... (attempt ${attempt}/${maxRetries})`);
          continue;
        }
        
        // Re-lancia altri errori non correlati alle collisioni
        throw error;
      }
    }
    
    // Questo punto non dovrebbe mai essere raggiunto, ma per sicurezza TypeScript
    throw new Error('Unexpected error in hash generation process');
  }

  async findByHash(hash: string): Promise<AffiliateLink | null> {
    return await this.collection.findOne({ hash, isActive: true });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<AffiliateLink[]> {
    return await this.collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async updateStats(hash: string, updates: Partial<Pick<AffiliateLink, 'clickCount' | 'uniqueClickCount' | 'conversionCount' | 'totalRevenue'>>): Promise<void> {
    await this.collection.updateOne(
      { hash },
      { 
        $inc: updates,
        $set: { updatedAt: new Date() }
      }
    );
  }

  async getRecentLinks(userId: string, limit = 10): Promise<AffiliateLink[]> {
    return await this.collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getTopPerformingLinks(userId: string, limit = 10): Promise<AffiliateLink[]> {
    return await this.collection
      .find({ userId })
      .sort({ totalRevenue: -1, clickCount: -1 })
      .limit(limit)
      .toArray();
  }

  private generateHash(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getUserStats(userId: string): Promise<{
    totalLinks: number;
    totalClicks: number;
    totalUniqueClicks: number;
    totalConversions: number;
    totalRevenue: number;
  }> {
    const pipeline = [
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalLinks: { $sum: 1 },
          totalClicks: { $sum: '$clickCount' },
          totalUniqueClicks: { $sum: '$uniqueClickCount' },
          totalConversions: { $sum: '$conversionCount' },
          totalRevenue: { $sum: '$totalRevenue' }
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    
    if (result.length === 0) {
      return {
        totalLinks: 0,
        totalClicks: 0,
        totalUniqueClicks: 0,
        totalConversions: 0,
        totalRevenue: 0
      };
    }

    const stats = result[0] as any;
    return {
      totalLinks: stats.totalLinks || 0,
      totalClicks: stats.totalClicks || 0,
      totalUniqueClicks: stats.totalUniqueClicks || 0,
      totalConversions: stats.totalConversions || 0,
      totalRevenue: stats.totalRevenue || 0
    };
  }
}
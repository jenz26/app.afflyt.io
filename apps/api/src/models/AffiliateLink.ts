import { Collection, Db, ObjectId } from 'mongodb';
import { AffiliateLink } from '../types';
import { logUtils, createModuleLogger } from '../config/logger';
import { database } from '../config/database';
import crypto from 'crypto';

// Create module-specific logger
const affiliateLinkLogger = createModuleLogger('affiliate-link');

export class AffiliateLinkModel {
  private collection: Collection<AffiliateLink>;

  constructor(db: Db) {
    this.collection = db.collection<AffiliateLink>('affiliate_links');
    affiliateLinkLogger.debug('AffiliateLinkModel initialized');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.collection.createIndex({ hash: 1 }, { unique: true }),
        this.collection.createIndex({ userId: 1 }),
        this.collection.createIndex({ isActive: 1 }),
        this.collection.createIndex({ createdAt: -1 })
      ]);
      
      const duration = Date.now() - startTime;
      affiliateLinkLogger.info({ 
        duration,
        indexes: ['hash (unique)', 'userId', 'isActive', 'createdAt'] 
      }, 'AffiliateLink indexes created successfully');
      
      // Log performance if slow
      logUtils.performance.slowQuery('createIndexes', duration, 2000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      affiliateLinkLogger.error({ 
        error,
        duration,
        collection: 'affiliate_links'
      }, 'Failed to create affiliate link indexes');
      
      logUtils.database.error('createIndexes', error);
      throw error;
    }
  }

  async create(linkData: Omit<AffiliateLink, '_id' | 'hash' | 'createdAt' | 'updatedAt' | 'clickCount' | 'uniqueClickCount' | 'conversionCount' | 'totalRevenue' | 'isActive'>): Promise<AffiliateLink> {
    const startTime = Date.now();
    const now = new Date();
    const maxRetries = 5;
    let attempt = 0;
    let generatedHashes: string[] = [];

    affiliateLinkLogger.info({ 
      userId: linkData.userId,
      originalUrl: linkData.originalUrl,
      maxRetries 
    }, 'Creating affiliate link');

    return await database.monitoredOperation('affiliate_links', 'create', async () => {
      while (attempt < maxRetries) {
        try {
          const hash = this.generateHash();
          generatedHashes.push(hash);
          
          affiliateLinkLogger.debug({ 
            attempt: attempt + 1,
            hash,
            userId: linkData.userId 
          }, 'Attempting to create link with hash');
          
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
          const createdLink = { ...affiliateLink, _id: result.insertedId };
          
          // Log successful creation
          const duration = Date.now() - startTime;
          logUtils.affiliate.linkCreated(linkData.userId, createdLink._id?.toString() || 'unknown', linkData.originalUrl);
          
          affiliateLinkLogger.info({ 
            linkId: createdLink._id?.toString(),
            hash: createdLink.hash,
            userId: linkData.userId,
            originalUrl: linkData.originalUrl,
            attempts: attempt + 1,
            duration,
            generatedHashes: generatedHashes.length > 1 ? generatedHashes : undefined
          }, 'Affiliate link created successfully');
          
          return createdLink;
          
        } catch (error: any) {
          // Handle MongoDB duplicate key error specifically
          if (error.code === 11000 && error.keyPattern?.hash) {
            attempt++;
            
            // Log hash collision
            affiliateLinkLogger.warn({ 
              attempt,
              maxRetries,
              hash: generatedHashes[generatedHashes.length - 1],
              userId: linkData.userId,
              error: error.message
            }, 'Hash collision detected, retrying...');
            
            if (attempt >= maxRetries) {
              const duration = Date.now() - startTime;
              
              affiliateLinkLogger.error({ 
                maxRetries,
                attempts: attempt,
                generatedHashes,
                userId: linkData.userId,
                originalUrl: linkData.originalUrl,
                duration,
                finalError: error.message
              }, 'Failed to generate unique hash after maximum attempts');
              
              logUtils.database.error('createAffiliateLinkHashGeneration', error);
              throw new Error(`Failed to generate unique hash after ${maxRetries} attempts`);
            }
            
            continue;
          }
          
          // Log and re-throw other errors
          const duration = Date.now() - startTime;
          affiliateLinkLogger.error({ 
            error,
            userId: linkData.userId,
            originalUrl: linkData.originalUrl,
            attempt: attempt + 1,
            duration
          }, 'Unexpected error during affiliate link creation');
          
          logUtils.database.error('createAffiliateLink', error);
          throw error;
        }
      }
      
      // This should never be reached, but TypeScript safety
      throw new Error('Unexpected error in hash generation process');
    });
  }

  async findByHash(hash: string): Promise<AffiliateLink | null> {
    affiliateLinkLogger.debug({ hash }, 'Finding affiliate link by hash');
    
    return await database.monitoredOperation('affiliate_links', 'findByHash', async () => {
      const link = await this.collection.findOne({ hash, isActive: true });
      
      affiliateLinkLogger.debug({ 
        hash, 
        found: !!link,
        linkId: link?._id?.toString(),
        userId: link?.userId
      }, 'Find by hash completed');
      
      return link;
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<AffiliateLink[]> {
    affiliateLinkLogger.debug({ userId, limit, offset }, 'Finding affiliate links by user');
    
    return await database.monitoredOperation('affiliate_links', 'findByUserId', async () => {
      const links = await this.collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();
      
      affiliateLinkLogger.debug({ 
        userId, 
        limit, 
        offset, 
        found: links.length 
      }, 'Find by user ID completed');
      
      return links;
    });
  }

  async updateStats(hash: string, updates: Partial<Pick<AffiliateLink, 'clickCount' | 'uniqueClickCount' | 'conversionCount' | 'totalRevenue'>>): Promise<void> {
    affiliateLinkLogger.debug({ hash, updates }, 'Updating affiliate link stats');
    
    return await database.monitoredOperation('affiliate_links', 'updateStats', async () => {
      const result = await this.collection.updateOne(
        { hash },
        { 
          $inc: updates,
          $set: { updatedAt: new Date() }
        }
      );
      
      if (result.modifiedCount === 0) {
        affiliateLinkLogger.warn({ hash, updates }, 'Stats update found no matching document');
      } else {
        affiliateLinkLogger.info({ 
          hash, 
          updates, 
          modifiedCount: result.modifiedCount 
        }, 'Affiliate link stats updated successfully');
        
        // Log specific stat types for analytics
        if (updates.clickCount) {
          logUtils.affiliate.linkClicked(hash, 'unknown'); // IP would come from caller
        }
        if (updates.conversionCount && updates.totalRevenue) {
          logUtils.affiliate.conversionTracked(hash, updates.totalRevenue, 'EUR');
        }
      }
    });
  }

  async getRecentLinks(userId: string, limit = 10): Promise<AffiliateLink[]> {
    affiliateLinkLogger.debug({ userId, limit }, 'Getting recent affiliate links');
    
    return await database.monitoredOperation('affiliate_links', 'getRecentLinks', async () => {
      const links = await this.collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      affiliateLinkLogger.debug({ 
        userId, 
        limit, 
        found: links.length 
      }, 'Recent links query completed');
      
      return links;
    });
  }

  async getTopPerformingLinks(userId: string, limit = 10): Promise<AffiliateLink[]> {
    affiliateLinkLogger.debug({ userId, limit }, 'Getting top performing affiliate links');
    
    return await database.monitoredOperation('affiliate_links', 'getTopPerformingLinks', async () => {
      const links = await this.collection
        .find({ userId })
        .sort({ totalRevenue: -1, clickCount: -1 })
        .limit(limit)
        .toArray();
      
      affiliateLinkLogger.info({ 
        userId, 
        limit, 
        found: links.length,
        topRevenue: links[0]?.totalRevenue || 0,
        topClicks: links[0]?.clickCount || 0
      }, 'Top performing links query completed');
      
      return links;
    });
  }

  private generateHash(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    affiliateLinkLogger.debug({ 
      hash: result, 
      length 
    }, 'Generated new hash');
    
    return result;
  }

  async getUserStats(userId: string): Promise<{
    totalLinks: number;
    totalClicks: number;
    totalUniqueClicks: number;
    totalConversions: number;
    totalRevenue: number;
  }> {
    affiliateLinkLogger.debug({ userId }, 'Getting user aggregate stats');
    
    return await database.monitoredOperation('affiliate_links', 'getUserStats', async () => {
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
      
      const stats = result.length === 0 ? {
        totalLinks: 0,
        totalClicks: 0,
        totalUniqueClicks: 0,
        totalConversions: 0,
        totalRevenue: 0
      } : {
        totalLinks: (result[0] as any)?.totalLinks || 0,
        totalClicks: (result[0] as any)?.totalClicks || 0,
        totalUniqueClicks: (result[0] as any)?.totalUniqueClicks || 0,
        totalConversions: (result[0] as any)?.totalConversions || 0,
        totalRevenue: (result[0] as any)?.totalRevenue || 0
      };
      
      affiliateLinkLogger.info({ 
        userId, 
        stats 
      }, 'User stats aggregation completed');
      
      return stats;
    });
  }
}
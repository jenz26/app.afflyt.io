import { Collection, Db } from 'mongodb';
import { Click } from '../types';

export class ClickModel {
  private collection: Collection<Click>;

  constructor(db: Db) {
    this.collection = db.collection<Click>('clicks');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ linkHash: 1 });
      await this.collection.createIndex({ userId: 1 });
      await this.collection.createIndex({ createdAt: -1 });
      await this.collection.createIndex({ ipAddress: 1, linkHash: 1 });
      await this.collection.createIndex({ sessionId: 1 });
      await this.collection.createIndex({ trackingId: 1 }, { unique: true }); // Nuovo index
      console.log('✅ Click indexes created');
    } catch (error) {
      console.error('❌ Error creating click indexes:', error);
    }
  }

  async create(clickData: Omit<Click, '_id' | 'createdAt' | 'updatedAt' | 'isUnique'>): Promise<Click> {
    const now = new Date();
    
    // Check if this is a unique click (same IP + linkHash in last 24 hours)
    const existingClick = await this.collection.findOne({
      ipAddress: clickData.ipAddress,
      linkHash: clickData.linkHash,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const click: Click = {
      ...clickData,
      isUnique: !existingClick,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(click);
    return { ...click, _id: result.insertedId };
  }

  async findByTrackingId(trackingId: string): Promise<Click | null> {
    return await this.collection.findOne({ trackingId });
  }

  async getClicksByLink(linkHash: string, limit = 100, offset = 0): Promise<Click[]> {
    return await this.collection
      .find({ linkHash })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async getClicksByUser(userId: string, startDate?: Date, endDate?: Date): Promise<Click[]> {
    const query: any = { userId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    return await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getClicksTrend(userId: string, days = 7): Promise<Array<{ date: string; clicks: number; uniqueClicks: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          clicks: { $sum: 1 },
          uniqueClicks: {
            $sum: { $cond: ['$isUnique', 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          clicks: 1,
          uniqueClicks: 1,
          _id: 0
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return result.map((item: any) => ({
      date: item.date,
      clicks: item.clicks || 0,
      uniqueClicks: item.uniqueClicks || 0
    }));
  }

  async getGeoDistribution(userId: string): Promise<Array<{ country: string; clicks: number }>> {
    const pipeline = [
      { $match: { userId, country: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$country',
          clicks: { $sum: 1 }
        }
      },
      {
        $project: {
          country: '$_id',
          clicks: 1,
          _id: 0
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return result.map((item: any) => ({
      country: item.country,
      clicks: item.clicks || 0
    }));
  }

  async getDeviceDistribution(userId: string): Promise<Array<{ device: string; clicks: number }>> {
    const pipeline = [
      { $match: { userId, device: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$device',
          clicks: { $sum: 1 }
        }
      },
      {
        $project: {
          device: '$_id',
          clicks: 1,
          _id: 0
        }
      },
      { $sort: { clicks: -1 } }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return result.map((item: any) => ({
      device: item.device,
      clicks: item.clicks || 0
    }));
  }
}
import { Collection, Db, ObjectId } from 'mongodb';
import { Conversion } from '../types';

export class ConversionModel {
  private collection: Collection<Conversion>;

  constructor(db: Db) {
    this.collection = db.collection<Conversion>('conversions');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ userId: 1, conversionTimestamp: -1 });
      await this.collection.createIndex({ linkId: 1 });
      await this.collection.createIndex({ trackingId: 1 }, { unique: true });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ createdAt: 1 });
      console.log('✅ Conversion indexes created');
    } catch (error) {
      console.error('❌ Error creating conversion indexes:', error);
    }
  }

  async create(conversionData: Omit<Conversion, '_id' | 'createdAt' | 'updatedAt'>): Promise<Conversion> {
    const now = new Date();
    
    const conversion: Conversion = {
      ...conversionData,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(conversion);
    return { ...conversion, _id: result.insertedId };
  }

  async findByUserId(
    userId: string, 
    filters?: {
      status?: 'pending' | 'approved' | 'rejected';
      startDate?: Date;
      endDate?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<Conversion[]> {
    const query: any = { userId };
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.startDate || filters?.endDate) {
      query.conversionTimestamp = {};
      if (filters.startDate) query.conversionTimestamp.$gte = filters.startDate;
      if (filters.endDate) query.conversionTimestamp.$lte = filters.endDate;
    }

    const sortField = filters?.sortBy || 'conversionTimestamp';
    const sortDirection = filters?.sortOrder === 'asc' ? 1 : -1;

    return await this.collection
      .find(query)
      .sort({ [sortField]: sortDirection })
      .skip(filters?.offset || 0)
      .limit(filters?.limit || 50)
      .toArray();
  }

  async findByTrackingId(trackingId: string): Promise<Conversion | null> {
    return await this.collection.findOne({ trackingId });
  }

  async updateStatus(
    conversionId: ObjectId, 
    status: 'pending' | 'approved' | 'rejected',
    notes?: string
  ): Promise<boolean> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (notes) {
      updateData.notes = notes;
    }

    const result = await this.collection.updateOne(
      { _id: conversionId },
      { $set: updateData }
    );

    return result.modifiedCount > 0;
  }

  async getRevenueTrend(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<Array<{ date: string; revenue: number; conversions: number }>> {
    const dateFormat = this.getDateFormat(granularity);
    
    const pipeline = [
      {
        $match: {
          userId,
          conversionTimestamp: { $gte: startDate, $lte: endDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$conversionTimestamp'
            }
          },
          revenue: { $sum: '$payoutAmount' },
          conversions: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          revenue: 1,
          conversions: 1,
          _id: 0
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return result.map((item: any) => ({
      date: item.date,
      revenue: item.revenue || 0,
      conversions: item.conversions || 0
    }));
  }

  private getDateFormat(granularity: string): string {
    switch (granularity) {
      case 'hourly': return '%Y-%m-%d %H:00';
      case 'daily': return '%Y-%m-%d';
      case 'weekly': return '%Y-%U';
      case 'monthly': return '%Y-%m';
      default: return '%Y-%m-%d';
    }
  }

  async getUserConversionStats(userId: string): Promise<{
    totalConversions: number;
    pendingConversions: number;
    approvedConversions: number;
    rejectedConversions: number;
    totalRevenue: number;
    pendingRevenue: number;
  }> {
    const pipeline = [
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalConversions: { $sum: 1 },
          pendingConversions: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedConversions: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedConversions: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$payoutAmount', 0] }
          },
          pendingRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$payoutAmount', 0] }
          }
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    
    if (result.length === 0) {
      return {
        totalConversions: 0,
        pendingConversions: 0,
        approvedConversions: 0,
        rejectedConversions: 0,
        totalRevenue: 0,
        pendingRevenue: 0
      };
    }

    return result[0] as any;
  }
}
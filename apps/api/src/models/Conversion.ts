import { Collection, Db, ObjectId } from 'mongodb';
import { Conversion } from '../types';
import { logUtils, createModuleLogger } from '../config/logger';
import { database } from '../config/database';

// Create module-specific logger
const conversionLogger = createModuleLogger('conversion');

export class ConversionModel {
  private collection: Collection<Conversion>;

  constructor(db: Db) {
    this.collection = db.collection<Conversion>('conversions');
    conversionLogger.debug('ConversionModel initialized');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.collection.createIndex({ userId: 1, conversionTimestamp: -1 }),
        this.collection.createIndex({ linkId: 1 }),
        this.collection.createIndex({ trackingId: 1 }, { unique: true }),
        this.collection.createIndex({ status: 1 }),
        this.collection.createIndex({ createdAt: 1 })
      ]);
      
      const duration = Date.now() - startTime;
      conversionLogger.info({ 
        duration,
        indexes: [
          'userId+conversionTimestamp', 'linkId', 
          'trackingId (unique)', 'status', 'createdAt'
        ]
      }, 'Conversion indexes created successfully');
      
      // Log performance if slow
      logUtils.performance.slowQuery('createConversionIndexes', duration, 2000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      conversionLogger.error({ 
        error,
        duration,
        collection: 'conversions'
      }, 'Failed to create conversion indexes');
      
      logUtils.database.error('createConversionIndexes', error);
      throw error;
    }
  }

  async create(conversionData: Omit<Conversion, '_id' | 'createdAt' | 'updatedAt'>): Promise<Conversion> {
    const startTime = Date.now();
    
    conversionLogger.info({ 
      userId: conversionData.userId,
      linkId: conversionData.linkId,
      orderId: conversionData.orderId,
      payoutAmount: conversionData.payoutAmount,
      status: conversionData.status
    }, 'Creating conversion record');

    return await database.monitoredOperation('conversions', 'create', async () => {
      const now = new Date();
      
      const conversion: Conversion = {
        ...conversionData,
        createdAt: now,
        updatedAt: now
      };

      const result = await this.collection.insertOne(conversion);
      const createdConversion = { ...conversion, _id: result.insertedId };
      
      const duration = Date.now() - startTime;
      
      // Log conversion with business context
      logUtils.affiliate.conversionTracked(
        conversionData.linkId?.toString() || 'unknown', 
        conversionData.payoutAmount, 
        'EUR' // Default currency since not in type
      );
      
      conversionLogger.info({ 
        conversionId: createdConversion._id?.toString(),
        userId: conversionData.userId,
        linkId: conversionData.linkId,
        orderId: conversionData.orderId,
        payoutAmount: conversionData.payoutAmount,
        status: conversionData.status,
        duration
      }, 'Conversion record created successfully');
      
      return createdConversion;
    });
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
    conversionLogger.debug({ 
      userId, 
      filters: {
        status: filters?.status,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
        sortBy: filters?.sortBy,
        sortOrder: filters?.sortOrder,
        limit: filters?.limit,
        offset: filters?.offset
      }
    }, 'Finding conversions by user');
    
    return await database.monitoredOperation('conversions', 'findByUserId', async () => {
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

      const conversions = await this.collection
        .find(query)
        .sort({ [sortField]: sortDirection })
        .skip(filters?.offset || 0)
        .limit(filters?.limit || 50)
        .toArray();
      
      const totalRevenue = conversions.reduce((sum, c) => 
        c.status === 'approved' ? sum + c.payoutAmount : sum, 0
      );
      
      conversionLogger.info({ 
        userId,
        filters: filters?.status ? { status: filters.status } : 'all',
        found: conversions.length,
        totalRevenue,
        statusBreakdown: {
          pending: conversions.filter(c => c.status === 'pending').length,
          approved: conversions.filter(c => c.status === 'approved').length,
          rejected: conversions.filter(c => c.status === 'rejected').length
        }
      }, 'User conversions query completed');
      
      return conversions;
    });
  }

  async findByTrackingId(trackingId: string): Promise<Conversion | null> {
    conversionLogger.debug({ trackingId }, 'Finding conversion by tracking ID');
    
    return await database.monitoredOperation('conversions', 'findByTrackingId', async () => {
      const conversion = await this.collection.findOne({ trackingId });
      
      conversionLogger.debug({ 
        trackingId, 
        found: !!conversion,
        conversionId: conversion?._id?.toString(),
        status: conversion?.status,
        payoutAmount: conversion?.payoutAmount
      }, 'Find by tracking ID completed');
      
      return conversion;
    });
  }

  async updateStatus(
    conversionId: ObjectId, 
    status: 'pending' | 'approved' | 'rejected',
    notes?: string
  ): Promise<boolean> {
    conversionLogger.info({ 
      conversionId: conversionId.toString(), 
      newStatus: status, 
      hasNotes: !!notes 
    }, 'Updating conversion status');
    
    return await database.monitoredOperation('conversions', 'updateStatus', async () => {
      // Get current conversion for logging context
      const currentConversion = await this.collection.findOne({ _id: conversionId });
      
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

      const success = result.modifiedCount > 0;
      
      if (success && currentConversion) {
        conversionLogger.info({ 
          conversionId: conversionId.toString(),
          userId: currentConversion.userId,
          linkId: currentConversion.linkId,
          orderId: currentConversion.orderId,
          previousStatus: currentConversion.status,
          newStatus: status,
          payoutAmount: currentConversion.payoutAmount,
          statusChange: `${currentConversion.status} → ${status}`,
          notes
        }, 'Conversion status updated successfully');
        
        // Log business metrics for approved conversions
        if (status === 'approved' && currentConversion.status !== 'approved') {
          logUtils.affiliate.conversionTracked(
            currentConversion.linkId?.toString() || 'unknown', 
            currentConversion.payoutAmount, 
            'EUR' // Default currency
          );
        }
      } else {
        conversionLogger.warn({ 
          conversionId: conversionId.toString(), 
          targetStatus: status 
        }, 'Conversion status update found no matching document');
      }
      
      return success;
    });
  }

  async getRevenueTrend(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<Array<{ date: string; revenue: number; conversions: number }>> {
    conversionLogger.debug({ 
      userId, 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(), 
      granularity 
    }, 'Getting revenue trend');
    
    return await database.monitoredOperation('conversions', 'getRevenueTrend', async () => {
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
      const trend = result.map((item: any) => ({
        date: item.date,
        revenue: item.revenue || 0,
        conversions: item.conversions || 0
      }));
      
      const totalRevenue = trend.reduce((sum, point) => sum + point.revenue, 0);
      const totalConversions = trend.reduce((sum, point) => sum + point.conversions, 0);
      const avgRevenuePerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 0;
      
      conversionLogger.info({ 
        userId,
        dateRange: { startDate, endDate },
        granularity,
        trendPoints: trend.length,
        totalRevenue,
        totalConversions,
        avgRevenuePerConversion: Math.round(avgRevenuePerConversion * 100) / 100,
        peakDay: trend.reduce((max, point) => 
          point.revenue > max.revenue ? point : max, 
          { date: '', revenue: 0, conversions: 0 }
        )
      }, 'Revenue trend analysis completed');
      
      return trend;
    });
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
    conversionLogger.debug({ userId }, 'Getting user conversion stats');
    
    return await database.monitoredOperation('conversions', 'getUserConversionStats', async () => {
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
      
      const stats = result.length === 0 ? {
        totalConversions: 0,
        pendingConversions: 0,
        approvedConversions: 0,
        rejectedConversions: 0,
        totalRevenue: 0,
        pendingRevenue: 0
      } : (result[0] as any);
      
      const conversionRate = stats.totalConversions > 0 ? 
        (stats.approvedConversions / stats.totalConversions * 100).toFixed(2) : '0.00';
      
      const avgRevenuePerConversion = stats.approvedConversions > 0 ? 
        (stats.totalRevenue / stats.approvedConversions).toFixed(2) : '0.00';
      
      conversionLogger.info({ 
        userId,
        stats: {
          ...stats,
          conversionRate: `${conversionRate}%`,
          avgRevenuePerConversion: `€${avgRevenuePerConversion}`,
          pendingValue: `€${stats.pendingRevenue.toFixed(2)}`
        }
      }, 'User conversion stats calculated');
      
      return stats;
    });
  }
}
import { Collection, Db } from 'mongodb';
import { Click } from '../types';
import { logUtils, createModuleLogger } from '../config/logger';
import { database } from '../config/database';

// Create module-specific logger
const clickLogger = createModuleLogger('click');

export class ClickModel {
  private collection: Collection<Click>;

  constructor(db: Db) {
    this.collection = db.collection<Click>('clicks');
    clickLogger.debug('ClickModel initialized');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.collection.createIndex({ linkHash: 1 }),
        this.collection.createIndex({ userId: 1 }),
        this.collection.createIndex({ createdAt: -1 }),
        this.collection.createIndex({ ipAddress: 1, linkHash: 1 }),
        this.collection.createIndex({ sessionId: 1 }),
        this.collection.createIndex({ trackingId: 1 }, { unique: true })
      ]);
      
      const duration = Date.now() - startTime;
      clickLogger.info({ 
        duration,
        indexes: [
          'linkHash', 'userId', 'createdAt', 
          'ipAddress+linkHash', 'sessionId', 'trackingId (unique)'
        ]
      }, 'Click indexes created successfully');
      
      // Log performance if slow
      logUtils.performance.slowQuery('createClickIndexes', duration, 2000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      clickLogger.error({ 
        error,
        duration,
        collection: 'clicks'
      }, 'Failed to create click indexes');
      
      logUtils.database.error('createClickIndexes', error);
      throw error;
    }
  }

  async create(clickData: Omit<Click, '_id' | 'createdAt' | 'updatedAt' | 'isUnique'>): Promise<Click> {
    const startTime = Date.now();
    
    clickLogger.debug({ 
      linkHash: clickData.linkHash,
      userId: clickData.userId,
      ipAddress: clickData.ipAddress,
      userAgent: clickData.userAgent,
      referer: clickData.referer
    }, 'Creating click record');

    return await database.monitoredOperation('clicks', 'create', async () => {
      const now = new Date();
      
      // Check if this is a unique click (same IP + linkHash in last 24 hours)
      const uniqueCheckStart = Date.now();
      const existingClick = await this.collection.findOne({
        ipAddress: clickData.ipAddress,
        linkHash: clickData.linkHash,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      const uniqueCheckDuration = Date.now() - uniqueCheckStart;
      const isUnique = !existingClick;
      
      clickLogger.debug({ 
        linkHash: clickData.linkHash,
        ipAddress: clickData.ipAddress,
        isUnique,
        uniqueCheckDuration,
        existingClickId: existingClick?._id?.toString()
      }, 'Unique click check completed');

      const click: Click = {
        ...clickData,
        isUnique,
        createdAt: now,
        updatedAt: now
      };

      const result = await this.collection.insertOne(click);
      const createdClick = { ...click, _id: result.insertedId };
      
      const totalDuration = Date.now() - startTime;
      
      // Log click creation with business context
      logUtils.affiliate.linkClicked(
        clickData.linkHash, 
        clickData.ipAddress, 
        clickData.userAgent
      );
      
      clickLogger.info({ 
        clickId: createdClick._id?.toString(),
        linkHash: clickData.linkHash,
        userId: clickData.userId,
        ipAddress: clickData.ipAddress,
        isUnique,
        country: clickData.country,
        device: clickData.device,
        referer: clickData.referer,
        totalDuration,
        uniqueCheckDuration
      }, 'Click record created successfully');
      
      return createdClick;
    });
  }

  async findByTrackingId(trackingId: string): Promise<Click | null> {
    clickLogger.debug({ trackingId }, 'Finding click by tracking ID');
    
    return await database.monitoredOperation('clicks', 'findByTrackingId', async () => {
      const click = await this.collection.findOne({ trackingId });
      
      clickLogger.debug({ 
        trackingId, 
        found: !!click,
        clickId: click?._id?.toString(),
        linkHash: click?.linkHash
      }, 'Find by tracking ID completed');
      
      return click;
    });
  }

  async getClicksByLink(linkHash: string, limit = 100, offset = 0): Promise<Click[]> {
    clickLogger.debug({ linkHash, limit, offset }, 'Getting clicks by link');
    
    return await database.monitoredOperation('clicks', 'getClicksByLink', async () => {
      const clicks = await this.collection
        .find({ linkHash })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();
      
      clickLogger.debug({ 
        linkHash, 
        limit, 
        offset, 
        found: clicks.length,
        uniqueClicks: clicks.filter(c => c.isUnique).length
      }, 'Clicks by link query completed');
      
      return clicks;
    });
  }

  async getClicksByUser(userId: string, startDate?: Date, endDate?: Date): Promise<Click[]> {
    clickLogger.debug({ 
      userId, 
      startDate: startDate?.toISOString(), 
      endDate: endDate?.toISOString() 
    }, 'Getting clicks by user');
    
    return await database.monitoredOperation('clicks', 'getClicksByUser', async () => {
      const query: any = { userId };
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const clicks = await this.collection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      
      clickLogger.info({ 
        userId, 
        dateRange: { startDate, endDate },
        totalClicks: clicks.length,
        uniqueClicks: clicks.filter(c => c.isUnique).length,
        countries: [...new Set(clicks.map(c => c.country).filter(Boolean))],
        devices: [...new Set(clicks.map(c => c.device).filter(Boolean))]
      }, 'User clicks query completed');
      
      return clicks;
    });
  }

  async getClicksTrend(userId: string, days = 7): Promise<Array<{ date: string; clicks: number; uniqueClicks: number }>> {
    clickLogger.debug({ userId, days }, 'Getting clicks trend');
    
    return await database.monitoredOperation('clicks', 'getClicksTrend', async () => {
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
      const trend = result.map((item: any) => ({
        date: item.date,
        clicks: item.clicks || 0,
        uniqueClicks: item.uniqueClicks || 0
      }));
      
      clickLogger.info({ 
        userId, 
        days,
        trendPoints: trend.length,
        totalClicks: trend.reduce((sum, point) => sum + point.clicks, 0),
        totalUniqueClicks: trend.reduce((sum, point) => sum + point.uniqueClicks, 0),
        peakDay: trend.reduce((max, point) => point.clicks > max.clicks ? point : max, { date: '', clicks: 0 })
      }, 'Clicks trend analysis completed');
      
      return trend;
    });
  }

  async getGeoDistribution(userId: string): Promise<Array<{ country: string; clicks: number }>> {
    clickLogger.debug({ userId }, 'Getting geo distribution');
    
    return await database.monitoredOperation('clicks', 'getGeoDistribution', async () => {
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
      const distribution = result.map((item: any) => ({
        country: item.country,
        clicks: item.clicks || 0
      }));
      
      clickLogger.info({ 
        userId,
        countries: distribution.length,
        topCountry: distribution[0] || null,
        totalClicksAnalyzed: distribution.reduce((sum, item) => sum + item.clicks, 0)
      }, 'Geo distribution analysis completed');
      
      return distribution;
    });
  }

  async getHourlyHeatmap(userId: string, startDate: Date): Promise<Array<{ hour: number; day: number; clicks: number; uniqueClicks: number }>> {
    clickLogger.debug({ 
      userId, 
      startDate: startDate.toISOString() 
    }, 'Getting hourly heatmap');
    
    return await database.monitoredOperation('clicks', 'getHourlyHeatmap', async () => {
      const pipeline = [
        {
          $match: {
            userId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $addFields: {
            hour: { $hour: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S.%LZ', date: '$createdAt' } } },
            // MongoDB dayOfWeek returns 1=Sunday, 7=Saturday, we want 0=Monday, 6=Sunday
            dayOfWeek: {
              $subtract: [
                { $dayOfWeek: '$createdAt' }, 
                2 // Convert to Monday=0, Sunday=6
              ]
            }
          }
        },
        {
          $addFields: {
            // Handle Sunday (was -1, should be 6)
            day: {
              $cond: {
                if: { $eq: ['$dayOfWeek', -1] },
                then: 6,
                else: '$dayOfWeek'
              }
            }
          }
        },
        {
          $group: {
            _id: {
              hour: '$hour',
              day: '$day'
            },
            clicks: { $sum: 1 },
            uniqueIPs: { $addToSet: '$ipAddress' }
          }
        },
        {
          $addFields: {
            uniqueClicks: { $size: '$uniqueIPs' }
          }
        },
        {
          $project: {
            hour: '$_id.hour',
            day: '$_id.day',
            clicks: 1,
            uniqueClicks: 1,
            _id: 0
          }
        },
        {
          $sort: { day: 1, hour: 1 }
        }
      ];

      const result = await this.collection.aggregate(pipeline).toArray();
      const heatmap = result.map((item: any) => ({
        hour: item.hour || 0,
        day: item.day || 0,
        clicks: item.clicks || 0,
        uniqueClicks: item.uniqueClicks || 0
      }));
      
      // Find peak activity patterns
      const peakHour = heatmap.reduce((max, point) => 
        point.clicks > max.clicks ? point : max, 
        { hour: 0, day: 0, clicks: 0, uniqueClicks: 0 }
      );
      
      clickLogger.info({ 
        userId,
        startDate,
        heatmapPoints: heatmap.length,
        totalClicks: heatmap.reduce((sum, point) => sum + point.clicks, 0),
        peakActivity: peakHour,
        hoursCovered: [...new Set(heatmap.map(p => p.hour))].length,
        daysCovered: [...new Set(heatmap.map(p => p.day))].length
      }, 'Hourly heatmap analysis completed');
      
      return heatmap;
    });
  }

  async getDeviceDistribution(userId: string): Promise<Array<{ device: string; clicks: number }>> {
    clickLogger.debug({ userId }, 'Getting device distribution');
    
    return await database.monitoredOperation('clicks', 'getDeviceDistribution', async () => {
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
      const distribution = result.map((item: any) => ({
        device: item.device,
        clicks: item.clicks || 0
      }));
      
      clickLogger.info({ 
        userId,
        devices: distribution.length,
        topDevice: distribution[0] || null,
        totalClicksAnalyzed: distribution.reduce((sum, item) => sum + item.clicks, 0),
        deviceTypes: distribution.map(d => d.device)
      }, 'Device distribution analysis completed');
      
      return distribution;
    });
  }
}
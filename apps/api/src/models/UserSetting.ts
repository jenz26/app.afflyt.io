import { Collection, Db } from 'mongodb';
import { UserSetting } from '../types';
import { logUtils, createModuleLogger } from '../config/logger';
import { database } from '../config/database';

// Create module-specific logger
const userSettingLogger = createModuleLogger('user-setting');

export class UserSettingModel {
  private collection: Collection<UserSetting>;

  constructor(db: Db) {
    this.collection = db.collection<UserSetting>('user_settings');
    userSettingLogger.debug('UserSettingModel initialized');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.collection.createIndex({ userId: 1 }, { unique: true }),
        this.collection.createIndex({ createdAt: 1 })
      ]);
      
      const duration = Date.now() - startTime;
      userSettingLogger.info({ 
        duration,
        indexes: ['userId (unique)', 'createdAt']
      }, 'UserSetting indexes created successfully');
      
      // Log performance if slow
      logUtils.performance.slowQuery('createUserSettingIndexes', duration, 1000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      userSettingLogger.error({ 
        error,
        duration,
        collection: 'user_settings'
      }, 'Failed to create user setting indexes');
      
      logUtils.database.error('createUserSettingIndexes', error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<UserSetting | null> {
    userSettingLogger.debug({ userId }, 'Finding user settings by user ID');
    
    return await database.monitoredOperation('user_settings', 'findByUserId', async () => {
      const setting = await this.collection.findOne({ userId });
      
      userSettingLogger.debug({ 
        userId, 
        found: !!setting,
        settingId: setting?._id?.toString(),
        hasDashboardLayout: !!setting?.dashboardLayout,
        dashboardLayoutItems: setting?.dashboardLayout?.length || 0
      }, 'Find user settings completed');
      
      return setting;
    });
  }

  async upsertDashboardLayout(userId: string, dashboardLayout: any[]): Promise<UserSetting> {
    userSettingLogger.info({ 
      userId, 
      layoutItems: dashboardLayout.length,
      layoutTypes: dashboardLayout.map(item => (item as any).type || 'unknown').filter((v, i, a) => a.indexOf(v) === i)
    }, 'Upserting dashboard layout');
    
    return await database.monitoredOperation('user_settings', 'upsertDashboardLayout', async () => {
      const now = new Date();
      
      // Check if user setting exists before update
      const existingSetting = await this.collection.findOne({ userId });
      const isCreating = !existingSetting;
      
      const result = await this.collection.findOneAndUpdate(
        { userId },
        {
          $set: {
            dashboardLayout,
            updatedAt: now
          },
          $setOnInsert: {
            createdAt: now
          }
        },
        {
          upsert: true,
          returnDocument: 'after'
        }
      );

      if (result) {
        userSettingLogger.info({ 
          userId,
          settingId: result._id?.toString(),
          operation: isCreating ? 'created' : 'updated',
          layoutItems: dashboardLayout.length,
          previousLayoutItems: existingSetting?.dashboardLayout?.length || 0,
          layoutConfiguration: {
            widgets: dashboardLayout.map(item => ({
              type: (item as any).type,
              position: (item as any).position,
              size: (item as any).size
            }))
          }
        }, `Dashboard layout ${isCreating ? 'created' : 'updated'} successfully`);
      } else {
        userSettingLogger.error({ userId }, 'Dashboard layout upsert failed');
      }

      return result!;
    });
  }

  async create(settingData: Omit<UserSetting, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserSetting> {
    const startTime = Date.now();
    
    userSettingLogger.info({ 
      userId: settingData.userId,
      hasDashboardLayout: !!settingData.dashboardLayout,
      dashboardLayoutItems: settingData.dashboardLayout?.length || 0
    }, 'Creating user setting');

    return await database.monitoredOperation('user_settings', 'create', async () => {
      const now = new Date();
      
      const setting: UserSetting = {
        ...settingData,
        createdAt: now,
        updatedAt: now
      };

      const result = await this.collection.insertOne(setting);
      const createdSetting = { ...setting, _id: result.insertedId };
      
      const duration = Date.now() - startTime;
      
      userSettingLogger.info({ 
        settingId: createdSetting._id?.toString(),
        userId: settingData.userId,
        dashboardLayout: {
          configured: !!settingData.dashboardLayout,
          itemCount: settingData.dashboardLayout?.length || 0,
          widgets: settingData.dashboardLayout?.map(item => (item as any).type).filter(Boolean) || []
        },
        duration
      }, 'User setting created successfully');
      
      return createdSetting;
    });
  }

  // Additional utility methods with logging

  /**
   * Update specific dashboard widget configuration
   */
  async updateDashboardWidget(
    userId: string, 
    widgetId: string, 
    widgetConfig: any
  ): Promise<boolean> {
    userSettingLogger.debug({ 
      userId, 
      widgetId, 
      configKeys: Object.keys(widgetConfig)
    }, 'Updating dashboard widget');
    
    return await database.monitoredOperation('user_settings', 'updateDashboardWidget', async () => {
      const result = await this.collection.updateOne(
        { 
          userId,
          'dashboardLayout': { $elemMatch: { i: widgetId } }
        },
        {
          $set: {
            'dashboardLayout.$.config': widgetConfig,
            updatedAt: new Date()
          }
        }
      );

      const success = result.modifiedCount > 0;
      
      if (success) {
        userSettingLogger.info({ 
          userId, 
          widgetId, 
          updatedConfig: Object.keys(widgetConfig)
        }, 'Dashboard widget updated successfully');
      } else {
        userSettingLogger.warn({ 
          userId, 
          widgetId 
        }, 'Dashboard widget update found no matching document');
      }
      
      return success;
    });
  }

  /**
   * Remove widget from dashboard layout
   */
  async removeDashboardWidget(userId: string, widgetId: string): Promise<boolean> {
    userSettingLogger.info({ userId, widgetId }, 'Removing dashboard widget');
    
    return await database.monitoredOperation('user_settings', 'removeDashboardWidget', async () => {
      const result = await this.collection.updateOne(
        { userId },
        {
          $pull: {
            dashboardLayout: { i: widgetId }
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

      const success = result.modifiedCount > 0;
      
      if (success) {
        userSettingLogger.info({ userId, widgetId }, 'Dashboard widget removed successfully');
      } else {
        userSettingLogger.warn({ userId, widgetId }, 'Dashboard widget removal found no matching document');
      }
      
      return success;
    });
  }

  /**
   * Reset dashboard layout to default
   */
  async resetDashboardLayout(userId: string, defaultLayout: any[]): Promise<boolean> {
    userSettingLogger.info({ 
      userId, 
      defaultLayoutItems: defaultLayout.length 
    }, 'Resetting dashboard layout to default');
    
    return await database.monitoredOperation('user_settings', 'resetDashboardLayout', async () => {
      const result = await this.collection.updateOne(
        { userId },
        {
          $set: {
            dashboardLayout: defaultLayout,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      const success = result.modifiedCount > 0 || result.upsertedCount > 0;
      
      if (success) {
        userSettingLogger.info({ 
          userId, 
          defaultLayoutItems: defaultLayout.length,
          operation: result.upsertedCount > 0 ? 'created' : 'updated'
        }, 'Dashboard layout reset to default successfully');
      } else {
        userSettingLogger.warn({ userId }, 'Dashboard layout reset failed');
      }
      
      return success;
    });
  }

  /**
   * Get dashboard layout statistics for analytics
   */
  async getDashboardAnalytics(userId?: string): Promise<{
    totalUsers: number;
    avgWidgetsPerUser: number;
    mostUsedWidgets: Array<{ type: string; count: number }>;
    userSpecific?: {
      widgetCount: number;
      lastUpdated: Date | null;
      customizations: string[];
    };
  }> {
    userSettingLogger.debug({ userId }, 'Getting dashboard analytics');
    
    return await database.monitoredOperation('user_settings', 'getDashboardAnalytics', async () => {
      // Global analytics pipeline
      const globalPipeline = [
        {
          $match: {
            dashboardLayout: { $exists: true, $ne: null }
          }
        },
        {
          $project: {
            userId: 1,
            widgetCount: { $size: '$dashboardLayout' },
            widgets: '$dashboardLayout'
          }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalWidgets: { $sum: '$widgetCount' },
            allWidgets: { $push: '$widgets' }
          }
        },
        {
          $project: {
            totalUsers: 1,
            avgWidgetsPerUser: { $divide: ['$totalWidgets', '$totalUsers'] },
            flatWidgets: {
              $reduce: {
                input: '$allWidgets',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this'] }
              }
            }
          }
        }
      ];

      const globalResult = await this.collection.aggregate(globalPipeline).toArray();
      
      const stats = globalResult[0] || {
        totalUsers: 0,
        avgWidgetsPerUser: 0,
        flatWidgets: []
      };

      // Count widget types (extract from widget objects)
      const widgetCounts: Record<string, number> = {};
      stats.flatWidgets?.forEach((widget: any) => {
        const type = widget?.type || widget?.i || 'unknown';
        if (type && type !== 'unknown') {
          widgetCounts[type] = (widgetCounts[type] || 0) + 1;
        }
      });

      const mostUsedWidgets = Object.entries(widgetCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const analytics = {
        totalUsers: stats.totalUsers,
        avgWidgetsPerUser: Math.round((stats.avgWidgetsPerUser || 0) * 100) / 100,
        mostUsedWidgets
      };

      // User-specific analytics if requested
      if (userId) {
        const userSetting = await this.collection.findOne({ userId });
        if (userSetting) {
          (analytics as any).userSpecific = {
            widgetCount: userSetting.dashboardLayout?.length || 0,
            lastUpdated: userSetting.updatedAt,
            customizations: userSetting.dashboardLayout?.map((w: any) => w.type || w.i).filter(Boolean) || []
          };
        }
      }

      userSettingLogger.info({ 
        userId,
        analytics: {
          totalUsers: analytics.totalUsers,
          avgWidgetsPerUser: analytics.avgWidgetsPerUser,
          topWidgets: mostUsedWidgets.slice(0, 3)
        }
      }, 'Dashboard analytics calculated');
      
      return analytics;
    });
  }
}
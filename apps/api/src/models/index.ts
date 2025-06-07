import { Db } from 'mongodb';
import { createModuleLogger } from '../config/logger';
import { UserModel } from './User';
import { AffiliateLinkModel } from './AffiliateLink';
import { ClickModel } from './Click';
import { UserSettingModel } from './UserSetting';
import { ConversionModel } from './Conversion';
import { SupportTicketModel } from './SupportTicket'; // ✨ NEW: Support Ticket Model

// Create module-specific logger
const modelsLogger = createModuleLogger('models');

export class Models {
  public user: UserModel;
  public affiliateLink: AffiliateLinkModel;
  public click: ClickModel;
  public userSetting: UserSettingModel;
  public conversion: ConversionModel;
  public supportTicket: SupportTicketModel; // ✨ NEW: Support Ticket Model

  constructor(db: Db) {
    const startTime = Date.now();
    
    modelsLogger.info('Initializing application models...');
    
    try {
      // Initialize all models
      this.user = new UserModel(db);
      this.affiliateLink = new AffiliateLinkModel(db);
      this.click = new ClickModel(db);
      this.userSetting = new UserSettingModel(db);
      this.conversion = new ConversionModel(db);
      this.supportTicket = new SupportTicketModel(db); // ✨ NEW: Support Ticket Model
      
      const duration = Date.now() - startTime;
      
      modelsLogger.info({ 
        duration,
        models: [
          'UserModel',
          'AffiliateLinkModel', 
          'ClickModel',
          'UserSettingModel',
          'ConversionModel',
          'SupportTicketModel' // ✨ NEW
        ],
        collections: [
          'users',
          'affiliate_links',
          'clicks', 
          'user_settings',
          'conversions',
          'support_tickets' // ✨ NEW
        ]
      }, 'All application models initialized successfully');
      
      // Log if initialization was slow
      if (duration > 2000) {
        modelsLogger.warn({ duration }, 'Models initialization took longer than expected');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      modelsLogger.error({ 
        error,
        duration,
        phase: 'models_initialization'
      }, 'Failed to initialize application models');
      throw error;
    }
  }

  /**
   * Utility method to check model health and connectivity
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    models: Record<string, { status: string; error?: string }>;
    timestamp: Date;
  }> {
    const startTime = Date.now();
    modelsLogger.debug('Starting models health check');
    
    const modelChecks = {
      user: { status: 'unknown', error: undefined as string | undefined },
      affiliateLink: { status: 'unknown', error: undefined as string | undefined },
      click: { status: 'unknown', error: undefined as string | undefined },
      userSetting: { status: 'unknown', error: undefined as string | undefined },
      conversion: { status: 'unknown', error: undefined as string | undefined },
      supportTicket: { status: 'unknown', error: undefined as string | undefined } // ✨ NEW
    };

    // Test each model with a simple operation
    try {
      await this.user.findById('health-check-test');
      modelChecks.user.status = 'healthy';
    } catch (error) {
      modelChecks.user.status = 'unhealthy';
      modelChecks.user.error = (error as Error).message;
    }

    try {
      await this.affiliateLink.findByHash('health-check-test');
      modelChecks.affiliateLink.status = 'healthy';
    } catch (error) {
      modelChecks.affiliateLink.status = 'unhealthy';
      modelChecks.affiliateLink.error = (error as Error).message;
    }

    try {
      await this.click.findByTrackingId('health-check-test');
      modelChecks.click.status = 'healthy';
    } catch (error) {
      modelChecks.click.status = 'unhealthy';
      modelChecks.click.error = (error as Error).message;
    }

    try {
      await this.userSetting.findByUserId('health-check-test');
      modelChecks.userSetting.status = 'healthy';
    } catch (error) {
      modelChecks.userSetting.status = 'unhealthy';
      modelChecks.userSetting.error = (error as Error).message;
    }

    try {
      await this.conversion.findByTrackingId('health-check-test');
      modelChecks.conversion.status = 'healthy';
    } catch (error) {
      modelChecks.conversion.status = 'unhealthy';
      modelChecks.conversion.error = (error as Error).message;
    }

    // ✨ NEW: Support Ticket health check
    try {
      await this.supportTicket.findById('health-check-test');
      modelChecks.supportTicket.status = 'healthy';
    } catch (error) {
      modelChecks.supportTicket.status = 'unhealthy';
      modelChecks.supportTicket.error = (error as Error).message;
    }

    const healthyCount = Object.values(modelChecks).filter(check => check.status === 'healthy').length;
    const totalCount = Object.values(modelChecks).length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      overallStatus = 'healthy';
    } else if (healthyCount > totalCount / 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    const duration = Date.now() - startTime;
    
    modelsLogger.info({ 
      overallStatus,
      healthyModels: healthyCount,
      totalModels: totalCount,
      duration,
      modelStatuses: Object.fromEntries(
        Object.entries(modelChecks).map(([key, value]) => [key, value.status])
      )
    }, 'Models health check completed');

    return {
      status: overallStatus,
      models: modelChecks,
      timestamp: new Date()
    };
  }
}

export * from './User';
export * from './AffiliateLink';
export * from './Click';
export * from './UserSetting';
export * from './Conversion';
export * from './SupportTicket'; // ✨ NEW: Export Support Ticket Model
import { Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { ValidatedRequest } from '../middleware/validation';
import { AnalyticsSummary, TrendDataPoint, DistributionDataPoint } from '../types';
import { logger, logUtils, createModuleLogger } from '../config/logger';
import {
  sendSuccess,
  sendInternalError
} from '../utils/responseHelpers';
import { validationSchemas } from '../schemas';
import { z } from 'zod';

// ===== 🚀 NEW v1.8.4: STRUCTURED LOGGING WITH PINO =====
// Create module-specific logger for analytics operations
const analyticsLogger = createModuleLogger('analytics');

// Type definitions for validated requests
type AnalyticsQueryRequest = AuthRequest & {
  query: z.infer<typeof validationSchemas.analyticsQuery>;
};
type TopLinksQueryRequest = AuthRequest & {
  query: z.infer<typeof validationSchemas.topLinksQuery>;
};
type HeatmapQueryRequest = AuthRequest & {
  query: z.infer<typeof validationSchemas.heatmapQuery>;
};

export class AnalyticsController {
  constructor(private models: Models) {
    analyticsLogger.debug('AnalyticsController initialized');
  }

  // GET /api/user/analytics/summary
  getSummary = async (req: AnalyticsQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { startDate, endDate } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        startDate, 
        endDate 
      }, 'Analytics summary request started');

      // Default: last month
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get basic stats from affiliate links
      const linkStats = await this.models.affiliateLink.getUserStats(user.id);
      
      // Get conversion stats
      const conversionStats = await this.models.conversion.getUserConversionStats(user.id);

      // Calculate derived metrics
      const conversionRate = linkStats.totalClicks > 0 ? 
        (conversionStats.approvedConversions / linkStats.totalClicks) * 100 : 0;
      
      const earningsPerClick = linkStats.totalClicks > 0 ? 
        conversionStats.totalRevenue / linkStats.totalClicks : 0;

      const summary: AnalyticsSummary = {
        totalLinks: linkStats.totalLinks,
        totalClicks: linkStats.totalClicks,
        uniqueClicks: linkStats.totalUniqueClicks,
        totalConversions: conversionStats.approvedConversions,
        pendingConversions: conversionStats.pendingConversions,
        rejectedConversions: conversionStats.rejectedConversions,
        totalRevenue: conversionStats.totalRevenue,
        conversionRate: Math.round(conversionRate * 100) / 100,
        earningsPerClick: Math.round(earningsPerClick * 100) / 100,
        dataPeriod: {
          startDate: start,
          endDate: end
        }
      };

      const responseData = { summary };

      // Log successful analytics calculation
      logUtils.analytics.summaryGenerated(user.id, summary.totalLinks, summary.totalClicks, summary.totalRevenue);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/summary', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching analytics summary');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/summary', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/clicks-trend
  getClicksTrend = async (req: AnalyticsQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { 
        period, 
        granularity,
        linkId,
        subId 
      } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        period, 
        granularity, 
        linkId, 
        subId 
      }, 'Clicks trend request started');

      const days = this.parsePeriod(period);
      const trend = await this.models.click.getClicksTrend(user.id, days);

      const responseData = { trend };

      logUtils.analytics.trendGenerated(user.id, 'clicks', period, trend.length);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/clicks-trend', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching clicks trend');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/clicks-trend', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/revenue-trend
  getRevenueTrend = async (req: AnalyticsQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { 
        period, 
        granularity,
        linkId,
        subId 
      } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        period, 
        granularity, 
        linkId, 
        subId 
      }, 'Revenue trend request started');

      const days = this.parsePeriod(period);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const trend = await this.models.conversion.getRevenueTrend(
        user.id, 
        startDate, 
        endDate, 
        granularity as any
      );

      const responseData = { trend };

      logUtils.analytics.trendGenerated(user.id, 'revenue', period, trend.length);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/revenue-trend', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching revenue trend');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/revenue-trend', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/geo
  getGeoDistribution = async (req: AnalyticsQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { startDate, endDate, linkId, subId, groupBy } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        startDate, 
        endDate, 
        linkId, 
        subId, 
        groupBy 
      }, 'Geo distribution request started');

      const distribution = await this.models.click.getGeoDistribution(user.id);

      const responseData = { distribution };

      logUtils.analytics.distributionGenerated(user.id, 'geo', distribution.length);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/geo', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching geo distribution');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/geo', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/device
  getDeviceDistribution = async (req: AnalyticsQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { startDate, endDate, linkId, subId } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        startDate, 
        endDate, 
        linkId, 
        subId 
      }, 'Device distribution request started');

      const distribution = await this.models.click.getDeviceDistribution(user.id);

      const responseData = { distribution };

      logUtils.analytics.distributionGenerated(user.id, 'device', distribution.length);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/device', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching device distribution');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/device', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/browser
  getBrowserDistribution = async (req: AnalyticsQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { startDate, endDate, linkId, subId } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        startDate, 
        endDate, 
        linkId, 
        subId 
      }, 'Browser distribution request started');

      // Get browser distribution from click model
      const browserData = await this.models.click.getBrowserDistribution(user.id);
      
      // Calculate total clicks for percentage calculation
      const totalClicks = browserData.reduce((sum: number, item: { clicks: number }) => sum + item.clicks, 0);
      
      // Transform data to match frontend expectations (with percentage)
      const distribution = browserData.map((item: { browser: string; clicks: number }) => ({
        label: item.browser,
        value: item.clicks,
        percentage: totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100 * 10) / 10 : 0
      }));

      const responseData = { distribution };

      logUtils.analytics.distributionGenerated(user.id, 'browser', distribution.length);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/browser', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching browser distribution');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/browser', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/referer
  getRefererDistribution = async (req: AnalyticsQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { startDate, endDate, linkId, subId } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        startDate, 
        endDate, 
        linkId, 
        subId 
      }, 'Referer distribution request started');

      // Get referer distribution from click model
      const refererData = await this.models.click.getRefererDistribution(user.id);
      
      // Calculate total clicks for percentage calculation
      const totalClicks = refererData.reduce((sum: number, item: { clicks: number }) => sum + item.clicks, 0);
      
      // Transform data to match frontend expectations (with percentage)
      const distribution = refererData.map((item: { referer: string; clicks: number }) => ({
        label: item.referer,
        value: item.clicks,
        percentage: totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100 * 10) / 10 : 0
      }));

      const responseData = { distribution };

      logUtils.analytics.distributionGenerated(user.id, 'referer', distribution.length);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/referer', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching referer distribution');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/referer', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/subid
  getSubIdDistribution = async (req: AnalyticsQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { startDate, endDate, linkId, subId } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        startDate, 
        endDate, 
        linkId, 
        subId 
      }, 'SubId distribution request started');

      // Get subId distribution from click model
      const subIdData = await this.models.click.getSubIdDistribution(user.id);
      
      // Calculate total clicks for percentage calculation
      const totalClicks = subIdData.reduce((sum: number, item: { clicks: number }) => sum + item.clicks, 0);
      
      // Transform data to match frontend expectations (with percentage)
      const distribution = subIdData.map((item: { subId: string; clicks: number }) => ({
        label: item.subId,
        value: item.clicks,
        percentage: totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100 * 10) / 10 : 0
      }));

      const responseData = { distribution };

      logUtils.analytics.distributionGenerated(user.id, 'subid', distribution.length);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/subid', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching subid distribution');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/distribution/subid', duration, 500);
      sendInternalError(res);
    }
  };
  
  // GET /api/user/analytics/hourly-heatmap
  getHourlyHeatmap = async (req: HeatmapQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { period, startDate, endDate } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        period, 
        startDate, 
        endDate 
      }, 'Hourly heatmap request started');

      // Calculate date range
      let dateFilter: Date;
      if (startDate && endDate) {
        dateFilter = new Date(startDate);
      } else {
        const days = this.parsePeriod(period);
        dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      }

      // Get hourly heatmap data from click model
      const heatmapData = await this.models.click.getHourlyHeatmap(user.id, dateFilter);

      // Create complete 24x7 grid with zeros for missing slots
      const completeData: Array<{
        hour: number;
        day: number;
        clicks: number;
        uniqueClicks: number;
        intensity: number;
      }> = [];

      // Initialize grid with zeros
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const existingData = heatmapData.find((d: any) => d.day === day && d.hour === hour);
          completeData.push({
            hour,
            day,
            clicks: existingData?.clicks || 0,
            uniqueClicks: existingData?.uniqueClicks || 0,
            intensity: 0 // Will be calculated below
          });
        }
      }

      // Calculate statistics
      const totalClicks = completeData.reduce((sum, item) => sum + item.clicks, 0);
      let maxClicks = 0;
      let peakHour = 0;
      let peakDay = 0;

      completeData.forEach(item => {
        if (item.clicks > maxClicks) {
          maxClicks = item.clicks;
          peakHour = item.hour;
          peakDay = item.day;
        }
      });

      // Calculate intensity for each cell (0-1 scale)
      completeData.forEach(item => {
        item.intensity = maxClicks > 0 ? item.clicks / maxClicks : 0;
      });

      const responseData = {
        data: completeData,
        totalClicks,
        maxClicks,
        peakHour,
        peakDay,
        period,
        dateRange: {
          startDate: dateFilter.toISOString(),
          endDate: new Date().toISOString()
        }
      };

      logUtils.analytics.heatmapGenerated(user.id, totalClicks, peakHour, peakDay);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/hourly-heatmap', Date.now() - startTime, 200);

      sendSuccess(res, responseData);

    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching hourly heatmap');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/hourly-heatmap', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/top-performing-links
  getTopPerformingLinks = async (req: TopLinksQueryRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { 
        sortBy, 
        limit,
        startDate,
        endDate 
      } = req.query;

      analyticsLogger.debug({ 
        userId: user.id, 
        sortBy, 
        limit, 
        startDate, 
        endDate 
      }, 'Top performing links request started');

      const links = await this.models.affiliateLink.getTopPerformingLinks(
        user.id,
        limit
      );

      const linksWithMetrics = links.map(link => ({
        hash: link.hash,
        originalUrl: link.originalUrl,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/r/${link.hash}`,
        tag: link.tag,
        clickCount: link.clickCount,
        uniqueClickCount: link.uniqueClickCount,
        conversionCount: link.conversionCount,
        totalRevenue: link.totalRevenue,
        conversionRate: link.clickCount > 0 ? (link.conversionCount / link.clickCount) * 100 : 0,
        earningsPerClick: link.clickCount > 0 ? link.totalRevenue / link.clickCount : 0,
        createdAt: link.createdAt
      }));

      // Sort based on validated sortBy parameter
      if (sortBy === 'conversionRate') {
        linksWithMetrics.sort((a, b) => b.conversionRate - a.conversionRate);
      } else if (sortBy === 'earningsPerClick') {
        linksWithMetrics.sort((a, b) => b.earningsPerClick - a.earningsPerClick);
      } else if (sortBy === 'clicks') {
        linksWithMetrics.sort((a, b) => b.clickCount - a.clickCount);
      } else if (sortBy === 'conversions') {
        linksWithMetrics.sort((a, b) => b.conversionCount - a.conversionCount);
      } else {
        // Default: revenue
        linksWithMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
      }

      const responseData = { topLinks: linksWithMetrics };

      logUtils.analytics.topLinksGenerated(user.id, sortBy, linksWithMetrics.length);
      logUtils.performance.requestEnd('GET', '/api/user/analytics/top-performing-links', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      analyticsLogger.error({ error, duration }, 'Error fetching top performing links');
      logUtils.performance.requestEnd('GET', '/api/user/analytics/top-performing-links', duration, 500);
      sendInternalError(res);
    }
  };

  // Utility function to parse period
  private parsePeriod(period: string): number {
    switch (period) {
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '12m': return 365;
      default: return 7;
    }
  }
}
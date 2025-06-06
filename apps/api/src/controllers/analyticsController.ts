import { Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AnalyticsSummary, TrendDataPoint, DistributionDataPoint } from '../types';
import {
  sendSuccess,
  sendInternalError
} from '../utils/responseHelpers';

export class AnalyticsController {
  constructor(private models: Models) {}

  // GET /api/user/analytics/summary
  getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { startDate, endDate } = req.query;

      // Default: ultimo mese
      const end = endDate ? new Date(endDate as string) : new Date();
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/clicks-trend
  getClicksTrend = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { 
        period = '7d', 
        granularity = 'daily',
        linkId,
        subId 
      } = req.query;

      const days = this.parsePeriod(period as string);
      const trend = await this.models.click.getClicksTrend(user.id, days);

      const responseData = { trend };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching clicks trend:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/revenue-trend
  getRevenueTrend = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { 
        period = '7d', 
        granularity = 'daily',
        linkId,
        subId 
      } = req.query;

      const days = this.parsePeriod(period as string);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const trend = await this.models.conversion.getRevenueTrend(
        user.id, 
        startDate, 
        endDate, 
        granularity as any
      );

      const responseData = { trend };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching revenue trend:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/geo
  getGeoDistribution = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { startDate, endDate, linkId, subId, groupBy = 'country' } = req.query;

      const distribution = await this.models.click.getGeoDistribution(user.id);

      const responseData = { distribution };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching geo distribution:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/device
  getDeviceDistribution = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { startDate, endDate, linkId, subId } = req.query;

      const distribution = await this.models.click.getDeviceDistribution(user.id);

      const responseData = { distribution };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching device distribution:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/browser
  getBrowserDistribution = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      // Per ora restituiamo dati mock, implementeremo la logica nel click model più avanti
      
      const distribution = [
        { label: 'Chrome', value: 45, percentage: 65.2 },
        { label: 'Safari', value: 15, percentage: 21.7 },
        { label: 'Firefox', value: 6, percentage: 8.7 },
        { label: 'Edge', value: 3, percentage: 4.4 }
      ];

      const responseData = { distribution };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching browser distribution:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/referer
  getRefererDistribution = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      // Per ora restituiamo dati mock
      
      const distribution = [
        { label: 'Telegram', value: 35, percentage: 42.2 },
        { label: 'Instagram', value: 20, percentage: 24.1 },
        { label: 'Direct', value: 15, percentage: 18.1 },
        { label: 'YouTube', value: 8, percentage: 9.6 },
        { label: 'Other', value: 5, percentage: 6.0 }
      ];

      const responseData = { distribution };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching referer distribution:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/distribution/subid
  getSubIdDistribution = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      // Per ora restituiamo dati mock
      
      const distribution = [
        { label: 'telegram_channel_main', value: 25, percentage: 35.7 },
        { label: 'instagram_story', value: 18, percentage: 25.7 },
        { label: 'youtube_desc', value: 12, percentage: 17.1 },
        { label: 'twitter_bio', value: 8, percentage: 11.4 },
        { label: 'email_newsletter', value: 7, percentage: 10.0 }
      ];

      const responseData = { distribution };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching subid distribution:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/hourly-heatmap
  getHourlyHeatmap = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { period = '7d', startDate, endDate } = req.query;

      // Calculate date range
      let dateFilter: Date;
      if (startDate && endDate) {
        dateFilter = new Date(startDate as string);
      } else {
        const days = this.parsePeriod(period as string);
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
        period: period as string,
        dateRange: {
          startDate: dateFilter.toISOString(),
          endDate: new Date().toISOString()
        }
      };

      sendSuccess(res, responseData);

    } catch (error) {
      console.error('Error fetching hourly heatmap:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/analytics/top-performing-links
  getTopPerformingLinks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { 
        sortBy = 'revenue', 
        limit = '10',
        startDate,
        endDate 
      } = req.query;

      const links = await this.models.affiliateLink.getTopPerformingLinks(
        user.id,
        parseInt(limit as string)
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

      // Ordina in base al parametro sortBy
      if (sortBy === 'conversionRate') {
        linksWithMetrics.sort((a, b) => b.conversionRate - a.conversionRate);
      } else if (sortBy === 'earningsPerClick') {
        linksWithMetrics.sort((a, b) => b.earningsPerClick - a.earningsPerClick);
      } else {
        // Default: revenue
        linksWithMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
      }

      const responseData = { topLinks: linksWithMetrics };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching top performing links:', error);
      sendInternalError(res);
    }
  };

  // Utility function per parsare il periodo
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
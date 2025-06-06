import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AffiliateLink } from '../types';
import { logger, logUtils, createModuleLogger } from '../config/logger';
import {
  sendSuccess,
  sendValidationError,
  sendNotFoundError,
  sendForbiddenError,
  sendInternalError,
  createPagination
} from '../utils/responseHelpers';

// ===== 🚀 NEW v1.8.4: STRUCTURED LOGGING WITH PINO =====
// Create module-specific logger for link operations
const linkLogger = createModuleLogger('link');

export class LinkController {
  constructor(private models: Models) {
    linkLogger.debug('LinkController initialized');
  }

  // Create new affiliate link
  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const { originalUrl, tag } = req.body;
      const user = req.user!;

      linkLogger.debug({ 
        userId: user.id, 
        originalUrl, 
        tag 
      }, 'Link creation request started');

      // Validation
      if (!originalUrl) {
        linkLogger.warn({ userId: user.id }, 'Link creation failed: missing originalUrl');
        sendValidationError(res, 'Original URL is required');
        return;
      }

      // Validate URL format
      try {
        new URL(originalUrl);
      } catch {
        linkLogger.warn({ 
          userId: user.id, 
          originalUrl 
        }, 'Link creation failed: invalid URL format');
        sendValidationError(res, 'Invalid URL format');
        return;
      }

      // Create affiliate link
      const linkData = {
        userId: user.id,
        originalUrl,
        tag: tag || undefined,
        isActive: true
      };

      const affiliateLink = await this.models.affiliateLink.create(linkData);

      const linkResponse = {
        link: {
          hash: affiliateLink.hash,
          originalUrl: affiliateLink.originalUrl,
          shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/r/${affiliateLink.hash}`,
          tag: affiliateLink.tag,
          isActive: affiliateLink.isActive,
          clickCount: affiliateLink.clickCount,
          uniqueClickCount: affiliateLink.uniqueClickCount,
          conversionCount: affiliateLink.conversionCount,
          totalRevenue: affiliateLink.totalRevenue,
          createdAt: affiliateLink.createdAt
        }
      };

      // Log successful link creation
      logUtils.links.created(user.id, affiliateLink.hash, originalUrl, tag);
      logUtils.performance.requestEnd('POST', '/api/links', Date.now() - startTime, 201);

      sendSuccess(res, linkResponse, {
        message: 'Affiliate link created successfully',
        statusCode: 201
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      linkLogger.error({ error, duration }, 'Error creating affiliate link');
      logUtils.performance.requestEnd('POST', '/api/links', duration, 500);
      sendInternalError(res);
    }
  };

  // Get user's affiliate links
  getLinks = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { limit = '50', offset = '0' } = req.query;

      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      linkLogger.debug({ 
        userId: user.id, 
        limit: limitNum, 
        offset: offsetNum 
      }, 'User links request started');

      const links = await this.models.affiliateLink.findByUserId(
        user.id,
        limitNum,
        offsetNum
      );

      const linksWithShortUrls = links.map(link => ({
        hash: link.hash,
        originalUrl: link.originalUrl,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/r/${link.hash}`,
        tag: link.tag,
        isActive: link.isActive,
        clickCount: link.clickCount,
        uniqueClickCount: link.uniqueClickCount,
        conversionCount: link.conversionCount,
        totalRevenue: link.totalRevenue,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt
      }));

      const responseData = {
        links: linksWithShortUrls
      };

      const pagination = createPagination(limitNum, offsetNum, linksWithShortUrls.length);

      // Log successful links retrieval
      linkLogger.info({ 
        userId: user.id, 
        linkCount: linksWithShortUrls.length,
        pagination: { limit: limitNum, offset: offsetNum }
      }, 'User links retrieved successfully');
      logUtils.performance.requestEnd('GET', '/api/links', Date.now() - startTime, 200);

      sendSuccess(res, responseData, { pagination });
    } catch (error) {
      const duration = Date.now() - startTime;
      linkLogger.error({ error, duration }, 'Error fetching user links');
      logUtils.performance.requestEnd('GET', '/api/links', duration, 500);
      sendInternalError(res);
    }
  };

  // Get link details by hash
  getLinkByHash = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const { hash } = req.params;
      const user = req.user!;

      linkLogger.debug({ 
        userId: user.id, 
        linkHash: hash 
      }, 'Link details request started');

      if (!hash) {
        linkLogger.warn({ userId: user.id }, 'Link details request failed: missing hash parameter');
        sendValidationError(res, 'Hash parameter is required');
        return;
      }

      const link = await this.models.affiliateLink.findByHash(hash);

      if (!link) {
        linkLogger.warn({ 
          userId: user.id, 
          linkHash: hash 
        }, 'Link details request failed: link not found');
        sendNotFoundError(res, 'Link');
        return;
      }

      // Check if user owns this link
      if (link.userId !== user.id) {
        linkLogger.warn({ 
          userId: user.id, 
          linkHash: hash, 
          linkOwnerId: link.userId 
        }, 'Link details request denied: insufficient permissions');
        sendForbiddenError(res);
        return;
      }

      const linkResponse = {
        link: {
          hash: link.hash,
          originalUrl: link.originalUrl,
          shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/r/${link.hash}`,
          tag: link.tag,
          isActive: link.isActive,
          clickCount: link.clickCount,
          uniqueClickCount: link.uniqueClickCount,
          conversionCount: link.conversionCount,
          totalRevenue: link.totalRevenue,
          createdAt: link.createdAt,
          updatedAt: link.updatedAt
        }
      };

      // Log successful link details retrieval
      linkLogger.info({ 
        userId: user.id, 
        linkHash: hash,
        clickCount: link.clickCount,
        totalRevenue: link.totalRevenue
      }, 'Link details retrieved successfully');
      logUtils.performance.requestEnd('GET', `/api/links/${hash}`, Date.now() - startTime, 200);

      sendSuccess(res, linkResponse);
    } catch (error) {
      const duration = Date.now() - startTime;
      linkLogger.error({ error, duration }, 'Error fetching link details');
      logUtils.performance.requestEnd('GET', '/api/links/:hash', duration, 500);
      sendInternalError(res);
    }
  };

  // Handle redirect (public endpoint)
  redirect = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const { hash } = req.params;

      linkLogger.debug({ 
        linkHash: hash,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }, 'Link redirect request started');

      if (!hash) {
        linkLogger.warn({ ip: req.ip }, 'Redirect failed: missing hash parameter');
        sendValidationError(res, 'Hash parameter is required');
        return;
      }

      // Find the affiliate link
      const link = await this.models.affiliateLink.findByHash(hash);

      if (!link || !link.isActive) {
        linkLogger.warn({ 
          linkHash: hash,
          ip: req.ip,
          linkExists: !!link,
          isActive: link?.isActive 
        }, 'Redirect failed: link not found or inactive');
        sendNotFoundError(res, 'Link not found or inactive');
        return;
      }

      // Extract user info for click tracking
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const referer = req.headers.referer;

      // Create click record
      const clickData = {
        linkHash: hash,
        userId: link.userId,
        ipAddress,
        userAgent,
        referer,
        // TODO: Add geolocation, device detection, etc.
        country: undefined,
        device: undefined,
        browser: undefined,
        sessionId: undefined
      };

      const click = await this.models.click.create(clickData);

      // Update link statistics
      const updateData: any = { clickCount: 1 };
      if (click.isUnique) {
        updateData.uniqueClickCount = 1;
      }

      await this.models.affiliateLink.updateStats(hash, updateData);

      // Log successful click and redirect
      logUtils.links.clicked(hash, link.userId, ipAddress, click.isUnique);
      logUtils.links.redirected(hash, link.originalUrl, Date.now() - startTime);
      logUtils.performance.requestEnd('GET', `/r/${hash}`, Date.now() - startTime, 302);

      // Redirect to original URL
      res.redirect(302, link.originalUrl);
    } catch (error) {
      const duration = Date.now() - startTime;
      linkLogger.error({ error, duration }, 'Error processing redirect');
      logUtils.performance.requestEnd('GET', '/r/:hash', duration, 500);
      sendInternalError(res);
    }
  };

  // Get recent links for dashboard
  getRecentLinks = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { limit = '10' } = req.query;

      const limitNum = parseInt(limit as string);

      linkLogger.debug({ 
        userId: user.id, 
        limit: limitNum 
      }, 'Recent links request started');

      const links = await this.models.affiliateLink.getRecentLinks(
        user.id,
        limitNum
      );

      const linksWithShortUrls = links.map(link => ({
        hash: link.hash,
        originalUrl: link.originalUrl,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/r/${link.hash}`,
        tag: link.tag,
        clickCount: link.clickCount,
        uniqueClickCount: link.uniqueClickCount,
        conversionCount: link.conversionCount,
        totalRevenue: link.totalRevenue,
        createdAt: link.createdAt
      }));

      const responseData = {
        recentLinks: linksWithShortUrls
      };

      // Log successful recent links retrieval
      linkLogger.info({ 
        userId: user.id, 
        recentLinkCount: linksWithShortUrls.length 
      }, 'Recent links retrieved successfully');
      logUtils.performance.requestEnd('GET', '/api/links/recent', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      linkLogger.error({ error, duration }, 'Error fetching recent links');
      logUtils.performance.requestEnd('GET', '/api/links/recent', duration, 500);
      sendInternalError(res);
    }
  };

  // Get top performing links
  getTopPerformingLinks = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { limit = '10' } = req.query;

      const limitNum = parseInt(limit as string);

      linkLogger.debug({ 
        userId: user.id, 
        limit: limitNum 
      }, 'Top performing links request started');

      const links = await this.models.affiliateLink.getTopPerformingLinks(
        user.id,
        limitNum
      );

      const linksWithShortUrls = links.map(link => ({
        hash: link.hash,
        originalUrl: link.originalUrl,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/r/${link.hash}`,
        tag: link.tag,
        clickCount: link.clickCount,
        uniqueClickCount: link.uniqueClickCount,
        conversionCount: link.conversionCount,
        totalRevenue: link.totalRevenue,
        createdAt: link.createdAt,
        // Performance metrics
        conversionRate: link.clickCount > 0 ? (link.conversionCount / link.clickCount) * 100 : 0,
        earningsPerClick: link.clickCount > 0 ? link.totalRevenue / link.clickCount : 0
      }));

      const responseData = {
        topLinks: linksWithShortUrls
      };

      // Log successful top links retrieval with performance insights
      const totalRevenue = linksWithShortUrls.reduce((sum, link) => sum + link.totalRevenue, 0);
      const totalClicks = linksWithShortUrls.reduce((sum, link) => sum + link.clickCount, 0);
      
      logUtils.links.performanceAnalyzed(user.id, linksWithShortUrls.length, totalRevenue / totalClicks || 0);
      logUtils.performance.requestEnd('GET', '/api/links/top-performing', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      linkLogger.error({ error, duration }, 'Error fetching top performing links');
      logUtils.performance.requestEnd('GET', '/api/links/top-performing', duration, 500);
      sendInternalError(res);
    }
  };

  // Get user statistics
  getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;

      linkLogger.debug({ userId: user.id }, 'User stats request started');

      const stats = await this.models.affiliateLink.getUserStats(user.id);

      // Calculate additional metrics
      const conversionRate = stats.totalClicks > 0 ? (stats.totalConversions / stats.totalClicks) * 100 : 0;
      const earningsPerClick = stats.totalClicks > 0 ? stats.totalRevenue / stats.totalClicks : 0;
      const uniqueClickRate = stats.totalClicks > 0 ? (stats.totalUniqueClicks / stats.totalClicks) * 100 : 0;

      const responseData = {
        stats: {
          ...stats,
          conversionRate: Math.round(conversionRate * 100) / 100,
          earningsPerClick: Math.round(earningsPerClick * 100) / 100,
          uniqueClickRate: Math.round(uniqueClickRate * 100) / 100
        }
      };

      // Log successful stats retrieval with key metrics
      logUtils.links.statsUpdated(
        'user_aggregate', 
        stats.totalClicks, 
        stats.totalUniqueClicks, 
        stats.totalRevenue
      );
      logUtils.performance.requestEnd('GET', '/api/links/stats', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      linkLogger.error({ error, duration }, 'Error fetching user stats');
      logUtils.performance.requestEnd('GET', '/api/links/stats', duration, 500);
      sendInternalError(res);
    }
  };
}
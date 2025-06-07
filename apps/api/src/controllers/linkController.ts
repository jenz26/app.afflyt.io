import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { ValidatedRequest } from '../middleware/validation';
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
import { validationSchemas } from '../schemas';
import { z } from 'zod';

// ===== 🚀 NEW v1.8.4: STRUCTURED LOGGING WITH PINO =====
// Create module-specific logger for link operations
const linkLogger = createModuleLogger('link');

// Type definitions for validated requests
type CreateLinkRequest = ValidatedRequest<z.infer<typeof validationSchemas.createAffiliateLink>> & AuthRequest;
type GetLinksRequest = AuthRequest & {
  query: z.infer<typeof validationSchemas.getLinks>;
};
type GetLinkByHashRequest = AuthRequest & {
  params: z.infer<typeof validationSchemas.paramHash>;
};
type LinkStatsRequest = AuthRequest & {
  query: z.infer<typeof validationSchemas.linkStats>;
};
type RedirectRequest = {
  params: z.infer<typeof validationSchemas.paramHash>;
  ip?: string;
  connection?: any;
  headers: any;
};

export class LinkController {
  constructor(private models: Models) {
    linkLogger.debug('LinkController initialized');
  }

  // Create new affiliate link
  create = async (req: CreateLinkRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Data is already validated by Zod middleware (URL format, Amazon domain, etc.)
      const { originalUrl, tag, amazonTagId, channelId, source, expiresAt } = req.body;
      const user = req.user!;

      linkLogger.debug({ 
        userId: user.id, 
        originalUrl, 
        tag,
        amazonTagId,
        channelId 
      }, 'Link creation request started');

      // Create affiliate link - no validation needed, Zod already handled it
      const linkData = {
        userId: user.id,
        originalUrl,
        tag: tag || undefined,
        amazonTagId,
        channelId,
        source,
        expiresAt,
        isActive: true
      };

      const affiliateLink = await this.models.affiliateLink.create(linkData);

      const linkResponse = {
        link: {
          hash: affiliateLink.hash,
          originalUrl: affiliateLink.originalUrl,
          shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/r/${affiliateLink.hash}`,
          tag: affiliateLink.tag,
          amazonTagId: affiliateLink.amazonTagId,
          channelId: affiliateLink.channelId,
          source: affiliateLink.source,
          isActive: affiliateLink.isActive,
          clickCount: affiliateLink.clickCount,
          uniqueClickCount: affiliateLink.uniqueClickCount,
          conversionCount: affiliateLink.conversionCount,
          totalRevenue: affiliateLink.totalRevenue,
          expiresAt: affiliateLink.expiresAt,
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

  
// Sostituire il metodo esistente con questa versione corretta

// Get user's affiliate links
getLinks = async (req: GetLinksRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const user = req.user!;
    // ✅ Query parameters already validated by Zod middleware
    const { limit, offset, sortBy, sortOrder, isActive, tag } = req.query;

    // 🚨 FIX: Convert string parameters to numbers for MongoDB
    const numericLimit = typeof limit === 'string' ? parseInt(limit, 10) : (limit || 50);
    const numericOffset = typeof offset === 'string' ? parseInt(offset, 10) : (offset || 0);

    // 🚨 FIX: Validate converted numbers
    if (isNaN(numericLimit) || numericLimit < 1 || numericLimit > 100) {
      linkLogger.warn({ 
        userId: user.id, 
        originalLimit: limit,
        parsedLimit: numericLimit
      }, 'Invalid limit parameter, using default');
      // Use default instead of erroring
      const safeLimit = 50;
      const safeOffset = isNaN(numericOffset) ? 0 : Math.max(0, numericOffset);
    } else if (isNaN(numericOffset) || numericOffset < 0) {
      linkLogger.warn({ 
        userId: user.id, 
        originalOffset: offset,
        parsedOffset: numericOffset
      }, 'Invalid offset parameter, using 0');
    }

    // Use safe, validated numeric values
    const safeLimit = isNaN(numericLimit) || numericLimit < 1 || numericLimit > 100 ? 50 : numericLimit;
    const safeOffset = isNaN(numericOffset) || numericOffset < 0 ? 0 : numericOffset;

    linkLogger.debug({ 
      userId: user.id, 
      limit: safeLimit, 
      offset: safeOffset,
      sortBy,
      sortOrder,
      originalParams: { limit, offset }
    }, 'User links request started');

    const links = await this.models.affiliateLink.findByUserId(
      user.id,
      safeLimit,  // ✅ Now passing actual number
      safeOffset  // ✅ Now passing actual number
    );

    const linksWithShortUrls = links.map(link => ({
      hash: link.hash,
      originalUrl: link.originalUrl,
      shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/r/${link.hash}`,
      tag: link.tag,
      amazonTagId: link.amazonTagId,
      channelId: link.channelId,
      source: link.source,
      isActive: link.isActive,
      clickCount: link.clickCount,
      uniqueClickCount: link.uniqueClickCount,
      conversionCount: link.conversionCount,
      totalRevenue: link.totalRevenue,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt
    }));

    const responseData = {
      links: linksWithShortUrls
    };

    const pagination = createPagination(safeLimit, safeOffset, linksWithShortUrls.length);

    // Log successful links retrieval
    linkLogger.info({ 
      userId: user.id, 
      linkCount: linksWithShortUrls.length,
      pagination: { limit: safeLimit, offset: safeOffset }
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
  getLinkByHash = async (req: GetLinkByHashRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Hash parameter already validated by Zod middleware
      const { hash } = req.params;
      const user = req.user!;

      linkLogger.debug({ 
        userId: user.id, 
        linkHash: hash 
      }, 'Link details request started');

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
          amazonTagId: link.amazonTagId,
          channelId: link.channelId,
          source: link.source,
          isActive: link.isActive,
          clickCount: link.clickCount,
          uniqueClickCount: link.uniqueClickCount,
          conversionCount: link.conversionCount,
          totalRevenue: link.totalRevenue,
          expiresAt: link.expiresAt,
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

  // Get recent links for dashboard
  getRecentLinks = async (req: LinkStatsRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { limit } = req.query;

      linkLogger.debug({ 
        userId: user.id, 
        limit 
      }, 'Recent links request started');

      const links = await this.models.affiliateLink.getRecentLinks(
        user.id,
        limit
      );

      const linksWithShortUrls = links.map(link => ({
        hash: link.hash,
        originalUrl: link.originalUrl,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/r/${link.hash}`,
        tag: link.tag,
        amazonTagId: link.amazonTagId,
        channelId: link.channelId,
        source: link.source,
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
  getTopPerformingLinks = async (req: LinkStatsRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const { limit, sortBy = 'revenue' } = req.query;

      linkLogger.debug({ 
        userId: user.id, 
        limit,
        sortBy 
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
        amazonTagId: link.amazonTagId,
        channelId: link.channelId,
        source: link.source,
        clickCount: link.clickCount,
        uniqueClickCount: link.uniqueClickCount,
        conversionCount: link.conversionCount,
        totalRevenue: link.totalRevenue,
        createdAt: link.createdAt,
        // Performance metrics
        conversionRate: link.clickCount > 0 ? (link.conversionCount / link.clickCount) * 100 : 0,
        earningsPerClick: link.clickCount > 0 ? link.totalRevenue / link.clickCount : 0
      }));

      // Sort based on validated sortBy parameter
      if (sortBy === 'conversionRate') {
        linksWithMetrics.sort((a, b) => b.conversionRate - a.conversionRate);
      } else if (sortBy === 'clicks') {
        linksWithMetrics.sort((a, b) => b.clickCount - a.clickCount);
      } else if (sortBy === 'conversions') {
        linksWithMetrics.sort((a, b) => b.conversionCount - a.conversionCount);
      } else {
        // Default: revenue
        linksWithMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
      }

      const responseData = {
        topLinks: linksWithMetrics
      };

      // Log successful top links retrieval with performance insights
      const totalRevenue = linksWithMetrics.reduce((sum, link) => sum + link.totalRevenue, 0);
      const totalClicks = linksWithMetrics.reduce((sum, link) => sum + link.clickCount, 0);
      
      logUtils.links.performanceAnalyzed(user.id, linksWithMetrics.length, totalRevenue / totalClicks || 0);
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
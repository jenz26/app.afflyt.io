import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AffiliateLink } from '../types';
import {
  sendSuccess,
  sendValidationError,
  sendNotFoundError,
  sendForbiddenError,
  sendInternalError,
  createPagination
} from '../utils/responseHelpers';

export class LinkController {
  constructor(private models: Models) {}

  // Create new affiliate link
  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { originalUrl, tag } = req.body;
      const user = req.user!;

      // Validation
      if (!originalUrl) {
        sendValidationError(res, 'Original URL is required');
        return;
      }

      // Validate URL format
      try {
        new URL(originalUrl);
      } catch {
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

      sendSuccess(res, linkResponse, {
        message: 'Affiliate link created successfully',
        statusCode: 201
      });
    } catch (error) {
      console.error('Create link error:', error);
      sendInternalError(res);
    }
  };

  // Get user's affiliate links
  getLinks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { limit = '50', offset = '0' } = req.query;

      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

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

      sendSuccess(res, responseData, { pagination });
    } catch (error) {
      console.error('Get links error:', error);
      sendInternalError(res);
    }
  };

  // Get link details by hash
  getLinkByHash = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { hash } = req.params;
      const user = req.user!;

      if (!hash) {
        sendValidationError(res, 'Hash parameter is required');
        return;
      }

      const link = await this.models.affiliateLink.findByHash(hash);

      if (!link) {
        sendNotFoundError(res, 'Link');
        return;
      }

      // Check if user owns this link
      if (link.userId !== user.id) {
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

      sendSuccess(res, linkResponse);
    } catch (error) {
      console.error('Get link by hash error:', error);
      sendInternalError(res);
    }
  };

  // Handle redirect (public endpoint)
  redirect = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hash } = req.params;

      if (!hash) {
        sendValidationError(res, 'Hash parameter is required');
        return;
      }

      // Find the affiliate link
      const link = await this.models.affiliateLink.findByHash(hash);

      if (!link || !link.isActive) {
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

      // Redirect to original URL
      res.redirect(302, link.originalUrl);
    } catch (error) {
      console.error('Redirect error:', error);
      sendInternalError(res);
    }
  };

  // Get recent links for dashboard
  getRecentLinks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { limit = '10' } = req.query;

      const links = await this.models.affiliateLink.getRecentLinks(
        user.id,
        parseInt(limit as string)
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

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Get recent links error:', error);
      sendInternalError(res);
    }
  };

  // Get top performing links
  getTopPerformingLinks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { limit = '10' } = req.query;

      const links = await this.models.affiliateLink.getTopPerformingLinks(
        user.id,
        parseInt(limit as string)
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

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Get top performing links error:', error);
      sendInternalError(res);
    }
  };

  // Get user statistics
  getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

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

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Get user stats error:', error);
      sendInternalError(res);
    }
  };
}
import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AffiliateLink } from '../types';

export class LinkController {
  constructor(private models: Models) {}

  // Create new affiliate link
  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { originalUrl, tag } = req.body;
      const user = req.user!;

      // Validation
      if (!originalUrl) {
        res.status(400).json({
          error: 'Original URL is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Validate URL format
      try {
        new URL(originalUrl);
      } catch {
        res.status(400).json({
          error: 'Invalid URL format',
          timestamp: new Date().toISOString()
        });
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

      res.status(201).json({
        success: true,
        data: {
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
        },
        message: 'Affiliate link created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Create link error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Get user's affiliate links
  getLinks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { limit = '50', offset = '0' } = req.query;

      const links = await this.models.affiliateLink.findByUserId(
        user.id,
        parseInt(limit as string),
        parseInt(offset as string)
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

      res.status(200).json({
        success: true,
        data: {
          links: linksWithShortUrls,
          pagination: {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            total: linksWithShortUrls.length
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get links error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Get link details by hash
  getLinkByHash = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { hash } = req.params;
      const user = req.user!;

      if (!hash) {
        res.status(400).json({
          error: 'Hash parameter is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const link = await this.models.affiliateLink.findByHash(hash);

      if (!link) {
        res.status(404).json({
          error: 'Link not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check if user owns this link
      if (link.userId !== user.id) {
        res.status(403).json({
          error: 'Access denied',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
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
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get link by hash error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Handle redirect (public endpoint)
  redirect = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hash } = req.params;

      if (!hash) {
        res.status(400).json({
          error: 'Hash parameter is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Find the affiliate link
      const link = await this.models.affiliateLink.findByHash(hash);

      if (!link || !link.isActive) {
        res.status(404).json({
          error: 'Link not found or inactive',
          timestamp: new Date().toISOString()
        });
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
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
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

      res.status(200).json({
        success: true,
        data: {
          recentLinks: linksWithShortUrls
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get recent links error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
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

      res.status(200).json({
        success: true,
        data: {
          topLinks: linksWithShortUrls
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get top performing links error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
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

      res.status(200).json({
        success: true,
        data: {
          stats: {
            ...stats,
            conversionRate: Math.round(conversionRate * 100) / 100,
            earningsPerClick: Math.round(earningsPerClick * 100) / 100,
            uniqueClickRate: Math.round(uniqueClickRate * 100) / 100
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };
}
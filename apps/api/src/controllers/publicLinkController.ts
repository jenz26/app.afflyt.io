import { Request, Response } from 'express';
import { Models } from '../models';
import { ValidatedRequest } from '../middleware/validation';
import { LinkPreviewResponse } from '../types';
import { logger, logUtils, createModuleLogger } from '../config/logger';
import {
  sendSuccess,
  sendNotFoundError,
  sendInternalError
} from '../utils/responseHelpers';
import { validationSchemas } from '../schemas';
import { z } from 'zod';

// ===== 🚀 PUBLIC LINK CONTROLLER v1.9.2 =====
// Handles preview pages and tracking for compliance-friendly redirects
const publicLogger = createModuleLogger('public-link');

// Type definitions for validated requests
type GetLinkForPreviewRequest = Request & {
  params: z.infer<typeof validationSchemas.paramHash>;
};

type TrackClickRequest = ValidatedRequest<z.infer<typeof validationSchemas.trackClick>>;

type DirectRedirectRequest = Request & {
  params: z.infer<typeof validationSchemas.paramHash>;
  ip?: string;
  connection?: any;
  headers: any;
};

// 🎯 NEW v1.9.2: Type per pixel tracking request
type TrackPixelRequest = Request & {
  query: z.infer<typeof validationSchemas.pixelTrack>;
};

export class PublicLinkController {
  constructor(private models: Models) {
    publicLogger.debug('PublicLinkController initialized');
  }

  // ===== 🎨 GET LINK DATA FOR PREVIEW PAGE =====
  /**
   * GET /api/public/links/:hash
   * Returns comprehensive data for preview page rendering
   */
  getLinkForPreview = async (req: GetLinkForPreviewRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Hash parameter already validated by Zod middleware
      const { hash } = req.params;

      publicLogger.debug({ 
        linkHash: hash,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }, 'Link preview data request started');

      // Find the affiliate link
      const link = await this.models.affiliateLink.findByHash(hash);

      if (!link || !link.isActive) {
        publicLogger.warn({ 
          linkHash: hash,
          ip: req.ip,
          linkExists: !!link,
          isActive: link?.isActive 
        }, 'Preview request failed: link not found or inactive');
        sendNotFoundError(res, 'Link not found or inactive');
        return;
      }

      // Check if link has expired
      if (link.expiresAt && new Date() > link.expiresAt) {
        publicLogger.warn({ 
          linkHash: hash,
          ip: req.ip,
          expiresAt: link.expiresAt 
        }, 'Preview request failed: link expired');
        sendNotFoundError(res, 'Link has expired');
        return;
      }

      // Get user branding data
      const userBranding = await this.models.user.getBrandingForPreview(link.userId);
      const userDisplayName = await this.models.user.getDisplayNameForPreview(link.userId);

      // Prepare response data
      const previewData: LinkPreviewResponse = {
        link: {
          hash: link.hash,
          originalUrl: link.originalUrl,
          tag: link.tag,
          amazonTagId: link.amazonTagId,
          channelId: link.channelId,
          source: link.source,
          isActive: link.isActive,
          expiresAt: link.expiresAt?.toISOString(),
          createdAt: link.createdAt.toISOString()
        },
        branding: userBranding,
        owner: {
          displayName: userDisplayName
        }
      };

      // Log successful preview data retrieval
      publicLogger.info({ 
        linkHash: hash,
        userId: link.userId,
        userDisplayName,
        hasCustomBranding: !!(userBranding.displayName || userBranding.logoUrl),
        duration: Date.now() - startTime
      }, 'Link preview data retrieved successfully');

      logUtils.performance.requestEnd('GET', `/api/public/links/${hash}`, Date.now() - startTime, 200);

      sendSuccess(res, previewData, {
        message: 'Link preview data retrieved successfully'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      publicLogger.error({ error, duration }, 'Error retrieving link preview data');
      logUtils.performance.requestEnd('GET', '/api/public/links/:hash', duration, 500);
      sendInternalError(res);
    }
  };

  // ===== 🎯 TRACK CLICK EVENT =====
  /**
   * POST /api/public/track/click
   * Records click event for analytics (server-side tracking)
   */
  trackClick = async (req: TrackClickRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Data already validated by Zod middleware
      const { hash, metadata } = req.body;

      publicLogger.debug({ 
        linkHash: hash,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata
      }, 'Click tracking request started');

      // Find the affiliate link
      const link = await this.models.affiliateLink.findByHash(hash);

      if (!link || !link.isActive) {
        publicLogger.warn({ 
          linkHash: hash,
          ip: req.ip
        }, 'Click tracking failed: link not found or inactive');
        sendNotFoundError(res, 'Link not found or inactive');
        return;
      }

      // Extract tracking information
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const referer = req.headers.referer || metadata?.referer;

      // Create click record
      const clickData = {
        linkHash: hash,
        userId: link.userId,
        ipAddress,
        userAgent,
        referer,
        // Additional metadata from frontend
        country: metadata?.country,
        device: metadata?.device,
        browser: metadata?.browser,
        sessionId: metadata?.sessionId
      };

      const click = await this.models.click.create(clickData);

      // Update link statistics
      const updateData: any = { clickCount: 1 };
      if (click.isUnique) {
        updateData.uniqueClickCount = 1;
      }

      await this.models.affiliateLink.updateStats(hash, updateData);

      // Update user entity statistics (Amazon tag and channel)
      if (link.amazonTagId) {
        await this.models.user.updateAmazonTagStats(link.userId, link.amazonTagId, { 
          totalClicks: 1 
        });
      }

      if (link.channelId) {
        await this.models.user.updateChannelStats(link.userId, link.channelId, { 
          totalClicks: 1 
        });
      }

      // Log successful click tracking
      logUtils.links.clicked(hash, link.userId, ipAddress, click.isUnique);
      
      publicLogger.info({ 
        linkHash: hash,
        userId: link.userId,
        isUnique: click.isUnique,
        clickId: click._id,
        duration: Date.now() - startTime
      }, 'Click tracked successfully');

      logUtils.performance.requestEnd('POST', '/api/public/track/click', Date.now() - startTime, 200);

      sendSuccess(res, { 
        tracked: true, 
        isUnique: click.isUnique 
      }, {
        message: 'Click tracked successfully'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      publicLogger.error({ error, duration }, 'Error tracking click');
      logUtils.performance.requestEnd('POST', '/api/public/track/click', duration, 500);
      sendInternalError(res);
    }
  };

  // ===== 🔗 DIRECT REDIRECT (BACKWARD COMPATIBILITY) =====
  /**
   * GET /api/public/redirect/:hash
   * Direct redirect for API clients (maintains backward compatibility)
   * Clearly separated from preview functionality
   */
  directRedirect = async (req: DirectRedirectRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Hash parameter already validated by Zod middleware
      const { hash } = req.params;

      publicLogger.debug({ 
        linkHash: hash,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }, 'Direct redirect request started');

      // Find the affiliate link
      const link = await this.models.affiliateLink.findByHash(hash);

      if (!link || !link.isActive) {
        publicLogger.warn({ 
          linkHash: hash,
          ip: req.ip
        }, 'Direct redirect failed: link not found or inactive');
        sendNotFoundError(res, 'Link not found or inactive');
        return;
      }

      // Check if link has expired
      if (link.expiresAt && new Date() > link.expiresAt) {
        publicLogger.warn({ 
          linkHash: hash,
          ip: req.ip,
          expiresAt: link.expiresAt 
        }, 'Direct redirect failed: link expired');
        sendNotFoundError(res, 'Link has expired');
        return;
      }

      // Extract user info for click tracking
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const referer = req.headers.referer;

      // Create click record (same as old redirect behavior)
      const clickData = {
        linkHash: hash,
        userId: link.userId,
        ipAddress,
        userAgent,
        referer,
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

      // Log successful direct redirect
      logUtils.links.clicked(hash, link.userId, ipAddress, click.isUnique);
      logUtils.links.redirected(hash, link.originalUrl, Date.now() - startTime);
      
      publicLogger.info({ 
        linkHash: hash,
        userId: link.userId,
        originalUrl: link.originalUrl,
        isUnique: click.isUnique,
        duration: Date.now() - startTime
      }, 'Direct redirect completed successfully');

      logUtils.performance.requestEnd('GET', `/api/public/redirect/${hash}`, Date.now() - startTime, 302);

      // Perform the redirect
      res.redirect(302, link.originalUrl);

    } catch (error) {
      const duration = Date.now() - startTime;
      publicLogger.error({ error, duration }, 'Error processing direct redirect');
      logUtils.performance.requestEnd('GET', '/api/public/redirect/:hash', duration, 500);
      sendInternalError(res);
    }
  };

  // ===== 🎯 NEW v1.9.2: PIXEL TRACKING =====
  /**
   * GET /api/public/pixel
   * Ritorna pixel 1x1 trasparente + tracking analytics asincrono
   * @version v1.9.2 - Pixel tracking disaccoppiato
   */
  trackPixel = async (req: TrackPixelRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Query params già validati da Zod middleware
      const { hash, t, ref, ua } = req.query;

      publicLogger.debug({ 
        linkHash: hash,
        timestamp: t,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        referer: ref
      }, 'Pixel tracking request started');

      // Background tracking (non-blocking) - Fire and forget
      setImmediate(async () => {
        try {
          // Find the affiliate link
          const link = await this.models.affiliateLink.findByHash(hash as string);

          if (!link || !link.isActive) {
            publicLogger.warn({ 
              linkHash: hash,
              ip: req.ip
            }, 'Pixel tracking: link not found or inactive');
            return;
          }

          // Extract tracking information
          const ipAddress = req.ip || 'unknown';
          const userAgent = (ua as string) || req.headers['user-agent'] || 'unknown';
          const referer = (ref as string) || req.headers.referer;

          // Create lightweight click record for pixel tracking
          const pixelData = {
            linkHash: hash as string,
            userId: link.userId,
            ipAddress,
            userAgent,
            referer,
            // Metadata per distinguere dal tracking normale
            country: undefined,
            device: undefined,
            browser: undefined,
            sessionId: `pixel_${t || Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };

          // Solo tracking, no redirect quindi meno critico se fallisce
          await this.models.click.create(pixelData);

          publicLogger.debug({ 
            linkHash: hash,
            userId: link.userId,
            isPixelTrack: true
          }, 'Pixel tracking completed successfully');

        } catch (pixelError) {
          // Log error ma non bloccare la response del pixel
          publicLogger.warn({ 
            error: pixelError,
            linkHash: hash 
          }, 'Pixel tracking failed silently');
        }
      });

      // Ritorna immediatamente il pixel 1x1 trasparente
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );

      const duration = Date.now() - startTime;
      
      publicLogger.info({ 
        linkHash: hash,
        pixelServed: true,
        duration
      }, 'Pixel served successfully');

      logUtils.performance.requestEnd('GET', '/api/public/pixel', duration, 200);

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*'
      });

      res.status(200).end(pixel);

    } catch (error) {
      const duration = Date.now() - startTime;
      publicLogger.error({ error, duration }, 'Error serving pixel');
      logUtils.performance.requestEnd('GET', '/api/public/pixel', duration, 500);
      
      // Anche in caso di errore, serve un pixel per non rompere la UI
      const fallbackPixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache'
      });
      
      res.status(200).end(fallbackPixel);
    }
  };
}
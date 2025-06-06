import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { ValidatedRequest } from '../middleware/validation';
import { ObjectId } from 'mongodb';
import { logger, logUtils, createModuleLogger } from '../config/logger';
import {
  sendSuccess,
  sendValidationError,
  sendNotFoundError,
  sendForbiddenError,
  sendConflictError,
  sendInternalError,
  createPagination
} from '../utils/responseHelpers';
import { validationSchemas } from '../schemas';
import { z } from 'zod';

// ===== 🚀 NEW v1.8.4: STRUCTURED LOGGING WITH PINO =====
// Create module-specific logger for conversion operations
const conversionLogger = createModuleLogger('conversion');

// Type definitions for validated requests
type GetUserConversionsRequest = AuthRequest & {
  query: z.infer<typeof validationSchemas.userConversionsQuery>;
};
type TrackConversionRequest = ValidatedRequest<z.infer<typeof validationSchemas.trackConversion>>;
type UpdateConversionStatusRequest = AuthRequest & {
  body: z.infer<typeof validationSchemas.updateConversion>;
  params: z.infer<typeof validationSchemas.paramConversionId>;
};

export class ConversionController {
  constructor(private models: Models) {
    conversionLogger.debug('ConversionController initialized');
  }

  // GET /api/user/conversions
  getUserConversions = async (req: GetUserConversionsRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Query parameters already validated by Zod middleware
      const {
        status,
        sortBy,
        sortOrder,
        limit,
        offset
      } = req.query;

      conversionLogger.debug({ 
        userId: user.id, 
        status, 
        sortBy, 
        sortOrder, 
        limit, 
        offset 
      }, 'User conversions request started');

      const filters = {
        status,
        sortBy,
        sortOrder,
        limit,
        offset
      };

      const conversions = await this.models.conversion.findByUserId(user.id, filters);

      // Enrich data with link information
      const conversionsWithLinkData = await Promise.all(
        conversions.map(async (conversion) => {
          const link = await this.models.affiliateLink.findByHash(
            // Note: We should have linkHash in conversion, for now use linkId
            conversion.linkId.toString()
          );

          return {
            id: conversion._id,
            linkId: conversion.linkId,
            linkHash: link?.hash || null,
            linkUrl: link?.originalUrl || null,
            linkTag: link?.tag || null,
            trackingId: conversion.trackingId,
            payoutAmount: conversion.payoutAmount,
            advertiserRevenue: conversion.advertiserRevenue,
            status: conversion.status,
            conversionTimestamp: conversion.conversionTimestamp,
            ipAddress: conversion.ipAddress,
            orderId: conversion.orderId,
            notes: conversion.notes,
            createdAt: conversion.createdAt,
            updatedAt: conversion.updatedAt
          };
        })
      );

      const responseData = {
        conversions: conversionsWithLinkData
      };

      const pagination = createPagination(limit, offset, conversionsWithLinkData.length);

      // Log successful conversion retrieval
      conversionLogger.info({ 
        userId: user.id, 
        conversionCount: conversionsWithLinkData.length, 
        filters 
      }, 'User conversions retrieved successfully');
      logUtils.performance.requestEnd('GET', '/api/user/conversions', Date.now() - startTime, 200);

      sendSuccess(res, responseData, { pagination });
    } catch (error) {
      const duration = Date.now() - startTime;
      conversionLogger.error({ error, duration }, 'Error fetching user conversions');
      logUtils.performance.requestEnd('GET', '/api/user/conversions', duration, 500);
      sendInternalError(res);
    }
  };

  // POST /track/conversion - Public endpoint for postback/pixel
  trackConversion = async (req: TrackConversionRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Data is already validated by Zod middleware
      const {
        trackingId,
        payoutAmount,
        advertiserRevenue,
        orderId,
        notes
      } = req.body;

      conversionLogger.debug({ 
        trackingId, 
        payoutAmount, 
        advertiserRevenue, 
        orderId,
        ip: req.ip 
      }, 'Conversion tracking request started');

      // Find associated click via trackingId
      const click = await this.models.click.findByTrackingId(trackingId);

      if (!click) {
        conversionLogger.warn({ trackingId }, 'Conversion tracking failed: click not found');
        sendNotFoundError(res, 'Click not found for the provided trackingId');
        return;
      }

      // Find associated link
      const link = await this.models.affiliateLink.findByHash(click.linkHash);
      
      if (!link) {
        conversionLogger.warn({ 
          trackingId, 
          linkHash: click.linkHash 
        }, 'Conversion tracking failed: link not found');
        sendNotFoundError(res, 'Link');
        return;
      }

      // Check if conversion already exists
      const existingConversion = await this.models.conversion.findByTrackingId(trackingId);
      
      if (existingConversion) {
        conversionLogger.warn({ 
          trackingId, 
          existingConversionId: existingConversion._id 
        }, 'Conversion tracking failed: duplicate conversion');
        logUtils.conversions.duplicate(trackingId, existingConversion._id!.toString());
        sendConflictError(res, 'Conversion already exists for this trackingId');
        return;
      }

      // Create conversion
      const conversionData = {
        linkId: link._id!,
        userId: link.userId,
        trackingId,
        payoutAmount,
        advertiserRevenue,
        status: 'pending' as const,
        conversionTimestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        orderId,
        notes
      };

      const conversion = await this.models.conversion.create(conversionData);

      // Update link statistics
      await this.models.affiliateLink.updateStats(link.hash, {
        conversionCount: 1,
        totalRevenue: payoutAmount
      });

      const responseData = {
        conversionId: conversion._id,
        trackingId: conversion.trackingId,
        status: conversion.status
      };

      // Log successful conversion tracking
      logUtils.conversions.tracked(
        link.userId, 
        link._id!.toString(), 
        trackingId, 
        payoutAmount
      );
      logUtils.performance.requestEnd('POST', '/track/conversion', Date.now() - startTime, 201);

      sendSuccess(res, responseData, {
        message: 'Conversion tracked successfully',
        statusCode: 201
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      conversionLogger.error({ error, duration }, 'Error tracking conversion');
      logUtils.performance.requestEnd('POST', '/track/conversion', duration, 500);
      sendInternalError(res);
    }
  };

  // PATCH /api/user/conversions/:conversionId - Update conversion status (admin only future)
  updateConversionStatus = async (req: UpdateConversionStatusRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      // ✅ Parameters and body already validated by Zod middleware
      const { conversionId } = req.params;
      const { status, notes } = req.body;

      conversionLogger.debug({ 
        userId: user.id, 
        conversionId, 
        newStatus: status, 
        adminRole: user.role 
      }, 'Conversion status update request started');

      // Only admins can modify conversion status
      if (user.role !== 'admin') {
        conversionLogger.warn({ 
          userId: user.id, 
          role: user.role, 
          conversionId 
        }, 'Conversion status update denied: insufficient permissions');
        sendForbiddenError(res, 'Access denied. Admin role required.');
        return;
      }

      // Note: We'll use a fallback status since we don't have a findById method
      const oldStatus = 'unknown'; // We could implement this later if needed

      const updated = await this.models.conversion.updateStatus(
        new ObjectId(conversionId),
        status,
        notes
      );

      if (!updated) {
        conversionLogger.warn({ 
          userId: user.id, 
          conversionId 
        }, 'Conversion status update failed: conversion not found');
        sendNotFoundError(res, 'Conversion');
        return;
      }

      // Log successful status update  
      logUtils.conversions.updated(conversionId, oldStatus, status, user.id);
      logUtils.performance.requestEnd('PATCH', `/api/user/conversions/${conversionId}`, Date.now() - startTime, 200);

      sendSuccess(res, null, {
        message: 'Conversion status updated successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      conversionLogger.error({ error, duration }, 'Error updating conversion status');
      logUtils.performance.requestEnd('PATCH', `/api/user/conversions/:conversionId`, duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/conversions/stats - Conversion statistics for dashboard widget
  getConversionStats = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;

      conversionLogger.debug({ userId: user.id }, 'Conversion stats request started');

      const stats = await this.models.conversion.getUserConversionStats(user.id);

      const responseData = { stats };

      // Log successful stats retrieval
      logUtils.conversions.revenueCalculated(
        user.id, 
        'current', 
        stats.totalRevenue, 
        stats.approvedConversions
      );
      logUtils.performance.requestEnd('GET', '/api/user/conversions/stats', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      conversionLogger.error({ error, duration }, 'Error fetching conversion stats');
      logUtils.performance.requestEnd('GET', '/api/user/conversions/stats', duration, 500);
      sendInternalError(res);
    }
  };
}
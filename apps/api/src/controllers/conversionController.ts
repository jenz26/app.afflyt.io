import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
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

// ===== 🚀 NEW v1.8.4: STRUCTURED LOGGING WITH PINO =====
// Create module-specific logger for conversion operations
const conversionLogger = createModuleLogger('conversion');

export class ConversionController {
  constructor(private models: Models) {
    conversionLogger.debug('ConversionController initialized');
  }

  // GET /api/user/conversions
  getUserConversions = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const {
        status,
        sortBy = 'conversionTimestamp',
        sortOrder = 'desc',
        limit = '50',
        offset = '0'
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
        status: status as 'pending' | 'approved' | 'rejected' | undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const conversions = await this.models.conversion.findByUserId(user.id, filters);

      // Arricchisci i dati con informazioni sui link
      const conversionsWithLinkData = await Promise.all(
        conversions.map(async (conversion) => {
          const link = await this.models.affiliateLink.findByHash(
            // Nota: dovremmo avere linkHash nel conversion, per ora useremo linkId
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

      const pagination = createPagination(filters.limit, filters.offset, conversionsWithLinkData.length);

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

  // POST /track/conversion - Public endpoint per postback/pixel
  trackConversion = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
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

      // Validazione parametri obbligatori
      if (!trackingId || payoutAmount === undefined) {
        conversionLogger.warn({ trackingId, payoutAmount }, 'Conversion tracking failed: missing required fields');
        sendValidationError(res, 'trackingId and payoutAmount are required');
        return;
      }

      // Trova il click associato tramite trackingId
      const click = await this.models.click.findByTrackingId(trackingId);

      if (!click) {
        conversionLogger.warn({ trackingId }, 'Conversion tracking failed: click not found');
        sendNotFoundError(res, 'Click not found for the provided trackingId');
        return;
      }

      // Trova il link associato
      const link = await this.models.affiliateLink.findByHash(click.linkHash);
      
      if (!link) {
        conversionLogger.warn({ 
          trackingId, 
          linkHash: click.linkHash 
        }, 'Conversion tracking failed: link not found');
        sendNotFoundError(res, 'Link');
        return;
      }

      // Verifica se la conversione esiste già
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

      // Crea la conversione
      const conversionData = {
        linkId: link._id!,
        userId: link.userId,
        trackingId,
        payoutAmount: parseFloat(payoutAmount),
        advertiserRevenue: advertiserRevenue ? parseFloat(advertiserRevenue) : undefined,
        status: 'pending' as const,
        conversionTimestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        orderId: orderId || undefined,
        notes: notes || undefined
      };

      const conversion = await this.models.conversion.create(conversionData);

      // Aggiorna le statistiche del link
      await this.models.affiliateLink.updateStats(link.hash, {
        conversionCount: 1,
        totalRevenue: conversionData.payoutAmount
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
        conversionData.payoutAmount
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

  // PATCH /api/user/conversions/:conversionId - Aggiorna stato conversione (admin only future)
  updateConversionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { conversionId } = req.params;
      const { status, notes } = req.body;

      conversionLogger.debug({ 
        userId: user.id, 
        conversionId, 
        newStatus: status, 
        adminRole: user.role 
      }, 'Conversion status update request started');

      // Solo admin possono modificare lo stato delle conversioni
      if (user.role !== 'admin') {
        conversionLogger.warn({ 
          userId: user.id, 
          role: user.role, 
          conversionId 
        }, 'Conversion status update denied: insufficient permissions');
        sendForbiddenError(res, 'Access denied. Admin role required.');
        return;
      }

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        conversionLogger.warn({ 
          userId: user.id, 
          conversionId, 
          invalidStatus: status 
        }, 'Conversion status update failed: invalid status');
        sendValidationError(res, 'Valid status is required (pending, approved, rejected)');
        return;
      }

      // Get current conversion for logging (we'll skip this for now since we need more context)
      // const currentConversion = await this.models.conversion.findByConversionId(conversionId);
      // For now, we'll just log the update without the old status
      const oldStatus = 'unknown';

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
      if (conversionId) {
        logUtils.conversions.updated(conversionId, 'unknown', status, user.id);
      }
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

  // GET /api/user/conversions/stats - Statistiche conversioni per widget dashboard
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
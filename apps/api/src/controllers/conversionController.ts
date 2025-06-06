import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { ObjectId } from 'mongodb';
import {
  sendSuccess,
  sendValidationError,
  sendNotFoundError,
  sendForbiddenError,
  sendConflictError,
  sendInternalError,
  createPagination
} from '../utils/responseHelpers';

export class ConversionController {
  constructor(private models: Models) {}

  // GET /api/user/conversions
  getUserConversions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const {
        status,
        sortBy = 'conversionTimestamp',
        sortOrder = 'desc',
        limit = '50',
        offset = '0'
      } = req.query;

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

      sendSuccess(res, responseData, { pagination });
    } catch (error) {
      console.error('Error fetching user conversions:', error);
      sendInternalError(res);
    }
  };

  // POST /track/conversion - Public endpoint per postback/pixel
  trackConversion = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        trackingId,
        payoutAmount,
        advertiserRevenue,
        orderId,
        notes
      } = req.body;

      // Validazione parametri obbligatori
      if (!trackingId || payoutAmount === undefined) {
        sendValidationError(res, 'trackingId and payoutAmount are required');
        return;
      }

      // Trova il click associato tramite trackingId
      const click = await this.models.click.findByTrackingId(trackingId);

      if (!click) {
        sendNotFoundError(res, 'Click not found for the provided trackingId');
        return;
      }

      // Trova il link associato
      const link = await this.models.affiliateLink.findByHash(click.linkHash);
      
      if (!link) {
        sendNotFoundError(res, 'Link');
        return;
      }

      // Verifica se la conversione esiste già
      const existingConversion = await this.models.conversion.findByTrackingId(trackingId);
      
      if (existingConversion) {
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

      sendSuccess(res, responseData, {
        message: 'Conversion tracked successfully',
        statusCode: 201
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
      sendInternalError(res);
    }
  };

  // PATCH /api/user/conversions/:conversionId - Aggiorna stato conversione (admin only future)
  updateConversionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { conversionId } = req.params;
      const { status, notes } = req.body;

      // Solo admin possono modificare lo stato delle conversioni
      if (user.role !== 'admin') {
        sendForbiddenError(res, 'Access denied. Admin role required.');
        return;
      }

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        sendValidationError(res, 'Valid status is required (pending, approved, rejected)');
        return;
      }

      const updated = await this.models.conversion.updateStatus(
        new ObjectId(conversionId),
        status,
        notes
      );

      if (!updated) {
        sendNotFoundError(res, 'Conversion');
        return;
      }

      sendSuccess(res, null, {
        message: 'Conversion status updated successfully'
      });
    } catch (error) {
      console.error('Error updating conversion status:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/conversions/stats - Statistiche conversioni per widget dashboard
  getConversionStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      const stats = await this.models.conversion.getUserConversionStats(user.id);

      const responseData = { stats };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching conversion stats:', error);
      sendInternalError(res);
    }
  };
}
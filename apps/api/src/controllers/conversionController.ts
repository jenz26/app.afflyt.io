import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { ObjectId } from 'mongodb';

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

      res.status(200).json({
        success: true,
        data: {
          conversions: conversionsWithLinkData,
          pagination: {
            limit: filters.limit,
            offset: filters.offset,
            total: conversionsWithLinkData.length
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching user conversions:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
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
        res.status(400).json({
          error: 'trackingId and payoutAmount are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Trova il click associato tramite trackingId
      const click = await this.models.click.findByTrackingId(trackingId);

      if (!click) {
        res.status(404).json({
          error: 'Click not found for the provided trackingId',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Trova il link associato
      const link = await this.models.affiliateLink.findByHash(click.linkHash);
      
      if (!link) {
        res.status(404).json({
          error: 'Link not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Verifica se la conversione esiste già
      const existingConversion = await this.models.conversion.findByTrackingId(trackingId);
      
      if (existingConversion) {
        res.status(409).json({
          error: 'Conversion already exists for this trackingId',
          timestamp: new Date().toISOString()
        });
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

      res.status(201).json({
        success: true,
        data: {
          conversionId: conversion._id,
          trackingId: conversion.trackingId,
          status: conversion.status
        },
        message: 'Conversion tracked successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
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
        res.status(403).json({
          error: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        res.status(400).json({
          error: 'Valid status is required (pending, approved, rejected)',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updated = await this.models.conversion.updateStatus(
        new ObjectId(conversionId),
        status,
        notes
      );

      if (!updated) {
        res.status(404).json({
          error: 'Conversion not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Conversion status updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating conversion status:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/user/conversions/stats - Statistiche conversioni per widget dashboard
  getConversionStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      const stats = await this.models.conversion.getUserConversionStats(user.id);

      res.status(200).json({
        success: true,
        data: { stats },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching conversion stats:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };
}
import { Router } from 'express';
import { PublicLinkController } from '../controllers/publicLinkController';
import { 
  createConditionalGeneralLimiter 
} from '../middleware/rateLimiter';
import { validateParams, validateBody, validateQuery } from '../middleware/validation';
import { validationSchemas } from '../schemas';
import { Models } from '../models';

// ===== 🚀 PUBLIC LINKS API FOR PREVIEW PAGES =====
// v1.9.2: Enhanced with pixel tracking and security features
// This replaces the old redirect system with a compliance-friendly approach

export const createPublicLinkRoutes = (models: Models): Router => {
  const router = Router();
  const publicLinkController = new PublicLinkController(models);
  
  // ===== RATE LIMITING FOR PUBLIC ENDPOINTS =====
  const publicLimiter = createConditionalGeneralLimiter();

  // ===== 🎨 LINK DATA FOR PREVIEW PAGES =====
  /**
   * GET /api/public/links/:hash
   * Returns link data + user branding for preview page rendering
   * Used by Next.js Server Components to build compliance-friendly preview pages
   * 
   * @version v1.9.2 - Enhanced with comprehensive branding support
   */
  router.get('/links/:hash', 
    publicLimiter,
    validateParams(validationSchemas.paramHash), 
    publicLinkController.getLinkForPreview
  );

  // ===== 🎯 CLICK TRACKING (Server-Side) =====
  /**
   * POST /api/public/track/click
   * Records a click event for analytics (called by preview page)
   * More reliable than client-side tracking
   * 
   * @version v1.9.2 - Enhanced with security check metadata
   */
  router.post('/track/click',
    publicLimiter,
    validateBody(validationSchemas.trackClick),
    publicLinkController.trackClick
  );

  // ===== 🎯 NEW v1.9.2: PIXEL TRACKING =====
  /**
   * GET /api/public/pixel
   * Invisible pixel for async analytics tracking (disaccoppiato dal rendering)
   * Ritorna un pixel 1x1 trasparente + registra analytics
   * 
   * Features:
   * - Non-blocking performance
   * - Cache-busting con timestamp
   * - Resilient error handling
   * - CORS-enabled for cross-origin
   */
  router.get('/pixel',
    publicLimiter,
    validateQuery(validationSchemas.pixelTrack),
    publicLinkController.trackPixel
  );

  // ===== 🔗 DIRECT REDIRECT (BACKWARD COMPATIBILITY) =====
  /**
   * GET /api/public/redirect/:hash  
   * Direct redirect for API clients that need the old behavior
   * This maintains backward compatibility while being clearly marked as redirect
   * 
   * @deprecated Prefer using preview pages for better compliance
   */
  router.get('/redirect/:hash',
    publicLimiter,
    validateParams(validationSchemas.paramHash),
    publicLinkController.directRedirect
  );

  // ===== 🛡️ HEALTH CHECK =====
  /**
   * GET /api/public/health
   * Health check endpoint for monitoring
   */
  router.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.9.2',
      uptime: process.uptime()
    });
  });

  return router;
};
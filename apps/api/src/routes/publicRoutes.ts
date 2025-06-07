import { Router } from 'express';
import { PublicLinkController } from '../controllers/publicLinkController';
import { 
  createConditionalGeneralLimiter 
} from '../middleware/rateLimiter';
import { validateParams, validateBody } from '../middleware/validation';
import { validationSchemas } from '../schemas';
import { Models } from '../models';

// ===== 🚀 NEW v1.8.9: PUBLIC LINKS API FOR PREVIEW PAGES =====
// This replaces the old redirect system with a compliance-friendly approach

export const createPublicLinkRoutes = (models: Models): Router => {
  const router = Router();
  const publicLinkController = new PublicLinkController(models);
  
  // ===== RATE LIMITING FOR PUBLIC ENDPOINTS =====
  const publicLimiter = createConditionalGeneralLimiter();

  // ===== 🎨 NEW v1.8.9: LINK DATA FOR PREVIEW PAGES =====
  /**
   * GET /api/public/links/:hash
   * Returns link data + user branding for preview page rendering
   * Used by Next.js Server Components to build compliance-friendly preview pages
   */
  router.get('/links/:hash', 
    publicLimiter,
    validateParams(validationSchemas.paramHash), 
    publicLinkController.getLinkForPreview
  );

  // ===== 🎯 NEW v1.8.9: CLICK TRACKING =====
  /**
   * POST /api/public/track/click
   * Records a click event for analytics (called by preview page)
   * More reliable than client-side tracking
   */
  router.post('/track/click',
    publicLimiter,
    validateBody(validationSchemas.trackClick),
    publicLinkController.trackClick
  );

  // ===== 🔗 OPTIONAL: DIRECT REDIRECT FOR API CLIENTS =====
  /**
   * GET /api/public/redirect/:hash  
   * Direct redirect for API clients that need the old behavior
   * This maintains backward compatibility while being clearly marked as redirect
   */
  router.get('/redirect/:hash',
    publicLimiter,
    validateParams(validationSchemas.paramHash),
    publicLinkController.directRedirect
  );

  return router;
};
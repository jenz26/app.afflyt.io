// ===== 🔧 UPDATED linkRoutes.ts - Remove Old Redirect System =====

import { Router } from 'express';
import { LinkController } from '../controllers/linkController';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth';
import { 
  createConditionalAPILimiter, 
  createConditionalGeneralLimiter 
} from '../middleware/rateLimiter';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { validationSchemas } from '../schemas';
import { Models } from '../models';

export const createLinkRoutes = (models: Models): Router => {
  const router = Router();
  const linkController = new LinkController(models);
  
  // ===== 🚀 v1.8.1: CONDITIONAL RATE LIMITERS =====
  const apiLimiter = createConditionalAPILimiter();
  const generalLimiter = createConditionalGeneralLimiter();

  // ===== 🔒 v1.8.5: ZOD VALIDATION + RATE LIMITING =====

  // ===== PROTECTED ROUTES (JWT Required) =====
  router.post('/', 
    authenticateJWT(models), 
    apiLimiter, 
    validateBody(validationSchemas.createAffiliateLink), 
    linkController.create
  );
  router.get('/', 
    authenticateJWT(models), 
    validateQuery(validationSchemas.getLinks), 
    linkController.getLinks
  );
  router.get('/recent', 
    authenticateJWT(models), 
    validateQuery(validationSchemas.linkStats), 
    linkController.getRecentLinks
  );
  router.get('/top-performing', 
    authenticateJWT(models), 
    validateQuery(validationSchemas.linkStats), 
    linkController.getTopPerformingLinks
  );
  router.get('/stats', 
    authenticateJWT(models), 
    linkController.getUserStats
  );
  router.get('/:hash', 
    authenticateJWT(models), 
    validateParams(validationSchemas.paramHash), 
    linkController.getLinkByHash
  );

  // ===== API KEY ROUTES (External Integrations) =====
  router.post('/api', 
    authenticateApiKey(models), 
    apiLimiter, 
    validateBody(validationSchemas.createAffiliateLink), 
    linkController.create
  );
  router.get('/api', 
    authenticateApiKey(models), 
    validateQuery(validationSchemas.getLinks), 
    linkController.getLinks
  );
  router.get('/api/recent', 
    authenticateApiKey(models), 
    validateQuery(validationSchemas.linkStats), 
    linkController.getRecentLinks
  );
  router.get('/api/top-performing', 
    authenticateApiKey(models), 
    validateQuery(validationSchemas.linkStats), 
    linkController.getTopPerformingLinks
  );
  router.get('/api/stats', 
    authenticateApiKey(models), 
    linkController.getUserStats
  );
  router.get('/api/:hash', 
    authenticateApiKey(models), 
    validateParams(validationSchemas.paramHash), 
    linkController.getLinkByHash
  );

  return router;
};

// ===== 🗑️ REMOVED: createRedirectRoutes =====
// The old redirect system has been completely removed and replaced with:
// - GET /api/public/links/:hash for preview page data
// - POST /api/public/track/click for click tracking  
// - GET /api/public/redirect/:hash for backward compatibility

// ===== 📝 MIGRATION NOTE =====
// Old endpoint: GET /r/:hash (302 redirect) - REMOVED for compliance
// New system:
// 1. Next.js page /r/[hash] calls GET /api/public/links/:hash for data
// 2. Preview page calls POST /api/public/track/click for analytics
// 3. User clicks button → direct link to Amazon (no intermediate redirect)
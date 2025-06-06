import { Router } from 'express';
import { LinkController } from '../controllers/linkController';
import { authenticateJWT, authenticateApiKey, optionalAuth } from '../middleware/auth';
import { 
  createConditionalAPILimiter, 
  createConditionalGeneralLimiter 
} from '../middleware/rateLimiter';
import { Models } from '../models';

export const createLinkRoutes = (models: Models): Router => {
  const router = Router();
  const linkController = new LinkController(models);
  
  // ===== 🚀 NEW v1.8.1: CONDITIONAL RATE LIMITERS =====
  const apiLimiter = createConditionalAPILimiter();
  const generalLimiter = createConditionalGeneralLimiter();

  // ===== PROTECTED ROUTES (JWT Required) =====
  // Apply API rate limiting to link creation and data-intensive operations
  router.post('/', authenticateJWT(models), apiLimiter, linkController.create);
  router.get('/', authenticateJWT(models), linkController.getLinks);
  router.get('/recent', authenticateJWT(models), linkController.getRecentLinks);
  router.get('/top-performing', authenticateJWT(models), linkController.getTopPerformingLinks);
  router.get('/stats', authenticateJWT(models), linkController.getUserStats);
  router.get('/:hash', authenticateJWT(models), linkController.getLinkByHash);

  // ===== API KEY ROUTES (External Integrations) =====
  // Higher rate limiting for external API access
  router.post('/api', authenticateApiKey(models), apiLimiter, linkController.create);
  router.get('/api', authenticateApiKey(models), linkController.getLinks);
  router.get('/api/recent', authenticateApiKey(models), linkController.getRecentLinks);
  router.get('/api/top-performing', authenticateApiKey(models), linkController.getTopPerformingLinks);
  router.get('/api/stats', authenticateApiKey(models), linkController.getUserStats);
  router.get('/api/:hash', authenticateApiKey(models), linkController.getLinkByHash);

  return router;
};

export const createRedirectRoutes = (models: Models): Router => {
  const router = Router();
  const linkController = new LinkController(models);
  
  // ===== 🚀 NEW v1.8.1: CONDITIONAL RATE LIMITER FOR REDIRECTS =====
  const redirectLimiter = createConditionalGeneralLimiter();

  // ===== PUBLIC REDIRECT ROUTE =====
  // Apply general rate limiting to prevent redirect abuse
  // Note: This is critical for preventing DDoS on redirect endpoints
  router.get('/:hash', redirectLimiter, linkController.redirect);

  return router;
};
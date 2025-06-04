import { Router } from 'express';
import { LinkController } from '../controllers/linkController';
import { authenticateJWT, authenticateApiKey, optionalAuth } from '../middleware/auth';
import { createAPILimiter, createGeneralLimiter } from '../middleware/rateLimiter';
import { Models } from '../models';

export const createLinkRoutes = (models: Models): Router => {
  const router = Router();
  const linkController = new LinkController(models);
  const apiLimiter = createAPILimiter();
  const generalLimiter = createGeneralLimiter();

  // Protected routes (JWT or API Key required)
  router.post('/', authenticateJWT(models), apiLimiter.middleware(), linkController.create);
  router.get('/', authenticateJWT(models), linkController.getLinks);
  router.get('/recent', authenticateJWT(models), linkController.getRecentLinks);
  router.get('/top-performing', authenticateJWT(models), linkController.getTopPerformingLinks);
  router.get('/stats', authenticateJWT(models), linkController.getUserStats);
  router.get('/:hash', authenticateJWT(models), linkController.getLinkByHash);

  // API Key routes (for external integrations)
  router.post('/api', authenticateApiKey(models), apiLimiter.middleware(), linkController.create);
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
  const generalLimiter = createGeneralLimiter();

  // Public redirect route (no authentication required)
  router.get('/:hash', generalLimiter.middleware(), linkController.redirect);

  return router;
};
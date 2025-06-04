import { Router } from 'express';
import { Models } from '../models';
import { UserController } from '../controllers/userController';
import { DashboardController } from '../controllers/dashboardController';
import { AnalyticsController } from '../controllers/analyticsController';
import { ConversionController } from '../controllers/conversionController';
import { authenticateJWT } from '../middleware/auth';

export const createUserRoutes = (models: Models): Router => {
  const router = Router();
  const userController = new UserController(models);
  const dashboardController = new DashboardController(models);
  const analyticsController = new AnalyticsController(models);
  const conversionController = new ConversionController(models);

  // Applica autenticazione JWT a tutte le routes user
  router.use(authenticateJWT(models));

  // User Profile Management
  router.get('/me', userController.getProfile);
  router.put('/me', userController.updateProfile);

  // API Keys Management
  router.post('/keys', userController.createApiKey);
  router.get('/keys', userController.getApiKeys);
  router.patch('/keys/:keyId', userController.updateApiKey);
  router.delete('/keys/:keyId', userController.deleteApiKey);

  // Dashboard Layout Management
  router.get('/dashboard-layout', dashboardController.getDashboardLayout);
  router.put('/dashboard-layout', dashboardController.updateDashboardLayout);

  // Analytics Endpoints
  router.get('/analytics/summary', analyticsController.getSummary);
  router.get('/analytics/clicks-trend', analyticsController.getClicksTrend);
  router.get('/analytics/revenue-trend', analyticsController.getRevenueTrend);
  router.get('/analytics/distribution/geo', analyticsController.getGeoDistribution);
  router.get('/analytics/distribution/device', analyticsController.getDeviceDistribution);
  router.get('/analytics/distribution/browser', analyticsController.getBrowserDistribution);
  router.get('/analytics/distribution/referer', analyticsController.getRefererDistribution);
  router.get('/analytics/distribution/subid', analyticsController.getSubIdDistribution);
  router.get('/analytics/top-performing-links', analyticsController.getTopPerformingLinks);

  // User Links Management (updated endpoints)
  router.get('/links', async (req, res) => {
    // Redirect to existing linkController for now, we'll update this
    // This maintains backward compatibility while we transition
    const linkController = require('../controllers/linkController').LinkController;
    const controller = new linkController(models);
    return controller.getLinks(req, res);
  });

  router.get('/links/:hash', async (req, res) => {
    const linkController = require('../controllers/linkController').LinkController;
    const controller = new linkController(models);
    return controller.getLinkByHash(req, res);
  });

  // Conversions Management
  router.get('/conversions', conversionController.getUserConversions);
  router.get('/conversions/stats', conversionController.getConversionStats);
  router.patch('/conversions/:conversionId', conversionController.updateConversionStatus);

  return router;
};
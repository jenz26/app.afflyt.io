import { Router } from 'express';
import { Models } from '../models';
import { ConversionController } from '../controllers/conversionController';

export const createTrackingRoutes = (models: Models): Router => {
  const router = Router();
  const conversionController = new ConversionController(models);

  // Public conversion tracking endpoint (postback/pixel)
  router.post('/conversion', conversionController.trackConversion);

  return router;
};
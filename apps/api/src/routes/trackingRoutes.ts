import { Router } from 'express';
import { Models } from '../models';
import { ConversionController } from '../controllers/conversionController';
import { validateBody } from '../middleware/validation';
import { validationSchemas } from '../schemas';

export const createTrackingRoutes = (models: Models): Router => {
  const router = Router();
  const conversionController = new ConversionController(models);

  // ===== 🔒 v1.8.5: ZOD VALIDATION FOR PUBLIC ENDPOINTS =====
  
  // Public conversion tracking endpoint (postback/pixel)
  // This endpoint is called by external systems (Amazon, advertisers) to track conversions
  router.post('/conversion', 
    validateBody(validationSchemas.trackConversion), 
    conversionController.trackConversion
  );

  return router;
};
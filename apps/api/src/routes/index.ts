import { Router } from 'express';
import { Models } from '../models';
import { createAuthRoutes } from './authRoutes';
import { createLinkRoutes, createRedirectRoutes } from './linkRoutes';
import { createUserRoutes } from './userRoutes';
import { createTrackingRoutes } from './trackingRoutes';
import { createSupportRoutes } from './supportRoutes'; // ✨ NEW: Support Routes

export const createRoutes = (models: Models): Router => {
  const router = Router();

  // API v1 routes (legacy - manteniamo per compatibilità)
  router.use('/auth', createAuthRoutes(models));
  router.use('/links', createLinkRoutes(models));

  return router;
};

export const createAPIRoutes = (models: Models): Router => {
  const router = Router();

  // New API structure for v1.3.0+
  router.use('/user', createUserRoutes(models));
  router.use('/support', createSupportRoutes(models)); // ✨ NEW: Support Routes

  return router;
};

export const createPublicRoutes = (models: Models): Router => {
  const router = Router();

  // Public redirect routes (short URLs)
  router.use('/r', createRedirectRoutes(models));
  
  // Public tracking routes
  router.use('/track', createTrackingRoutes(models));

  return router;
};
import { Router } from 'express';
import { Models } from '../models';
import { createAuthRoutes } from './authRoutes';
import { createLinkRoutes } from './linkRoutes'; // 🗑️ REMOVED: createRedirectRoutes 
import { createUserRoutes } from './userRoutes';
import { createTrackingRoutes } from './trackingRoutes';
import { createSupportRoutes } from './supportRoutes';
import { createPublicLinkRoutes } from './publicRoutes'; // 🚀 NEW: Public API Routes

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
  router.use('/support', createSupportRoutes(models));

  // 🚀 NEW v1.8.9: Public API for preview pages and tracking
  router.use('/public', createPublicLinkRoutes(models));

  return router;
};

export const createPublicRoutes = (models: Models): Router => {
  const router = Router();

  // 🗑️ REMOVED: Short URL redirects (replaced with preview pages)
  // Old: router.use('/r', createRedirectRoutes(models));
  // New approach: Next.js handles /r/[hash] routing and calls our public API
  
  // Public tracking routes (keep existing)
  router.use('/track', createTrackingRoutes(models));

  return router;
};
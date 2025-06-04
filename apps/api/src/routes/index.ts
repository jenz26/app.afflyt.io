import { Router } from 'express';
import { Models } from '../models';
import { createAuthRoutes } from './authRoutes';
import { createLinkRoutes, createRedirectRoutes } from './linkRoutes';

export const createRoutes = (models: Models): Router => {
  const router = Router();

  // API v1 routes
  router.use('/auth', createAuthRoutes(models));
  router.use('/links', createLinkRoutes(models));

  return router;
};

export const createPublicRoutes = (models: Models): Router => {
  const router = Router();

  // Public redirect routes (short URLs)
  router.use('/r', createRedirectRoutes(models));

  return router;
};
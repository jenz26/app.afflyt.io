import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth';
import { createAuthLimiter } from '../middleware/rateLimiter';
import { Models } from '../models';

export const createAuthRoutes = (models: Models): Router => {
  const router = Router();
  const authController = new AuthController(models);
  const authLimiter = createAuthLimiter();

  // Public authentication routes (with rate limiting)
  router.post('/register', authLimiter.middleware(), authController.register);
  router.post('/login', authLimiter.middleware(), authController.login);
  router.post('/magic-link', authLimiter.middleware(), authController.sendMagicLink);
  router.post('/magic-link/verify', authLimiter.middleware(), authController.verifyMagicLink);

  // Protected routes (JWT required)
  router.get('/profile', authenticateJWT(models), authController.getProfile);
  router.post('/api-keys', authenticateJWT(models), authController.generateApiKey);

  return router;
};
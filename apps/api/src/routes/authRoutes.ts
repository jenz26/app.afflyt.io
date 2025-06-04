import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth';
import { Models } from '../models';

export const createAuthRoutes = (models: Models): Router => {
  const router = Router();
  const authController = new AuthController(models);

  // Public authentication routes (rate limiting DISABLED for development)
  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/magic-link', authController.sendMagicLink);
  router.post('/magic-link/verify', authController.verifyMagicLink);

  // Protected routes (JWT required)
  router.get('/profile', authenticateJWT(models), authController.getProfile);
  router.post('/api-keys', authenticateJWT(models), authController.generateApiKey);

  return router;
};
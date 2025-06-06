import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth';
import { 
  createConditionalAuthLimiter,
  createForcedAuthLimiter 
} from '../middleware/rateLimiter';
import { Models } from '../models';

export const createAuthRoutes = (models: Models): Router => {
  const router = Router();
  const authController = new AuthController(models);

  // ===== 🚀 NEW v1.8.1: CONDITIONAL AUTH RATE LIMITING =====
  const authLimiter = createConditionalAuthLimiter();
  const forcedAuthLimiter = createForcedAuthLimiter(); // Always enabled for critical auth endpoints

  // ===== PUBLIC AUTHENTICATION ROUTES =====
  // Note: Auth rate limiting is CRITICAL for security, even in development
  // Using different limiters based on security criticality:

  // Standard auth limiter (respects DISABLE_RATE_LIMIT for development)
  router.post('/register', authLimiter, authController.register);
  router.post('/magic-link', authLimiter, authController.sendMagicLink);
  router.post('/magic-link/verify', authLimiter, authController.verifyMagicLink);

  // FORCED auth limiter for login (always enabled - critical security endpoint)
  // Login attempts should ALWAYS be rate limited to prevent brute force attacks
  router.post('/login', forcedAuthLimiter, authController.login);

  // ===== PROTECTED ROUTES (JWT Required) =====
  // No additional rate limiting needed - covered by global limiter
  router.get('/profile', authenticateJWT(models), authController.getProfile);
  router.post('/api-keys', authenticateJWT(models), authController.generateApiKey);

  return router;
};
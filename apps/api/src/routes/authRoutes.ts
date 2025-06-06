import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth';
import { 
  createConditionalAuthLimiter,
  createForcedAuthLimiter 
} from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validation';
import { validationSchemas } from '../schemas';
import { Models } from '../models';

export const createAuthRoutes = (models: Models): Router => {
  const router = Router();
  const authController = new AuthController(models);

  // ===== 🚀 NEW v1.8.1: CONDITIONAL AUTH RATE LIMITING =====
  const authLimiter = createConditionalAuthLimiter();
  const forcedAuthLimiter = createForcedAuthLimiter(); // Always enabled for critical auth endpoints

  // ===== 🔒 v1.8.5: ZOD VALIDATION + RATE LIMITING =====
  // Critical security: Both validation AND rate limiting for all auth endpoints

  // ===== PUBLIC AUTHENTICATION ROUTES =====
  
  // User registration with comprehensive validation
  router.post('/register', 
    authLimiter, 
    validateBody(validationSchemas.register), 
    authController.register
  );

  // Magic link request with locale and return URL validation
  router.post('/magic-link', 
    authLimiter, 
    validateBody(validationSchemas.sendMagicLink), 
    authController.sendMagicLink
  );

  // Magic link verification with token validation
  router.post('/magic-link/verify', 
    authLimiter, 
    validateBody(validationSchemas.verifyMagicLink), 
    authController.verifyMagicLink
  );

  // FORCED auth limiter for login (always enabled - critical security endpoint)
  // Login attempts should ALWAYS be rate limited to prevent brute force attacks
  router.post('/login', 
    forcedAuthLimiter, 
    validateBody(validationSchemas.login), 
    authController.login
  );

  // ===== PROTECTED ROUTES (JWT Required) =====
  // No additional rate limiting needed - covered by global limiter

  // Get user profile (read-only, no validation needed)
  router.get('/profile', 
    authenticateJWT(models), 
    authController.getProfile
  );

  // Generate API key with name validation
  router.post('/api-keys', 
    authenticateJWT(models), 
    validateBody(validationSchemas.createApiKey), 
    authController.generateApiKey
  );

  // Logout endpoint (no validation needed)
  router.post('/logout', 
    authenticateJWT(models), 
    authController.logout
  );

  return router;
};
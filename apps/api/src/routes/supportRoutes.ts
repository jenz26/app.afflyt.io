import { Router, Request, Response } from 'express';
// Note: express-rate-limit might need to be installed
// For now, I'll create a simple rate limiter
import { createSupportController } from '../controllers/supportController';
import { Models } from '../models';
// import { validateRequest } from '../middleware/validation'; // TODO: Check correct import
import { validationSchemas } from '../schemas';
import { createModuleLogger } from '../config/logger';

export const createSupportRoutes = (models: Models): Router => {
  const router: Router = Router();
  const supportRoutesLogger = createModuleLogger('support-routes');
  const supportController = createSupportController(models);

  // Simple rate limiting store (in production, use Redis)
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  // Simple rate limiter middleware
  const createRateLimit = (windowMs: number, maxRequests: number, message: string) => {
    return (req: Request, res: Response, next: Function) => {
      const clientIP = req.ip || 'unknown';
      const now = Date.now();
      
      const key = `${clientIP}:${req.path}`;
      const current = rateLimitStore.get(key);
      
      if (!current || now > current.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        next();
      } else if (current.count < maxRequests) {
        current.count++;
        next();
      } else {
        supportRoutesLogger.warn({
          event: 'rate_limit_exceeded',
          clientIP,
          path: req.path
        }, 'Rate limit exceeded');
        
        res.status(429).json({
          success: false,
          error: message,
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        });
      }
    };
  };

  // Rate limiters
  const supportTicketRateLimit = createRateLimit(
    10 * 60 * 1000, // 10 minutes
    3, // 3 requests
    'Too many support tickets submitted. Please wait 10 minutes before submitting another.'
  );

  const ticketLookupRateLimit = createRateLimit(
    5 * 60 * 1000, // 5 minutes
    20, // 20 requests
    'Too many ticket lookup requests. Please wait before trying again.'
  );

  const generalRateLimit = createRateLimit(
    1 * 60 * 1000, // 1 minute
    30, // 30 requests
    'Too many requests. Please wait before trying again.'
  );

  // Simple validation middleware (basic version)
  const validateSupportTicket = (req: Request, res: Response, next: Function): void => {
    try {
      // Basic validation for required fields
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, email, subject, message'
        });
        return;
      }
      
      if (!email.includes('@')) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
        return;
      }
      
      if (!['technical', 'billing', 'feature', 'account', 'general'].includes(subject)) {
        res.status(400).json({
          success: false,
          error: 'Invalid subject. Must be one of: technical, billing, feature, account, general'
        });
        return;
      }
      
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }
  };

  // ===== SUPPORT ROUTES =====

  /**
   * Create support ticket
   * POST /ticket
   */
  router.post(
    '/ticket',
    supportTicketRateLimit,
    validateSupportTicket,
    supportController.createTicket
  );

  /**
   * Get support ticket by number
   * GET /ticket/:ticketNumber
   */
  router.get(
    '/ticket/:ticketNumber',
    ticketLookupRateLimit,
    supportController.getTicketByNumber
  );

  /**
   * Get support statistics
   * GET /stats
   */
  router.get(
    '/stats',
    generalRateLimit,
    supportController.getStats
  );

  /**
   * Health check for support system
   * GET /health
   */
  router.get(
    '/health',
    generalRateLimit,
    supportController.healthCheck
  );

  // Logging middleware
  router.use('*', (req: Request, res: Response, next: Function) => {
    supportRoutesLogger.debug({
      method: req.method,
      path: req.path,
      clientIP: req.ip
    }, 'Support endpoint accessed');
    
    next();
  });

  return router;
};
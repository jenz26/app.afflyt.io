import helmet from 'helmet';
import { createModuleLogger } from './logger';

// ===== 🔒 SECURITY CONFIGURATION v1.8.5 =====
// Advanced security headers and Content Security Policy configuration

// Create module-specific logger for security
const securityLogger = createModuleLogger('security');

/**
 * Environment-specific security configuration
 */
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Trusted domains for CSP configuration
 */
const trustedDomains = {
  // Frontend domains
  frontend: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // CDN and external services
  cdns: [
    'https://cdnjs.cloudflare.com',
    'https://cdn.jsdelivr.net',
    'https://unpkg.com'
  ],
  
  // Analytics and monitoring (if needed)
  analytics: [
    // Add analytics domains if needed
    // 'https://www.google-analytics.com',
    // 'https://www.googletagmanager.com'
  ],
  
  // Amazon services (for affiliate links)
  amazon: [
    'https://*.amazon.com',
    'https://*.amazon.it',
    'https://*.amazon.de',
    'https://*.amazon.fr',
    'https://*.amazon.es',
    'https://*.amazon.co.uk',
    'https://*.amazon.ca',
    'https://*.amazon.com.au',
    'https://*.amazon.co.jp',
    'https://amzn.to'
  ]
};

/**
 * Content Security Policy configuration
 */
const contentSecurityPolicy = {
  directives: {
    // Default source - only allow same origin
    defaultSrc: ["'self'"],
    
    // Script sources - be very restrictive
    scriptSrc: [
      "'self'",
      // Allow inline scripts only in development
      ...(isDevelopment ? ["'unsafe-inline'"] : []),
      // Trusted CDNs for scripts
      ...trustedDomains.cdns,
      // Nonce-based scripts in production (future enhancement)
      ...(isProduction ? [] : [])
    ],
    
    // Style sources
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Unfortunately needed for most CSS frameworks
      ...trustedDomains.cdns
    ],
    
    // Image sources - allow data URIs and Amazon domains
    imgSrc: [
      "'self'",
      'data:',
      'https:',
      ...trustedDomains.amazon
    ],
    
    // Font sources
    fontSrc: [
      "'self'",
      'data:',
      ...trustedDomains.cdns
    ],
    
    // Object sources - very restrictive
    objectSrc: ["'none'"],
    
    // Media sources
    mediaSrc: ["'self'"],
    
    // Frame sources - restrict iframe usage
    frameSrc: [
      "'self'",
      // Add specific trusted domains if needed for embeds
    ],
    
    // Connect sources - API and external services
    connectSrc: [
      "'self'",
      // Allow connections to frontend domains
      ...trustedDomains.frontend,
      // Allow analytics if configured
      ...trustedDomains.analytics,
      // WebSocket connections for development
      ...(isDevelopment ? ['ws:', 'wss:'] : [])
    ],
    
    // Worker sources
    workerSrc: ["'self'"],
    
    // Manifest sources
    manifestSrc: ["'self'"],
    
    // Form actions - restrict form submissions
    formAction: [
      "'self'",
      // Add specific trusted domains if needed
    ],
    
    // Frame ancestors - prevent clickjacking
    frameAncestors: ["'none'"],
    
    // Base URI restriction
    baseUri: ["'self'"],
    
    // Upgrade insecure requests in production
    ...(isProduction && { upgradeInsecureRequests: [] })
  },
  
  // Report violations (in production)
  ...(isProduction && {
    reportUri: process.env.CSP_REPORT_URI || '/api/security/csp-report'
  })
};

/**
 * Helmet configuration with enhanced security headers
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: isProduction ? contentSecurityPolicy : false,
  
  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  },
  
  // Frame Guard - prevent clickjacking
  frameguard: {
    action: 'deny'
  },
  
  // Hide Powered-By header
  hidePoweredBy: true,
  
  // HSTS - HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff - prevent MIME type sniffing
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: false,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // May interfere with external embeds
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin' // Needed for API access from frontend
  }
});

/**
 * Additional security middleware for API-specific headers
 */
export function additionalSecurityHeaders() {
  return (req: any, res: any, next: any) => {
    // API-specific security headers
    res.setHeader('X-API-Version', process.env.API_VERSION || 'v1.8.5');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Cache control for sensitive endpoints
    if (req.path.includes('/api/user') || req.path.includes('/api/auth')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    
    // Rate limiting headers information
    res.setHeader('X-RateLimit-Policy', 'Global: 100 req/15min, Auth: 10 req/15min');
    
    // Security contact (optional)
    if (process.env.SECURITY_CONTACT) {
      res.setHeader('Security-Contact', process.env.SECURITY_CONTACT);
    }
    
    next();
  };
}

/**
 * Security monitoring and logging
 */
export function securityMonitoring() {
  return (req: any, res: any, next: any) => {
    // Log potentially suspicious requests
    const suspiciousPatterns = [
      /\.\./,          // Path traversal
      /<script/i,      // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i,   // JavaScript protocol
      /data:.*base64/i, // Base64 data URLs (potential XSS)
      /\/etc\/passwd/,  // File access attempts
      /\/proc\//,       // Process access attempts
    ];
    
    const fullUrl = req.originalUrl || req.url;
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    
    // Check for suspicious patterns in URL, headers, and body
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(fullUrl) || 
      pattern.test(userAgent) || 
      pattern.test(referer) ||
      (req.body && pattern.test(JSON.stringify(req.body)))
    );
    
    if (isSuspicious) {
      securityLogger.warn({
        ip: req.ip,
        method: req.method,
        url: fullUrl,
        userAgent,
        referer,
        headers: req.headers,
        body: req.body
      }, 'Suspicious request detected');
    }
    
    // Log failed authentication attempts
    res.on('finish', () => {
      if (req.path.includes('/auth/login') && res.statusCode === 401) {
        securityLogger.warn({
          ip: req.ip,
          userAgent,
          timestamp: new Date().toISOString()
        }, 'Failed login attempt');
      }
    });
    
    next();
  };
}

/**
 * CSP violation reporting endpoint handler
 */
export function cspReportHandler() {
  return (req: any, res: any) => {
    const report = req.body;
    
    securityLogger.warn({
      report,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    }, 'CSP violation reported');
    
    res.status(204).end();
  };
}

/**
 * IP whitelist middleware (for admin endpoints)
 */
export function ipWhitelist(allowedIPs: string[] = []) {
  return (req: any, res: any, next: any) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // In development, allow all IPs
    if (isDevelopment || allowedIPs.length === 0) {
      return next();
    }
    
    if (!allowedIPs.includes(clientIP)) {
      securityLogger.warn({
        ip: clientIP,
        url: req.originalUrl,
        method: req.method
      }, 'Access denied: IP not in whitelist');
      
      return res.status(403).json({
        error: 'Access Denied',
        message: 'Your IP address is not authorized to access this resource'
      });
    }
    
    next();
  };
}

// Log security configuration on startup
securityLogger.info({
  environment: process.env.NODE_ENV,
  cspEnabled: isProduction,
  hstsEnabled: true,
  allowedOrigins: trustedDomains.frontend,
  additionalHeaders: true
}, 'Security configuration initialized');

export {
  trustedDomains,
  contentSecurityPolicy,
  isProduction,
  isDevelopment
};
import pino from 'pino';
import pinoHttp from 'pino-http';

// Create logger instance based on environment
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

  return pino({
    level: logLevel,
    // Pretty print in development, JSON in production
    transport: isDevelopment ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'yyyy-mm-dd HH:MM:ss.l',
        messageFormat: '{levelLabel} - {msg}',
        levelFirst: true
      }
    } : undefined,
    // Base fields for all logs
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'api-server',
      service: 'afflyt-api',
      version: process.env.API_VERSION || 'v1.8.4'
    },
    // Timestamp configuration
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    // Serializers for better object logging
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
          'authorization': req.headers.authorization ? '[REDACTED]' : undefined
        },
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.headers['content-type'],
          'content-length': res.headers['content-length']
        }
      }),
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err
    }
  });
};

// Create the main logger instance
export const logger = createLogger();

// Create HTTP logger for Express middleware
export const httpLogger = pinoHttp({
  logger,
  // Auto-log all HTTP requests with custom ignore rules
  autoLogging: {
    ignore: function (req) {
      // Don't log health check endpoints to reduce noise
      return req.url === '/health';
    }
  },
  // Custom log level for HTTP requests (remove useLevel to avoid conflict)
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  // Custom success message
  customSuccessMessage: function (req, res) {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  // Custom error message
  customErrorMessage: function (req, res, err) {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err?.message || 'Unknown error'}`;
  },
  // Customize request logging
  customReceivedMessage: function (req) {
    return `→ ${req.method} ${req.url}`;
  },
  // Custom attribute keys
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration'
  },
  // Redact sensitive information
  redact: {
    paths: [
      'request.headers.authorization',
      'request.headers.cookie',
      'request.body.password',
      'request.body.token'
    ],
    censor: '[REDACTED]'
  }
});

// Utility functions for common logging patterns
export const logUtils = {
  // Database operations
  database: {
    connected: (dbName: string) => logger.info({ dbName }, 'Database connected successfully'),
    disconnected: () => logger.info('Database disconnected'),
    error: (operation: string, error: any) => logger.error({ operation, error }, 'Database operation failed'),
    query: (collection: string, operation: string, duration?: number) => 
      logger.debug({ collection, operation, duration }, 'Database query executed')
  },
  
  // Authentication
  auth: {
    login: (userId: string, email: string, method: 'password' | 'magic_link') => 
      logger.info({ userId, email, method }, 'User login successful'),
    loginFailed: (email: string, reason: string) => 
      logger.warn({ email, reason }, 'Login attempt failed'),
    register: (userId: string, email: string) => 
      logger.info({ userId, email }, 'User registration successful'),
    apiKeyGenerated: (userId: string, keyName: string) => 
      logger.info({ userId, keyName }, 'API key generated'),
    tokenValidation: (userId: string, valid: boolean) => 
      logger.debug({ userId, valid }, 'Token validation')
  },
  
  // Rate limiting
  rateLimit: {
    hit: (key: string, current: number, limit: number) => 
      logger.debug({ key, current, limit }, 'Rate limit hit'),
    exceeded: (key: string, ip: string) => 
      logger.warn({ key, ip }, 'Rate limit exceeded'),
    status: (enabled: boolean) => 
      logger.info({ enabled }, 'Rate limiting status')
  },
  
  // Business logic
  affiliate: {
    linkCreated: (userId: string, linkId: string, originalUrl: string) => 
      logger.info({ userId, linkId, originalUrl }, 'Affiliate link created'),
    linkClicked: (linkId: string, ip: string, userAgent?: string) => 
      logger.info({ linkId, ip, userAgent }, 'Affiliate link clicked'),
    conversionTracked: (linkId: string, value: number, currency: string) => 
      logger.info({ linkId, value, currency }, 'Conversion tracked')
  },

  // ===== ✨ NEW v1.8.4: ANALYTICS LOGGING UTILITIES =====
  // Analytics operations for comprehensive business intelligence
  analytics: {
    summaryGenerated: (userId: string, totalLinks: number, totalClicks: number, totalRevenue: number) => 
      logger.info({ userId, totalLinks, totalClicks, totalRevenue }, 'Analytics summary generated'),
    trendGenerated: (userId: string, trendType: string, period: string, dataPoints: number) => 
      logger.info({ userId, trendType, period, dataPoints }, 'Analytics trend generated'),
    distributionGenerated: (userId: string, distributionType: string, itemCount: number) => 
      logger.info({ userId, distributionType, itemCount }, 'Analytics distribution generated'),
    heatmapGenerated: (userId: string, totalClicks: number, peakHour: number, peakDay: number) => 
      logger.info({ userId, totalClicks, peakHour, peakDay }, 'Analytics heatmap generated'),
    topLinksGenerated: (userId: string, sortBy: string, linkCount: number) => 
      logger.info({ userId, sortBy, linkCount }, 'Top performing links generated'),
    queryOptimized: (userId: string, queryType: string, duration: number, cacheHit: boolean = false) => 
      logger.debug({ userId, queryType, duration, cacheHit }, 'Analytics query executed'),
    aggregationCompleted: (userId: string, aggregationType: string, recordCount: number, duration: number) => 
      logger.debug({ userId, aggregationType, recordCount, duration }, 'Analytics aggregation completed'),
    reportGenerated: (userId: string, reportType: string, filters: any, dataSize: number) => 
      logger.info({ userId, reportType, filters, dataSize }, 'Analytics report generated'),
    exportRequested: (userId: string, format: string, dataPoints: number) => 
      logger.info({ userId, format, dataPoints }, 'Analytics data export requested')
  },

  // ===== ✨ NEW v1.8.4: CONVERSIONS LOGGING UTILITIES =====
  // Conversion tracking for revenue optimization
  conversions: {
    tracked: (userId: string, linkId: string, trackingId: string, amount: number) => 
      logger.info({ userId, linkId, trackingId, amount }, 'Conversion tracked successfully'),
    updated: (conversionId: string, oldStatus: string, newStatus: string, adminId?: string) => 
      logger.info({ conversionId, oldStatus, newStatus, adminId }, 'Conversion status updated'),
    duplicate: (trackingId: string, existingConversionId: string) => 
      logger.warn({ trackingId, existingConversionId }, 'Duplicate conversion attempt blocked'),
    validated: (conversionId: string, isValid: boolean, validationRules: string[]) => 
      logger.debug({ conversionId, isValid, validationRules }, 'Conversion validation completed'),
    revenueCalculated: (userId: string, period: string, totalRevenue: number, conversionCount: number) => 
      logger.info({ userId, period, totalRevenue, conversionCount }, 'Revenue metrics calculated')
  },

  // ===== ✨ NEW v1.8.4: LINKS LOGGING UTILITIES =====
  // Link management and performance tracking
  links: {
    created: (userId: string, linkHash: string, originalUrl: string, tag?: string) => 
      logger.info({ userId, linkHash, originalUrl, tag }, 'Affiliate link created'),
    clicked: (linkHash: string, userId: string, ip: string, isUnique: boolean) => 
      logger.info({ linkHash, userId, ip, isUnique }, 'Affiliate link clicked'),
    redirected: (linkHash: string, originalUrl: string, responseTime: number) => 
      logger.debug({ linkHash, originalUrl, responseTime }, 'Link redirect completed'),
    statsUpdated: (linkHash: string, clickCount: number, uniqueClicks: number, revenue: number) => 
      logger.debug({ linkHash, clickCount, uniqueClicks, revenue }, 'Link statistics updated'),
    performanceAnalyzed: (userId: string, topLinks: number, conversionRate: number) => 
      logger.info({ userId, topLinks, conversionRate }, 'Link performance analyzed')
  },

  // ===== ✨ NEW v1.8.4: USER OPERATIONS LOGGING =====
  // User management and profile operations
  users: {
    profileUpdated: (userId: string, fields: string[]) => 
      logger.info({ userId, fields }, 'User profile updated'),
    settingsChanged: (userId: string, settingType: string, newValue: any) => 
      logger.info({ userId, settingType, newValue }, 'User settings changed'),
    apiKeyCreated: (userId: string, keyName: string, permissions: string[]) => 
      logger.info({ userId, keyName, permissions }, 'API key created'),
    apiKeyRevoked: (userId: string, keyId: string, reason: string) => 
      logger.info({ userId, keyId, reason }, 'API key revoked'),
    subscriptionChanged: (userId: string, oldPlan: string, newPlan: string) => 
      logger.info({ userId, oldPlan, newPlan }, 'User subscription changed')
  },
  
  // External services
  external: {
    emailSent: (recipient: string, template: string, messageId?: string) => 
      logger.info({ recipient, template, messageId }, 'Email sent successfully'),
    emailFailed: (recipient: string, template: string, error: any) => 
      logger.error({ recipient, template, error }, 'Email sending failed'),
    redisOperation: (operation: string, key: string, success: boolean) => 
      logger.debug({ operation, key, success }, 'Redis operation')
  },
  
  // Performance monitoring
  performance: {
    requestStart: (method: string, url: string) => 
      logger.debug({ method, url, timestamp: Date.now() }, 'Request started'),
    requestEnd: (method: string, url: string, duration: number, statusCode: number) => 
      logger.info({ method, url, duration, statusCode }, 'Request completed'),
    slowQuery: (operation: string, duration: number, threshold: number = 1000) => {
      if (duration > threshold) {
        logger.warn({ operation, duration, threshold }, 'Slow operation detected');
      }
    }
  },
  
  // Application lifecycle
  app: {
    starting: () => logger.info('Application starting...'),
    started: (port: number, env: string) => logger.info({ port, env }, 'Application started successfully'),
    stopping: (signal: string) => logger.info({ signal }, 'Application stopping...'),
    stopped: () => logger.info('Application stopped'),
    error: (error: any, context?: string) => logger.error({ error, context }, 'Application error')
  }
};

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

export default logger;
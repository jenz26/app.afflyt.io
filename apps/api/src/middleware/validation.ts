import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger, createModuleLogger } from '../config/logger';
import { sendValidationError } from '../utils/responseHelpers';

// ===== 🔒 VALIDATION MIDDLEWARE v1.8.5 =====
// Centralized validation middleware using Zod for type-safe input validation

// Create module-specific logger for validation
const validationLogger = createModuleLogger('validation');

/**
 * Types for validation targets
 */
type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Enhanced Request interface with validated data
 */
export interface ValidatedRequest<T = any> extends Request {
  validatedData?: T;
  validatedParams?: any;
  validatedQuery?: any;
}

/**
 * Validation result interface
 */
interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Helper function to format Zod errors into user-friendly messages
 */
function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });
}

/**
 * Generic validation function
 */
function validateData<T>(schema: z.ZodSchema<T>, data: unknown, target: ValidationTarget): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    
    validationLogger.debug({
      target,
      dataSize: JSON.stringify(data).length,
      validatedFields: typeof validatedData === 'object' && validatedData !== null 
        ? Object.keys(validatedData as object).length 
        : 0
    }, 'Data validation successful');
    
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = formatZodErrors(error);
      
      validationLogger.warn({
        target,
        errors,
        invalidData: JSON.stringify(data)
      }, 'Data validation failed');
      
      return {
        success: false,
        errors
      };
    }
    
    // Unexpected error
    validationLogger.error({
      target,
      error,
      data: JSON.stringify(data)
    }, 'Unexpected validation error');
    
    return {
      success: false,
      errors: ['Internal validation error']
    };
  }
}

/**
 * Main validation middleware factory
 * Creates middleware that validates request data against Zod schemas
 */
export function validate<TBody = any, TParams = any, TQuery = any>(options: {
  body?: z.ZodSchema<TBody>;
  params?: z.ZodSchema<TParams>;
  query?: z.ZodSchema<TQuery>;
}) {
  return (req: ValidatedRequest<TBody>, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const validationErrors: string[] = [];
    
    validationLogger.debug({
      method: req.method,
      url: req.originalUrl,
      hasBody: !!options.body,
      hasParams: !!options.params,
      hasQuery: !!options.query,
      bodySize: req.body ? JSON.stringify(req.body).length : 0
    }, 'Starting request validation');

    // Validate request body
    if (options.body) {
      const bodyResult = validateData(options.body, req.body, 'body');
      if (bodyResult.success) {
        req.validatedData = bodyResult.data;
      } else {
        validationErrors.push(...(bodyResult.errors || []));
      }
    }

    // Validate URL parameters
    if (options.params) {
      const paramsResult = validateData(options.params, req.params, 'params');
      if (paramsResult.success) {
        req.validatedParams = paramsResult.data;
      } else {
        validationErrors.push(...(paramsResult.errors || []));
      }
    }

    // Validate query parameters
    if (options.query) {
      const queryResult = validateData(options.query, req.query, 'query');
      if (queryResult.success) {
        req.validatedQuery = queryResult.data;
      } else {
        validationErrors.push(...(queryResult.errors || []));
      }
    }

    const duration = Date.now() - startTime;

    // If there are validation errors, respond with error
    if (validationErrors.length > 0) {
      validationLogger.warn({
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        errors: validationErrors,
        duration
      }, 'Request validation failed');

      // Send structured validation error response
      sendValidationError(res, validationErrors.join('; '), {
        errors: validationErrors,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
      return;
    }

    // Log successful validation
    validationLogger.debug({
      method: req.method,
      url: req.originalUrl,
      duration,
      validatedTargets: [
        options.body && 'body',
        options.params && 'params', 
        options.query && 'query'
      ].filter(Boolean)
    }, 'Request validation successful');

    next();
  };
}

/**
 * Shorthand middleware functions for common validation patterns
 */

/**
 * Validate only request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return validate<T>({ body: schema });
}

/**
 * Validate only URL parameters
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return validate<any, T>({ params: schema });
}

/**
 * Validate only query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return validate<any, any, T>({ query: schema });
}

/**
 * Sanitization middleware for additional security
 * Removes potentially harmful characters and normalizes data
 */
export function sanitize() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sanitizeString = (str: string): string => {
      return str
        .trim()
        // Remove null bytes
        .replace(/\0/g, '')
        // Remove potential script tags (basic XSS prevention)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove HTML comments
        .replace(/<!--[\s\S]*?-->/g, '');
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj !== null && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      
      return obj;
    };

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    validationLogger.debug({
      method: req.method,
      url: req.originalUrl
    }, 'Request data sanitized');

    next();
  };
}

/**
 * Rate limiting validation - validates rate limit headers and parameters
 */
export function validateRateLimit() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const limitHeader = req.get('limit');
    const startDateHeader = req.get('startdate');
    const endDateHeader = req.get('enddate');

    // Validate limit header if present
    if (limitHeader) {
      const limit = parseInt(limitHeader, 10);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        validationLogger.warn({
          limit: limitHeader,
          ip: req.ip,
          url: req.originalUrl
        }, 'Invalid limit header provided');

        sendValidationError(res, 'Invalid limit header. Must be a number between 1 and 1000');
        return;
      }
    }

    // Validate date headers if present
    if (startDateHeader && !Date.parse(startDateHeader)) {
      validationLogger.warn({
        startDate: startDateHeader,
        ip: req.ip,
        url: req.originalUrl
      }, 'Invalid start date header provided');

      sendValidationError(res, 'Invalid start date format. Use ISO 8601 format');
      return;
    }

    if (endDateHeader && !Date.parse(endDateHeader)) {
      validationLogger.warn({
        endDate: endDateHeader,
        ip: req.ip,
        url: req.originalUrl
      }, 'Invalid end date header provided');

      sendValidationError(res, 'Invalid end date format. Use ISO 8601 format');
      return;
    }

    // Validate date range if both are present
    if (startDateHeader && endDateHeader) {
      const startDate = new Date(startDateHeader);
      const endDate = new Date(endDateHeader);
      
      if (startDate > endDate) {
        validationLogger.warn({
          startDate: startDateHeader,
          endDate: endDateHeader,
          ip: req.ip,
          url: req.originalUrl
        }, 'Invalid date range: start date is after end date');

        sendValidationError(res, 'Start date must be before or equal to end date');
        return;
      }
    }

    next();
  };
}

/**
 * File upload validation middleware
 */
export function validateFileUpload(options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  required?: boolean;
} = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    required = false
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Note: This would work with multer middleware
    // For now, we'll just validate basic file properties if available
    const hasFiles = req.body?.files || req.headers['content-type']?.includes('multipart/form-data');

    if (!hasFiles && required) {
      validationLogger.warn({
        ip: req.ip,
        url: req.originalUrl
      }, 'Required file upload missing');

      sendValidationError(res, 'File upload is required');
      return;
    }

    if (hasFiles) {
      validationLogger.debug({
        hasFileData: !!hasFiles,
        contentType: req.headers['content-type'],
        url: req.originalUrl
      }, 'File upload validation completed');
    }

    next();
  };
}

// Export validation utilities
export { formatZodErrors, validateData };
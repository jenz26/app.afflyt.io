import { Response } from 'express';

// Interfacce per le risposte standardizzate
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// Helper per le risposte di successo
export const sendSuccess = <T>(
  res: Response,
  data: T,
  options: {
    message?: string;
    pagination?: PaginationMeta;
    statusCode?: number;
  } = {}
): void => {
  const { message, pagination, statusCode = 200 } = options;

  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  if (message) {
    response.message = message;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  res.status(statusCode).json(response);
};

// Helper per le risposte di errore
export const sendError = (
  res: Response,
  message: string,
  options: {
    statusCode?: number;
    code?: string;
    details?: any;
  } = {}
): void => {
  const { statusCode = 500, code, details } = options;

  const response: ErrorResponse = {
    success: false,
    error: {
      message
    },
    timestamp: new Date().toISOString()
  };

  if (code) {
    response.error.code = code;
  }

  if (details) {
    response.error.details = details;
  }

  res.status(statusCode).json(response);
};

// Helper specifici per errori comuni
export const sendValidationError = (
  res: Response,
  message: string,
  details?: any
): void => {
  sendError(res, message, {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    details
  });
};

export const sendNotFoundError = (
  res: Response,
  resource: string = 'Resource'
): void => {
  sendError(res, `${resource} not found`, {
    statusCode: 404,
    code: 'NOT_FOUND'
  });
};

export const sendUnauthorizedError = (
  res: Response,
  message: string = 'Unauthorized'
): void => {
  sendError(res, message, {
    statusCode: 401,
    code: 'UNAUTHORIZED'
  });
};

export const sendForbiddenError = (
  res: Response,
  message: string = 'Access denied'
): void => {
  sendError(res, message, {
    statusCode: 403,
    code: 'FORBIDDEN'
  });
};

export const sendConflictError = (
  res: Response,
  message: string
): void => {
  sendError(res, message, {
    statusCode: 409,
    code: 'CONFLICT'
  });
};

export const sendInternalError = (
  res: Response,
  message: string = 'Internal server error'
): void => {
  sendError(res, message, {
    statusCode: 500,
    code: 'INTERNAL_ERROR'
  });
};

// Helper per creare oggetti di paginazione
export const createPagination = (
  limit: number,
  offset: number,
  total: number
): PaginationMeta => {
  return {
    limit,
    offset,
    total,
    hasNext: (offset + limit) < total,
    hasPrev: offset > 0
  };
};
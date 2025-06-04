import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Models } from '../models';
import { User, ApiKey } from '../types';

export interface AuthRequest extends Request {
  user?: User;
  apiKey?: ApiKey;
}

export const authenticateJWT = (models: Models) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({
          error: 'Authorization header missing',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const token = authHeader.split(' ')[1]; // Bearer TOKEN
      
      if (!token) {
        res.status(401).json({
          error: 'Token missing',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await models.user.findById(decoded.userId);
      
      if (!user) {
        res.status(401).json({
          error: 'User not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        error: 'Invalid token',
        timestamp: new Date().toISOString()
      });
    }
  };
};

export const authenticateApiKey = (models: Models) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKeyHeader = req.headers['x-api-key'] as string;
      
      if (!apiKeyHeader) {
        res.status(401).json({
          error: 'API Key missing',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await models.user.findByApiKey(apiKeyHeader);
      
      if (!result) {
        res.status(401).json({
          error: 'Invalid API Key',
          timestamp: new Date().toISOString()
        });
        return;
      }

      req.user = result.user;
      req.apiKey = result.apiKey;
      next();
    } catch (error) {
      res.status(401).json({
        error: 'API Key authentication failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

export const optionalAuth = (models: Models) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const apiKeyHeader = req.headers['x-api-key'] as string;

      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            const user = await models.user.findById(decoded.userId);
            if (user) req.user = user;
          } catch {
            // Silent fail for optional auth
          }
        }
      } else if (apiKeyHeader) {
        try {
          const result = await models.user.findByApiKey(apiKeyHeader);
          if (result) {
            req.user = result.user;
            req.apiKey = result.apiKey;
          }
        } catch {
          // Silent fail for optional auth
        }
      }

      next();
    } catch (error) {
      next();
    }
  };
};
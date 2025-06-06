import { Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Models } from '../models';
import { User } from '../types';
import { AuthRequest } from '../middleware/auth';
import { ValidatedRequest } from '../middleware/validation';
import { sendMagicLinkEmail, sendWelcomeEmail } from '../services/emailService';
import { logger, logUtils, createModuleLogger } from '../config/logger';
import {
  sendSuccess,
  sendValidationError,
  sendUnauthorizedError,
  sendConflictError,
  sendInternalError
} from '../utils/responseHelpers';
import { validationSchemas } from '../schemas';
import { z } from 'zod';

// Create module-specific logger
const authLogger = createModuleLogger('auth');

// Type definitions for validated requests
type RegisterRequest = ValidatedRequest<z.infer<typeof validationSchemas.register>>;
type LoginRequest = ValidatedRequest<z.infer<typeof validationSchemas.login>>;
type SendMagicLinkRequest = ValidatedRequest<z.infer<typeof validationSchemas.sendMagicLink>>;
type VerifyMagicLinkRequest = ValidatedRequest<z.infer<typeof validationSchemas.verifyMagicLink>>;
type CreateApiKeyRequest = ValidatedRequest<z.infer<typeof validationSchemas.createApiKey>> & AuthRequest;

export class AuthController {
  constructor(private models: Models) {
    authLogger.debug('AuthController initialized');
  }

  // Register new user
  register = async (req: RegisterRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Data is already validated by Zod middleware
      const { email, password, firstName, lastName } = req.body;
      const role = 'affiliate' as const; // Default role

      authLogger.debug({ email, role }, 'Registration attempt started');

      // Check if user already exists
      const existingUser = await this.models.user.findByEmail(email);
      if (existingUser) {
        authLogger.warn({ email }, 'Registration failed: user already exists');
        sendConflictError(res, 'User already exists');
        return;
      }

      // Hash password
      const passwordHash = await this.models.user.hashPassword(password);

      // Create user
      const userData = {
        id: crypto.randomUUID(),
        email,
        passwordHash,
        firstName: firstName || '',
        lastName: lastName || '',
        role,
        isEmailVerified: false
      };

      const user = await this.models.user.create(userData);
      authLogger.info({ userId: user.id, email }, 'User created successfully');

      // Generate verification token (for future email verification)
      const verificationToken = jwt.sign(
        { userId: user.id, purpose: 'email_verification' },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );

      // Generate access token
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // For MVP, we'll skip email verification and mark user as verified
      await this.models.user.updateById(user.id, { isEmailVerified: true });

      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, 'it').catch(error => {
        logUtils.external.emailFailed(email, 'welcome', error);
      });

      // Log successful registration
      logUtils.auth.register(user.id, email);
      logUtils.performance.requestEnd('POST', '/auth/register', Date.now() - startTime, 201);

      const responseData = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: true
        },
        token: accessToken
      };

      sendSuccess(res, responseData, {
        message: 'User registered successfully',
        statusCode: 201
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      authLogger.error({ error, duration }, 'Registration error occurred');
      logUtils.performance.requestEnd('POST', '/auth/register', duration, 500);
      sendInternalError(res);
    }
  };

  // Login user
  login = async (req: LoginRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Data is already validated by Zod middleware
      const { email, password } = req.body;

      authLogger.debug({ email }, 'Login attempt started');

      // Find user
      const user = await this.models.user.findByEmail(email);
      if (!user || !user.passwordHash) {
        logUtils.auth.loginFailed(email, 'user_not_found_or_no_password');
        sendUnauthorizedError(res, 'Invalid credentials');
        return;
      }

      // Verify password
      const isValidPassword = await this.models.user.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        logUtils.auth.loginFailed(email, 'invalid_password');
        sendUnauthorizedError(res, 'Invalid credentials');
        return;
      }

      // Update last login
      await this.models.user.updateById(user.id, { lastLoginAt: new Date() });

      // Generate access token
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Log successful login
      logUtils.auth.login(user.id, email, 'password');
      logUtils.performance.requestEnd('POST', '/auth/login', Date.now() - startTime, 200);

      const responseData = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        token: accessToken
      };

      sendSuccess(res, responseData, {
        message: 'Login successful'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      authLogger.error({ error, duration }, 'Login error occurred');
      logUtils.performance.requestEnd('POST', '/auth/login', duration, 500);
      sendInternalError(res);
    }
  };

  // Send magic link (for passwordless login)
  sendMagicLink = async (req: SendMagicLinkRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Data is already validated by Zod middleware (email format, locale, returnUrl)
      const { email, locale = 'it', returnUrl } = req.body;

      authLogger.debug({ email, locale }, 'Magic link request started');

      // Check if user exists, if not create one for magic link registration
      let user = await this.models.user.findByEmail(email);
      if (!user) {
        // Create user automatically for magic link flow
        const userData = {
          id: crypto.randomUUID(),
          email,
          firstName: '',
          lastName: '',
          role: 'affiliate' as const,
          isEmailVerified: true // Auto-verify for magic link users
        };
        user = await this.models.user.create(userData);
        
        authLogger.info({ userId: user.id, email }, 'User auto-created via magic link');
      }

      // Generate magic link token with longer expiry
      const magicToken = jwt.sign(
        { 
          userId: user.id, 
          purpose: 'magic_link',
          email: user.email 
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '30m' } // 30 minutes for better UX
      );

      // Send magic link email using our professional service
      const emailResult = await sendMagicLinkEmail({
        email,
        token: magicToken,
        locale,
        returnUrl
      });

      if (!emailResult.success) {
        logUtils.external.emailFailed(email, 'magic_link', emailResult.error);
        sendInternalError(res, 'Failed to send magic link email');
        return;
      }

      logUtils.external.emailSent(email, 'magic_link', emailResult.messageId);

      // Log magic link for development
      if (process.env.NODE_ENV === 'development') {
        const baseUrl = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:3000';
        const magicLink = `${baseUrl}/${locale}/auth/verify?token=${magicToken}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
        authLogger.debug({ email, magicLink }, 'Magic link generated for development');
      }

      logUtils.performance.requestEnd('POST', '/auth/magic-link', Date.now() - startTime, 200);

      const responseData = {
        messageId: emailResult.messageId
      };

      sendSuccess(res, responseData, {
        message: 'Magic link sent successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      authLogger.error({ error, duration }, 'Magic link error occurred');
      logUtils.performance.requestEnd('POST', '/auth/magic-link', duration, 500);
      sendInternalError(res);
    }
  };

  // Verify magic link
  verifyMagicLink = async (req: VerifyMagicLinkRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // ✅ Token is already validated by Zod middleware
      const { token } = req.body;

      authLogger.debug('Magic link verification attempt started');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { 
        userId: string; 
        purpose: string;
        email: string;
      };
      
      if (decoded.purpose !== 'magic_link') {
        authLogger.warn({ purpose: decoded.purpose }, 'Magic link verification failed: invalid token purpose');
        sendValidationError(res, 'Invalid token purpose');
        return;
      }

      // Find user
      const user = await this.models.user.findById(decoded.userId);
      if (!user) {
        authLogger.warn({ userId: decoded.userId }, 'Magic link verification failed: user not found');
        sendValidationError(res, 'User not found');
        return;
      }

      // Verify email matches token
      if (user.email !== decoded.email) {
        authLogger.warn({ 
          userEmail: user.email, 
          tokenEmail: decoded.email 
        }, 'Magic link verification failed: email mismatch');
        sendValidationError(res, 'Token email mismatch');
        return;
      }

      // Update user - mark as verified and update last login
      await this.models.user.updateById(user.id, { 
        isEmailVerified: true,
        lastLoginAt: new Date() 
      });

      // Generate access token
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Log successful magic link login
      logUtils.auth.login(user.id, user.email, 'magic_link');
      logUtils.performance.requestEnd('POST', '/auth/verify-magic-link', Date.now() - startTime, 200);

      const responseData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : null,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          balance: user.balance,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        },
        token: accessToken
      };

      sendSuccess(res, responseData, {
        message: 'Magic link verified successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof jwt.JsonWebTokenError) {
        authLogger.warn({ error: error.message }, 'Magic link verification failed: invalid/expired token');
        sendUnauthorizedError(res, 'Invalid or expired magic link');
        return;
      }

      authLogger.error({ error, duration }, 'Magic link verification error occurred');
      logUtils.performance.requestEnd('POST', '/auth/verify-magic-link', duration, 500);
      sendUnauthorizedError(res, 'Invalid or expired token');
    }
  };

  // Get current user profile
  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      authLogger.debug({ userId: user.id }, 'Profile request');

      const responseData = {
        id: user.id,
        email: user.email,
        name: user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : null,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        balance: user.balance,
        amazonAssociateTag: user.amazonAssociateTag,
        websiteUrl: user.websiteUrl,
        companyName: user.companyName,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      };

      sendSuccess(res, responseData);
    } catch (error) {
      authLogger.error({ error }, 'Get profile error occurred');
      sendInternalError(res);
    }
  };

  // Generate API key
  generateApiKey = async (req: CreateApiKeyRequest, res: Response): Promise<void> => {
    try {
      // ✅ Data is already validated by Zod middleware
      const { name } = req.body;
      const user = req.user!;

      authLogger.debug({ userId: user.id, keyName: name }, 'API key generation request');

      const apiKey = await this.models.user.generateApiKey(user.id, name);

      logUtils.auth.apiKeyGenerated(user.id, name);

      const responseData = {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.keyHash, // Show the actual key only once
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt
        }
      };

      sendSuccess(res, responseData, {
        message: 'API key generated successfully. Save this key as it will not be shown again.',
        statusCode: 201
      });
    } catch (error) {
      authLogger.error({ error }, 'Generate API key error occurred');
      sendInternalError(res);
    }
  };

  // Logout (optional endpoint for token invalidation)
  logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      authLogger.debug({ userId: user?.id }, 'Logout request');
      
      // For JWT, logout is typically handled client-side by removing the token
      // We could implement a token blacklist here if needed
      
      sendSuccess(res, null, {
        message: 'Logout successful'
      });
    } catch (error) {
      authLogger.error({ error }, 'Logout error occurred');
      sendInternalError(res);
    }
  };
}
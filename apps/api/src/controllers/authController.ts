import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Models } from '../models';
import { User } from '../types';
import { AuthRequest } from '../middleware/auth';
import { sendMagicLinkEmail, sendWelcomeEmail } from '../services/emailService';
import {
  sendSuccess,
  sendValidationError,
  sendUnauthorizedError,
  sendConflictError,
  sendInternalError
} from '../utils/responseHelpers';

export class AuthController {
  constructor(private models: Models) {}

  // Register new user
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, role = 'affiliate' } = req.body;

      // Validation
      if (!email || !password) {
        sendValidationError(res, 'Email and password are required');
        return;
      }

      // Check if user already exists
      const existingUser = await this.models.user.findByEmail(email);
      if (existingUser) {
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
        role: role as 'affiliate' | 'advertiser' | 'admin',
        isEmailVerified: false
      };

      const user = await this.models.user.create(userData);

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
        console.warn('Failed to send welcome email:', error);
      });

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
      console.error('Registration error:', error);
      sendInternalError(res);
    }
  };

  // Login user
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        sendValidationError(res, 'Email and password are required');
        return;
      }

      // Find user
      const user = await this.models.user.findByEmail(email);
      if (!user || !user.passwordHash) {
        sendUnauthorizedError(res, 'Invalid credentials');
        return;
      }

      // Verify password
      const isValidPassword = await this.models.user.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
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
      console.error('Login error:', error);
      sendInternalError(res);
    }
  };

  // Send magic link (for passwordless login)
  sendMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, locale = 'it', returnUrl } = req.body;

      if (!email) {
        sendValidationError(res, 'Email is required');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        sendValidationError(res, 'Invalid email format');
        return;
      }

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
        
        console.log(`Created new user via magic link: ${email}`);
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
        console.error('Magic link email failed:', emailResult.error);
        sendInternalError(res, 'Failed to send magic link email');
        return;
      }

      // Log magic link for development
      if (process.env.NODE_ENV === 'development') {
        const baseUrl = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:3000';
        const magicLink = `${baseUrl}/${locale}/auth/verify?token=${magicToken}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
        console.log(`🔗 Magic link for ${email}: ${magicLink}`);
      }

      const responseData = {
        messageId: emailResult.messageId
      };

      sendSuccess(res, responseData, {
        message: 'Magic link sent successfully'
      });
    } catch (error) {
      console.error('Magic link error:', error);
      sendInternalError(res);
    }
  };

  // Verify magic link
  verifyMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        sendValidationError(res, 'Token is required');
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { 
        userId: string; 
        purpose: string;
        email: string;
      };
      
      if (decoded.purpose !== 'magic_link') {
        sendValidationError(res, 'Invalid token purpose');
        return;
      }

      // Find user
      const user = await this.models.user.findById(decoded.userId);
      if (!user) {
        sendValidationError(res, 'User not found');
        return;
      }

      // Verify email matches token
      if (user.email !== decoded.email) {
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
      if (error instanceof jwt.JsonWebTokenError) {
        sendUnauthorizedError(res, 'Invalid or expired magic link');
        return;
      }

      console.error('Magic link verification error:', error);
      sendUnauthorizedError(res, 'Invalid or expired token');
    }
  };

  // Get current user profile
  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

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
      console.error('Get profile error:', error);
      sendInternalError(res);
    }
  };

  // Generate API key
  generateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name } = req.body;
      const user = req.user!;

      if (!name) {
        sendValidationError(res, 'API key name is required');
        return;
      }

      const apiKey = await this.models.user.generateApiKey(user.id, name);

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
      console.error('Generate API key error:', error);
      sendInternalError(res);
    }
  };

  // Logout (optional endpoint for token invalidation)
  logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // For JWT, logout is typically handled client-side by removing the token
      // We could implement a token blacklist here if needed
      
      sendSuccess(res, null, {
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      sendInternalError(res);
    }
  };
}
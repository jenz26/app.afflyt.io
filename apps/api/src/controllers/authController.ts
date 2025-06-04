import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import { Models } from '../models';
import { User } from '../types';
import { AuthRequest } from '../middleware/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export class AuthController {
  constructor(private models: Models) {}

  // Register new user
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, role = 'affiliate' } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          error: 'Email and password are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check if user already exists
      const existingUser = await this.models.user.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          error: 'User already exists',
          timestamp: new Date().toISOString()
        });
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

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: true
          },
          accessToken,
          verificationToken // For future use
        },
        message: 'User registered successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Login user
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'Email and password are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Find user
      const user = await this.models.user.findByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Verify password
      const isValidPassword = await this.models.user.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
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

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified
          },
          accessToken
        },
        message: 'Login successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Send magic link (for passwordless login)
  sendMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          error: 'Email is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check if user exists
      const user = await this.models.user.findByEmail(email);
      if (!user) {
        // For security, don't reveal if user doesn't exist
        res.status(200).json({
          success: true,
          message: 'If the email exists, a magic link has been sent',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Generate magic link token
      const magicToken = jwt.sign(
        { userId: user.id, purpose: 'magic_link' },
        process.env.JWT_SECRET as string,
        { expiresIn: '15m' }
      );

      const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/magic?token=${magicToken}`;

      // Send email (for MVP, we'll just log it)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 Magic link for ${email}: ${magicLink}`);
      } else {
        // In production, send actual email
        await resend.emails.send({
          from: 'noreply@afflyt.io',
          to: email,
          subject: 'Your Afflyt.io Magic Link',
          html: `
            <h2>Login to Afflyt.io</h2>
            <p>Click the link below to login:</p>
            <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
              Login to Afflyt.io
            </a>
            <p>This link expires in 15 minutes.</p>
          `
        });
      }

      res.status(200).json({
        success: true,
        message: 'Magic link sent successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Magic link error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Verify magic link
  verifyMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          error: 'Token is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; purpose: string };
      
      if (decoded.purpose !== 'magic_link') {
        res.status(400).json({
          error: 'Invalid token purpose',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Find user
      const user = await this.models.user.findById(decoded.userId);
      if (!user) {
        res.status(404).json({
          error: 'User not found',
          timestamp: new Date().toISOString()
        });
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

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified
          },
          accessToken
        },
        message: 'Magic link verified successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Magic link verification error:', error);
      res.status(401).json({
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Get current user profile
  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            balance: user.balance,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Generate API key
  generateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name } = req.body;
      const user = req.user!;

      if (!name) {
        res.status(400).json({
          error: 'API key name is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const apiKey = await this.models.user.generateApiKey(user.id, name);

      res.status(201).json({
        success: true,
        data: {
          apiKey: {
            id: apiKey.id,
            name: apiKey.name,
            key: apiKey.keyHash, // Show the actual key only once
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt
          }
        },
        message: 'API key generated successfully. Save this key as it will not be shown again.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Generate API key error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };
}
import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export class UserController {
  constructor(private models: Models) {}

  // GET /api/user/me
  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
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
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // PUT /api/user/me
  updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { 
        name, 
        firstName, 
        lastName, 
        amazonAssociateTag, 
        websiteUrl, 
        companyName 
      } = req.body;

      // Validazione Amazon Associate Tag
      if (amazonAssociateTag && !/^[a-zA-Z0-9\-]{3,20}$/.test(amazonAssociateTag)) {
        res.status(400).json({ 
          error: 'Invalid Amazon Associate Tag format',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Validazione URL
      if (websiteUrl && !this.isValidUrl(websiteUrl)) {
        res.status(400).json({ 
          error: 'Invalid website URL format',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (amazonAssociateTag !== undefined) updateData.amazonAssociateTag = amazonAssociateTag;
      if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
      if (companyName !== undefined) updateData.companyName = companyName;

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          error: 'No valid fields to update',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updatedUser = await this.models.user.updateById(user.id, updateData);

      if (!updatedUser) {
        res.status(404).json({
          error: 'User not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            isEmailVerified: updatedUser.isEmailVerified,
            balance: updatedUser.balance,
            amazonAssociateTag: updatedUser.amazonAssociateTag,
            websiteUrl: updatedUser.websiteUrl,
            companyName: updatedUser.companyName,
            lastLoginAt: updatedUser.lastLoginAt,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
          }
        },
        message: 'Profile updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/user/keys
  createApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        res.status(400).json({
          error: 'API key name is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Controlla limite API keys (max 10 per utente)
      if (user.apiKeys.length >= 10) {
        res.status(400).json({
          error: 'Maximum number of API keys reached (10)',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Genera nuova API key
      const apiKey = await this.models.user.generateApiKey(user.id, name.trim());

      res.status(201).json({
        success: true,
        data: {
          apiKey: {
            id: apiKey.id,
            name: apiKey.name,
            key: `ak_${apiKey.keyHash}`, // Mostra la chiave solo una volta
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt
          }
        },
        message: 'API key created successfully. Save this key as it will not be shown again.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/user/keys
  getApiKeys = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      const apiKeys = user.apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
        keyPreview: `ak_****${key.keyHash.slice(-4)}` // Mostra solo ultimi 4 caratteri
      }));

      res.status(200).json({
        success: true,
        data: {
          apiKeys
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // PATCH /api/user/keys/:keyId
  updateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { keyId } = req.params;
      const { name, isActive } = req.body;

      if (!keyId) {
        res.status(400).json({
          error: 'Key ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Trova l'API key
      const apiKeyIndex = user.apiKeys.findIndex(key => key.id === keyId);
      if (apiKeyIndex === -1) {
        res.status(404).json({
          error: 'API key not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Prepara i dati di aggiornamento
      const updateData: any = {};
      if (name !== undefined) updateData[`apiKeys.${apiKeyIndex}.name`] = name.trim();
      if (isActive !== undefined) updateData[`apiKeys.${apiKeyIndex}.isActive`] = isActive;

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          error: 'No valid fields to update',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updatedUser = await this.models.user.updateById(user.id, updateData);

      if (!updatedUser) {
        res.status(404).json({
          error: 'Failed to update API key',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updatedApiKey = updatedUser.apiKeys.find(key => key.id === keyId)!;

      res.status(200).json({
        success: true,
        data: {
          apiKey: {
            id: updatedApiKey.id,
            name: updatedApiKey.name,
            isActive: updatedApiKey.isActive,
            lastUsedAt: updatedApiKey.lastUsedAt,
            createdAt: updatedApiKey.createdAt,
            keyPreview: `ak_****${updatedApiKey.keyHash.slice(-4)}`
          }
        },
        message: 'API key updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // DELETE /api/user/keys/:keyId
  deleteApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { keyId } = req.params;

      if (!keyId) {
        res.status(400).json({
          error: 'Key ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Verifica che l'API key esista
      const apiKeyExists = user.apiKeys.some(key => key.id === keyId);
      if (!apiKeyExists) {
        res.status(404).json({
          error: 'API key not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Rimuovi l'API key
      const updatedUser = await this.models.user.updateById(user.id, {
        $pull: { apiKeys: { id: keyId } }
      } as any);

      if (!updatedUser) {
        res.status(500).json({
          error: 'Failed to delete API key',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'API key deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Utility function per validare URL
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
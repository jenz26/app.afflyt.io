import { Request, Response } from 'express';
import { Models } from '../models';
import { AuthRequest } from '../middleware/auth';
import { 
  CreateAmazonTagRequest, 
  UpdateAmazonTagRequest,
  CreateChannelRequest,
  UpdateChannelRequest,
  AmazonTagResponse,
  ChannelResponse
} from '../types';

export class UserController {
  constructor(private models: Models) {}

  // ===== EXISTING METHODS =====

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
            // ⚠️ DEPRECATED - kept for backward compatibility
            amazonAssociateTag: user.amazonAssociateTag,
            websiteUrl: user.websiteUrl,
            companyName: user.companyName,
            // ✨ NEW v1.8.x - Multi-entity support
            amazonTags: user.amazonTags || [],
            channels: user.channels || [],
            defaultAmazonTagId: user.defaultAmazonTagId,
            defaultChannelId: user.defaultChannelId,
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
        companyName,
        // ✨ NEW v1.8.x
        defaultAmazonTagId,
        defaultChannelId
      } = req.body;

      // Validazione Amazon Associate Tag (backward compatibility)
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

      // ✨ NEW v1.8.x: Validate default IDs exist
      if (defaultAmazonTagId) {
        const tag = await this.models.user.getAmazonTagById(user.id, defaultAmazonTagId);
        if (!tag) {
          res.status(400).json({
            error: 'Default Amazon tag not found',
            timestamp: new Date().toISOString()
          });
          return;
        }
      }

      if (defaultChannelId) {
        const channel = await this.models.user.getChannelById(user.id, defaultChannelId);
        if (!channel) {
          res.status(400).json({
            error: 'Default channel not found',
            timestamp: new Date().toISOString()
          });
          return;
        }
      }

      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (amazonAssociateTag !== undefined) updateData.amazonAssociateTag = amazonAssociateTag;
      if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
      if (companyName !== undefined) updateData.companyName = companyName;
      if (defaultAmazonTagId !== undefined) updateData.defaultAmazonTagId = defaultAmazonTagId;
      if (defaultChannelId !== undefined) updateData.defaultChannelId = defaultChannelId;

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
            amazonTags: updatedUser.amazonTags || [],
            channels: updatedUser.channels || [],
            defaultAmazonTagId: updatedUser.defaultAmazonTagId,
            defaultChannelId: updatedUser.defaultChannelId,
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

      const deleted = await this.models.user.deleteApiKey(user.id, keyId);

      if (!deleted) {
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

  // ===== ✨ NEW v1.8.x: AMAZON TAGS ENDPOINTS =====

  // POST /api/user/amazon-tags
  createAmazonTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const tagData: CreateAmazonTagRequest = req.body;

      const amazonTag = await this.models.user.createAmazonTag(user.id, tagData);

      // Helper function to safely convert Date to string
      const formatDate = (date: Date | undefined): string | undefined => {
        return date ? date.toISOString() : undefined;
      };

      const response: AmazonTagResponse = {
        id: amazonTag.id,
        tag: amazonTag.tag,
        marketplace: amazonTag.marketplace,
        name: amazonTag.name,
        isDefault: amazonTag.isDefault,
        isActive: amazonTag.isActive,
        createdAt: amazonTag.createdAt.toISOString(),
        lastUsedAt: formatDate(amazonTag.lastUsedAt),
        linksCreated: amazonTag.linksCreated,
        totalClicks: amazonTag.totalClicks,
        totalRevenue: amazonTag.totalRevenue
      };

      res.status(201).json({
        success: true,
        data: { amazonTag: response },
        message: 'Amazon tag created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating Amazon tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create Amazon tag';
      res.status(400).json({
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/user/amazon-tags
  getAmazonTags = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const amazonTags = await this.models.user.getAmazonTags(user.id);

      // Helper function to safely convert Date to string
      const formatDate = (date: Date | undefined): string | undefined => {
        return date ? date.toISOString() : undefined;
      };

      const response: AmazonTagResponse[] = amazonTags.map(tag => ({
        id: tag.id,
        tag: tag.tag,
        marketplace: tag.marketplace,
        name: tag.name,
        isDefault: tag.isDefault,
        isActive: tag.isActive,
        createdAt: tag.createdAt.toISOString(),
        lastUsedAt: formatDate(tag.lastUsedAt),
        linksCreated: tag.linksCreated,
        totalClicks: tag.totalClicks,
        totalRevenue: tag.totalRevenue
      }));

      res.status(200).json({
        success: true,
        data: { amazonTags: response },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching Amazon tags:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/user/amazon-tags/:tagId
  getAmazonTagById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { tagId } = req.params;

      if (!tagId) {
        res.status(400).json({
          error: 'Tag ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const amazonTag = await this.models.user.getAmazonTagById(user.id, tagId);

      if (!amazonTag) {
        res.status(404).json({
          error: 'Amazon tag not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Helper function to safely convert Date to string
      const formatDate = (date: Date | undefined): string | undefined => {
        return date ? date.toISOString() : undefined;
      };

      const response: AmazonTagResponse = {
        id: amazonTag.id,
        tag: amazonTag.tag,
        marketplace: amazonTag.marketplace,
        name: amazonTag.name,
        isDefault: amazonTag.isDefault,
        isActive: amazonTag.isActive,
        createdAt: amazonTag.createdAt.toISOString(),
        lastUsedAt: formatDate(amazonTag.lastUsedAt),
        linksCreated: amazonTag.linksCreated,
        totalClicks: amazonTag.totalClicks,
        totalRevenue: amazonTag.totalRevenue
      };

      res.status(200).json({
        success: true,
        data: { amazonTag: response },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching Amazon tag:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // PATCH /api/user/amazon-tags/:tagId
  updateAmazonTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { tagId } = req.params;
      const updates: UpdateAmazonTagRequest = req.body;

      if (!tagId) {
        res.status(400).json({
          error: 'Tag ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updatedTag = await this.models.user.updateAmazonTag(user.id, tagId, updates);

      if (!updatedTag) {
        res.status(404).json({
          error: 'Amazon tag not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Helper function to safely convert Date to string
      const formatDate = (date: Date | undefined): string | undefined => {
        return date ? date.toISOString() : undefined;
      };

      const response: AmazonTagResponse = {
        id: updatedTag.id,
        tag: updatedTag.tag,
        marketplace: updatedTag.marketplace,
        name: updatedTag.name,
        isDefault: updatedTag.isDefault,
        isActive: updatedTag.isActive,
        createdAt: updatedTag.createdAt.toISOString(),
        lastUsedAt: formatDate(updatedTag.lastUsedAt),
        linksCreated: updatedTag.linksCreated,
        totalClicks: updatedTag.totalClicks,
        totalRevenue: updatedTag.totalRevenue
      };

      res.status(200).json({
        success: true,
        data: { amazonTag: response },
        message: 'Amazon tag updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating Amazon tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update Amazon tag';
      res.status(400).json({
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  };

  // DELETE /api/user/amazon-tags/:tagId
  deleteAmazonTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { tagId } = req.params;

      if (!tagId) {
        res.status(400).json({
          error: 'Tag ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const deleted = await this.models.user.deleteAmazonTag(user.id, tagId);

      if (!deleted) {
        res.status(404).json({
          error: 'Amazon tag not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Amazon tag deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting Amazon tag:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // ===== ✨ NEW v1.8.x: CHANNELS ENDPOINTS =====

  // POST /api/user/channels
  createChannel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const channelData: CreateChannelRequest = req.body;

      const channel = await this.models.user.createChannel(user.id, channelData);

      // Helper functions for safe type conversion
      const formatDate = (date: Date | undefined): string | undefined => {
        return date ? date.toISOString() : undefined;
      };

      const formatOptionalString = (value: string | undefined): string | undefined => {
        return value || undefined;
      };

      const response: ChannelResponse = {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        url: formatOptionalString(channel.url),
        description: formatOptionalString(channel.description),
        isDefault: channel.isDefault,
        isActive: channel.isActive,
        createdAt: channel.createdAt.toISOString(),
        lastUsedAt: formatDate(channel.lastUsedAt),
        linksCreated: channel.linksCreated,
        totalClicks: channel.totalClicks,
        totalRevenue: channel.totalRevenue,
        defaultAmazonTagId: formatOptionalString(channel.defaultAmazonTagId)
      };

      res.status(201).json({
        success: true,
        data: { channel: response },
        message: 'Channel created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating channel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create channel';
      res.status(400).json({
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/user/channels
  getChannels = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const channels = await this.models.user.getChannels(user.id);

      // Helper functions for safe type conversion
      const formatDate = (date: Date | undefined): string | undefined => {
        return date ? date.toISOString() : undefined;
      };

      const formatOptionalString = (value: string | undefined): string | undefined => {
        return value || undefined;
      };

      const response: ChannelResponse[] = channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        url: formatOptionalString(channel.url),
        description: formatOptionalString(channel.description),
        isDefault: channel.isDefault,
        isActive: channel.isActive,
        createdAt: channel.createdAt.toISOString(),
        lastUsedAt: formatDate(channel.lastUsedAt),
        linksCreated: channel.linksCreated,
        totalClicks: channel.totalClicks,
        totalRevenue: channel.totalRevenue,
        defaultAmazonTagId: formatOptionalString(channel.defaultAmazonTagId)
      }));

      res.status(200).json({
        success: true,
        data: { channels: response },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/user/channels/:channelId
  getChannelById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { channelId } = req.params;

      if (!channelId) {
        res.status(400).json({
          error: 'Channel ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const channel = await this.models.user.getChannelById(user.id, channelId);

      if (!channel) {
        res.status(404).json({
          error: 'Channel not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Helper functions for safe type conversion
      const formatDate = (date: Date | undefined): string | undefined => {
        return date ? date.toISOString() : undefined;
      };

      const formatOptionalString = (value: string | undefined): string | undefined => {
        return value || undefined;
      };

      const response: ChannelResponse = {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        url: formatOptionalString(channel.url),
        description: formatOptionalString(channel.description),
        isDefault: channel.isDefault,
        isActive: channel.isActive,
        createdAt: channel.createdAt.toISOString(),
        lastUsedAt: formatDate(channel.lastUsedAt),
        linksCreated: channel.linksCreated,
        totalClicks: channel.totalClicks,
        totalRevenue: channel.totalRevenue,
        defaultAmazonTagId: formatOptionalString(channel.defaultAmazonTagId)
      };

      res.status(200).json({
        success: true,
        data: { channel: response },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching channel:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // PATCH /api/user/channels/:channelId
  updateChannel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { channelId } = req.params;
      const updates: UpdateChannelRequest = req.body;

      if (!channelId) {
        res.status(400).json({
          error: 'Channel ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updatedChannel = await this.models.user.updateChannel(user.id, channelId, updates);

      if (!updatedChannel) {
        res.status(404).json({
          error: 'Channel not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Helper functions for safe type conversion
      const formatDate = (date: Date | undefined): string | undefined => {
        return date ? date.toISOString() : undefined;
      };

      const formatOptionalString = (value: string | undefined): string | undefined => {
        return value || undefined;
      };

      const response: ChannelResponse = {
        id: updatedChannel.id,
        name: updatedChannel.name,
        type: updatedChannel.type,
        url: formatOptionalString(updatedChannel.url),
        description: formatOptionalString(updatedChannel.description),
        isDefault: updatedChannel.isDefault,
        isActive: updatedChannel.isActive,
        createdAt: updatedChannel.createdAt.toISOString(),
        lastUsedAt: formatDate(updatedChannel.lastUsedAt),
        linksCreated: updatedChannel.linksCreated,
        totalClicks: updatedChannel.totalClicks,
        totalRevenue: updatedChannel.totalRevenue,
        defaultAmazonTagId: formatOptionalString(updatedChannel.defaultAmazonTagId)
      };

      res.status(200).json({
        success: true,
        data: { channel: response },
        message: 'Channel updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating channel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update channel';
      res.status(400).json({
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  };

  // DELETE /api/user/channels/:channelId
  deleteChannel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { channelId } = req.params;

      if (!channelId) {
        res.status(400).json({
          error: 'Channel ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const deleted = await this.models.user.deleteChannel(user.id, channelId);

      if (!deleted) {
        res.status(404).json({
          error: 'Channel not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Channel deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting channel:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // ===== UTILITY METHODS =====

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
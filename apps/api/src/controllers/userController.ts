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
import {
  sendSuccess,
  sendValidationError,
  sendNotFoundError,
  sendInternalError
} from '../utils/responseHelpers';

export class UserController {
  constructor(private models: Models) {}

  // ===== EXISTING METHODS =====

  // GET /api/user/me
  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      const responseData = {
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
      };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      sendInternalError(res);
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
        sendValidationError(res, 'Invalid Amazon Associate Tag format');
        return;
      }

      // Validazione URL
      if (websiteUrl && !this.isValidUrl(websiteUrl)) {
        sendValidationError(res, 'Invalid website URL format');
        return;
      }

      // ✨ NEW v1.8.x: Validate default IDs exist
      if (defaultAmazonTagId) {
        const tag = await this.models.user.getAmazonTagById(user.id, defaultAmazonTagId);
        if (!tag) {
          sendValidationError(res, 'Default Amazon tag not found');
          return;
        }
      }

      if (defaultChannelId) {
        const channel = await this.models.user.getChannelById(user.id, defaultChannelId);
        if (!channel) {
          sendValidationError(res, 'Default channel not found');
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
        sendValidationError(res, 'No valid fields to update');
        return;
      }

      const updatedUser = await this.models.user.updateById(user.id, updateData);

      if (!updatedUser) {
        sendNotFoundError(res, 'User');
        return;
      }

      const responseData = {
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
      };

      sendSuccess(res, responseData, {
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      sendInternalError(res);
    }
  };

  // POST /api/user/keys
  createApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        sendValidationError(res, 'API key name is required');
        return;
      }

      // Controlla limite API keys (max 10 per utente)
      if (user.apiKeys.length >= 10) {
        sendValidationError(res, 'Maximum number of API keys reached (10)');
        return;
      }

      // Genera nuova API key
      const apiKey = await this.models.user.generateApiKey(user.id, name.trim());

      const responseData = {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: `ak_${apiKey.keyHash}`, // Mostra la chiave solo una volta
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt
        }
      };

      sendSuccess(res, responseData, {
        message: 'API key created successfully. Save this key as it will not be shown again.',
        statusCode: 201
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      sendInternalError(res);
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

      const responseData = {
        apiKeys
      };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      sendInternalError(res);
    }
  };

  // PATCH /api/user/keys/:keyId
  updateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { keyId } = req.params;
      const { name, isActive } = req.body;

      if (!keyId) {
        sendValidationError(res, 'Key ID is required');
        return;
      }

      // Trova l'API key
      const apiKeyIndex = user.apiKeys.findIndex(key => key.id === keyId);
      if (apiKeyIndex === -1) {
        sendNotFoundError(res, 'API key');
        return;
      }

      // Prepara i dati di aggiornamento
      const updateData: any = {};
      if (name !== undefined) updateData[`apiKeys.${apiKeyIndex}.name`] = name.trim();
      if (isActive !== undefined) updateData[`apiKeys.${apiKeyIndex}.isActive`] = isActive;

      if (Object.keys(updateData).length === 0) {
        sendValidationError(res, 'No valid fields to update');
        return;
      }

      const updatedUser = await this.models.user.updateById(user.id, updateData);

      if (!updatedUser) {
        sendInternalError(res, 'Failed to update API key');
        return;
      }

      const updatedApiKey = updatedUser.apiKeys.find(key => key.id === keyId)!;

      const responseData = {
        apiKey: {
          id: updatedApiKey.id,
          name: updatedApiKey.name,
          isActive: updatedApiKey.isActive,
          lastUsedAt: updatedApiKey.lastUsedAt,
          createdAt: updatedApiKey.createdAt,
          keyPreview: `ak_****${updatedApiKey.keyHash.slice(-4)}`
        }
      };

      sendSuccess(res, responseData, {
        message: 'API key updated successfully'
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      sendInternalError(res);
    }
  };

  // DELETE /api/user/keys/:keyId
  deleteApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { keyId } = req.params;

      if (!keyId) {
        sendValidationError(res, 'Key ID is required');
        return;
      }

      // Verifica che l'API key esista
      const apiKeyExists = user.apiKeys.some(key => key.id === keyId);
      if (!apiKeyExists) {
        sendNotFoundError(res, 'API key');
        return;
      }

      const deleted = await this.models.user.deleteApiKey(user.id, keyId);

      if (!deleted) {
        sendInternalError(res, 'Failed to delete API key');
        return;
      }

      sendSuccess(res, null, {
        message: 'API key deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      sendInternalError(res);
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

      const responseData = { amazonTag: response };

      sendSuccess(res, responseData, {
        message: 'Amazon tag created successfully',
        statusCode: 201
      });
    } catch (error) {
      console.error('Error creating Amazon tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create Amazon tag';
      sendValidationError(res, errorMessage);
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

      const responseData = { amazonTags: response };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching Amazon tags:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/amazon-tags/:tagId
  getAmazonTagById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { tagId } = req.params;

      if (!tagId) {
        sendValidationError(res, 'Tag ID is required');
        return;
      }

      const amazonTag = await this.models.user.getAmazonTagById(user.id, tagId);

      if (!amazonTag) {
        sendNotFoundError(res, 'Amazon tag');
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

      const responseData = { amazonTag: response };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching Amazon tag:', error);
      sendInternalError(res);
    }
  };

  // PATCH /api/user/amazon-tags/:tagId
  updateAmazonTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { tagId } = req.params;
      const updates: UpdateAmazonTagRequest = req.body;

      if (!tagId) {
        sendValidationError(res, 'Tag ID is required');
        return;
      }

      const updatedTag = await this.models.user.updateAmazonTag(user.id, tagId, updates);

      if (!updatedTag) {
        sendNotFoundError(res, 'Amazon tag');
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

      const responseData = { amazonTag: response };

      sendSuccess(res, responseData, {
        message: 'Amazon tag updated successfully'
      });
    } catch (error) {
      console.error('Error updating Amazon tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update Amazon tag';
      sendValidationError(res, errorMessage);
    }
  };

  // DELETE /api/user/amazon-tags/:tagId
  deleteAmazonTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { tagId } = req.params;

      if (!tagId) {
        sendValidationError(res, 'Tag ID is required');
        return;
      }

      const deleted = await this.models.user.deleteAmazonTag(user.id, tagId);

      if (!deleted) {
        sendNotFoundError(res, 'Amazon tag');
        return;
      }

      sendSuccess(res, null, {
        message: 'Amazon tag deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting Amazon tag:', error);
      sendInternalError(res);
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

      const responseData = { channel: response };

      sendSuccess(res, responseData, {
        message: 'Channel created successfully',
        statusCode: 201
      });
    } catch (error) {
      console.error('Error creating channel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create channel';
      sendValidationError(res, errorMessage);
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

      const responseData = { channels: response };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching channels:', error);
      sendInternalError(res);
    }
  };

  // GET /api/user/channels/:channelId
  getChannelById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { channelId } = req.params;

      if (!channelId) {
        sendValidationError(res, 'Channel ID is required');
        return;
      }

      const channel = await this.models.user.getChannelById(user.id, channelId);

      if (!channel) {
        sendNotFoundError(res, 'Channel');
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

      const responseData = { channel: response };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('Error fetching channel:', error);
      sendInternalError(res);
    }
  };

  // PATCH /api/user/channels/:channelId
  updateChannel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { channelId } = req.params;
      const updates: UpdateChannelRequest = req.body;

      if (!channelId) {
        sendValidationError(res, 'Channel ID is required');
        return;
      }

      const updatedChannel = await this.models.user.updateChannel(user.id, channelId, updates);

      if (!updatedChannel) {
        sendNotFoundError(res, 'Channel');
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

      const responseData = { channel: response };

      sendSuccess(res, responseData, {
        message: 'Channel updated successfully'
      });
    } catch (error) {
      console.error('Error updating channel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update channel';
      sendValidationError(res, errorMessage);
    }
  };

  // DELETE /api/user/channels/:channelId
  deleteChannel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { channelId } = req.params;

      if (!channelId) {
        sendValidationError(res, 'Channel ID is required');
        return;
      }

      const deleted = await this.models.user.deleteChannel(user.id, channelId);

      if (!deleted) {
        sendNotFoundError(res, 'Channel');
        return;
      }

      sendSuccess(res, null, {
        message: 'Channel deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting channel:', error);
      sendInternalError(res);
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
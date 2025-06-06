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
import { logger, logUtils, createModuleLogger } from '../config/logger';
import {
  sendSuccess,
  sendValidationError,
  sendNotFoundError,
  sendInternalError
} from '../utils/responseHelpers';

// ===== 🚀 NEW v1.8.4: STRUCTURED LOGGING WITH PINO =====
// Create module-specific logger for user operations
const userLogger = createModuleLogger('user');

export class UserController {
  constructor(private models: Models) {
    userLogger.debug('UserController initialized');
  }

  // ===== EXISTING METHODS =====

  // GET /api/user/me
  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;

      userLogger.debug({ userId: user.id }, 'User profile request started');

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

      // Log successful profile retrieval
      userLogger.info({ 
        userId: user.id,
        role: user.role,
        amazonTagsCount: user.amazonTags?.length || 0,
        channelsCount: user.channels?.length || 0
      }, 'User profile retrieved successfully');
      logUtils.performance.requestEnd('GET', '/api/user/me', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error fetching user profile');
      logUtils.performance.requestEnd('GET', '/api/user/me', duration, 500);
      sendInternalError(res);
    }
  };

  // PUT /api/user/me
  updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
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

      userLogger.debug({ 
        userId: user.id,
        fieldsToUpdate: Object.keys(req.body)
      }, 'Profile update request started');

      // Validazione Amazon Associate Tag (backward compatibility)
      if (amazonAssociateTag && !/^[a-zA-Z0-9\-]{3,20}$/.test(amazonAssociateTag)) {
        userLogger.warn({ 
          userId: user.id, 
          amazonAssociateTag 
        }, 'Profile update failed: invalid Amazon Associate Tag format');
        sendValidationError(res, 'Invalid Amazon Associate Tag format');
        return;
      }

      // Validazione URL
      if (websiteUrl && !this.isValidUrl(websiteUrl)) {
        userLogger.warn({ 
          userId: user.id, 
          websiteUrl 
        }, 'Profile update failed: invalid website URL format');
        sendValidationError(res, 'Invalid website URL format');
        return;
      }

      // ✨ NEW v1.8.x: Validate default IDs exist
      if (defaultAmazonTagId) {
        const tag = await this.models.user.getAmazonTagById(user.id, defaultAmazonTagId);
        if (!tag) {
          userLogger.warn({ 
            userId: user.id, 
            defaultAmazonTagId 
          }, 'Profile update failed: default Amazon tag not found');
          sendValidationError(res, 'Default Amazon tag not found');
          return;
        }
      }

      if (defaultChannelId) {
        const channel = await this.models.user.getChannelById(user.id, defaultChannelId);
        if (!channel) {
          userLogger.warn({ 
            userId: user.id, 
            defaultChannelId 
          }, 'Profile update failed: default channel not found');
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
        userLogger.warn({ userId: user.id }, 'Profile update failed: no valid fields to update');
        sendValidationError(res, 'No valid fields to update');
        return;
      }

      const updatedUser = await this.models.user.updateById(user.id, updateData);

      if (!updatedUser) {
        userLogger.error({ userId: user.id }, 'Profile update failed: user not found');
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

      // Log successful profile update
      logUtils.users.profileUpdated(user.id, Object.keys(updateData));
      logUtils.performance.requestEnd('PUT', '/api/user/me', Date.now() - startTime, 200);

      sendSuccess(res, responseData, {
        message: 'Profile updated successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error updating user profile');
      logUtils.performance.requestEnd('PUT', '/api/user/me', duration, 500);
      sendInternalError(res);
    }
  };

  // POST /api/user/keys
  createApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { name } = req.body;

      userLogger.debug({ 
        userId: user.id, 
        keyName: name,
        currentKeyCount: user.apiKeys.length
      }, 'API key creation request started');

      if (!name || name.trim().length === 0) {
        userLogger.warn({ userId: user.id }, 'API key creation failed: missing name');
        sendValidationError(res, 'API key name is required');
        return;
      }

      // Controlla limite API keys (max 10 per utente)
      if (user.apiKeys.length >= 10) {
        userLogger.warn({ 
          userId: user.id, 
          currentKeyCount: user.apiKeys.length 
        }, 'API key creation failed: maximum limit reached');
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

      // Log successful API key creation
      logUtils.users.apiKeyCreated(user.id, name.trim(), ['basic']);
      logUtils.performance.requestEnd('POST', '/api/user/keys', Date.now() - startTime, 201);

      sendSuccess(res, responseData, {
        message: 'API key created successfully. Save this key as it will not be shown again.',
        statusCode: 201
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error creating API key');
      logUtils.performance.requestEnd('POST', '/api/user/keys', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/keys
  getApiKeys = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;

      userLogger.debug({ 
        userId: user.id,
        keyCount: user.apiKeys.length
      }, 'API keys list request started');

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

      // Log successful API keys retrieval
      userLogger.info({ 
        userId: user.id, 
        keyCount: apiKeys.length,
        activeKeys: apiKeys.filter(k => k.isActive).length
      }, 'API keys retrieved successfully');
      logUtils.performance.requestEnd('GET', '/api/user/keys', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error fetching API keys');
      logUtils.performance.requestEnd('GET', '/api/user/keys', duration, 500);
      sendInternalError(res);
    }
  };

  // PATCH /api/user/keys/:keyId
  updateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { keyId } = req.params;
      const { name, isActive } = req.body;

      userLogger.debug({ 
        userId: user.id, 
        keyId,
        updateFields: { name: !!name, isActive }
      }, 'API key update request started');

      if (!keyId) {
        userLogger.warn({ userId: user.id }, 'API key update failed: missing key ID');
        sendValidationError(res, 'Key ID is required');
        return;
      }

      // Trova l'API key
      const apiKeyIndex = user.apiKeys.findIndex(key => key.id === keyId);
      if (apiKeyIndex === -1) {
        userLogger.warn({ 
          userId: user.id, 
          keyId 
        }, 'API key update failed: key not found');
        sendNotFoundError(res, 'API key');
        return;
      }

      // Prepara i dati di aggiornamento
      const updateData: any = {};
      if (name !== undefined) updateData[`apiKeys.${apiKeyIndex}.name`] = name.trim();
      if (isActive !== undefined) updateData[`apiKeys.${apiKeyIndex}.isActive`] = isActive;

      if (Object.keys(updateData).length === 0) {
        userLogger.warn({ 
          userId: user.id, 
          keyId 
        }, 'API key update failed: no valid fields to update');
        sendValidationError(res, 'No valid fields to update');
        return;
      }

      const updatedUser = await this.models.user.updateById(user.id, updateData);

      if (!updatedUser) {
        userLogger.error({ 
          userId: user.id, 
          keyId 
        }, 'API key update failed: user update failed');
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

      // Log successful API key update
      userLogger.info({ 
        userId: user.id, 
        keyId,
        updatedFields: Object.keys(req.body)
      }, 'API key updated successfully');
      logUtils.performance.requestEnd('PATCH', `/api/user/keys/${keyId}`, Date.now() - startTime, 200);

      sendSuccess(res, responseData, {
        message: 'API key updated successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error updating API key');
      logUtils.performance.requestEnd('PATCH', '/api/user/keys/:keyId', duration, 500);
      sendInternalError(res);
    }
  };

  // DELETE /api/user/keys/:keyId
  deleteApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { keyId } = req.params;

      userLogger.debug({ 
        userId: user.id, 
        keyId 
      }, 'API key deletion request started');

      if (!keyId) {
        userLogger.warn({ userId: user.id }, 'API key deletion failed: missing key ID');
        sendValidationError(res, 'Key ID is required');
        return;
      }

      // Verifica che l'API key esista
      const apiKeyExists = user.apiKeys.some(key => key.id === keyId);
      if (!apiKeyExists) {
        userLogger.warn({ 
          userId: user.id, 
          keyId 
        }, 'API key deletion failed: key not found');
        sendNotFoundError(res, 'API key');
        return;
      }

      const deleted = await this.models.user.deleteApiKey(user.id, keyId);

      if (!deleted) {
        userLogger.error({ 
          userId: user.id, 
          keyId 
        }, 'API key deletion failed: database operation failed');
        sendInternalError(res, 'Failed to delete API key');
        return;
      }

      // Log successful API key deletion
      logUtils.users.apiKeyRevoked(user.id, keyId, 'user_requested');
      logUtils.performance.requestEnd('DELETE', `/api/user/keys/${keyId}`, Date.now() - startTime, 200);

      sendSuccess(res, null, {
        message: 'API key deleted successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error deleting API key');
      logUtils.performance.requestEnd('DELETE', '/api/user/keys/:keyId', duration, 500);
      sendInternalError(res);
    }
  };

  // ===== ✨ NEW v1.8.x: AMAZON TAGS ENDPOINTS =====

  // POST /api/user/amazon-tags
  createAmazonTag = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const tagData: CreateAmazonTagRequest = req.body;

      userLogger.debug({ 
        userId: user.id,
        tagData: { ...tagData, tag: tagData.tag?.substring(0, 10) + '***' }
      }, 'Amazon tag creation request started');

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

      // Log successful Amazon tag creation
      userLogger.info({ 
        userId: user.id,
        tagId: amazonTag.id,
        marketplace: amazonTag.marketplace,
        isDefault: amazonTag.isDefault
      }, 'Amazon tag created successfully');
      logUtils.performance.requestEnd('POST', '/api/user/amazon-tags', Date.now() - startTime, 201);

      sendSuccess(res, responseData, {
        message: 'Amazon tag created successfully',
        statusCode: 201
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error creating Amazon tag');
      logUtils.performance.requestEnd('POST', '/api/user/amazon-tags', duration, 500);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create Amazon tag';
      sendValidationError(res, errorMessage);
    }
  };

  // GET /api/user/amazon-tags
  getAmazonTags = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      
      userLogger.debug({ userId: user.id }, 'Amazon tags list request started');
      
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

      // Log successful Amazon tags retrieval
      userLogger.info({ 
        userId: user.id,
        tagCount: amazonTags.length,
        defaultTags: amazonTags.filter(t => t.isDefault).length
      }, 'Amazon tags retrieved successfully');
      logUtils.performance.requestEnd('GET', '/api/user/amazon-tags', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error fetching Amazon tags');
      logUtils.performance.requestEnd('GET', '/api/user/amazon-tags', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/amazon-tags/:tagId
  getAmazonTagById = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { tagId } = req.params;

      userLogger.debug({ 
        userId: user.id, 
        tagId 
      }, 'Amazon tag details request started');

      if (!tagId) {
        userLogger.warn({ userId: user.id }, 'Amazon tag request failed: missing tag ID');
        sendValidationError(res, 'Tag ID is required');
        return;
      }

      const amazonTag = await this.models.user.getAmazonTagById(user.id, tagId);

      if (!amazonTag) {
        userLogger.warn({ 
          userId: user.id, 
          tagId 
        }, 'Amazon tag request failed: tag not found');
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

      // Log successful Amazon tag retrieval
      userLogger.info({ 
        userId: user.id,
        tagId,
        linksCreated: amazonTag.linksCreated,
        totalRevenue: amazonTag.totalRevenue
      }, 'Amazon tag details retrieved successfully');
      logUtils.performance.requestEnd('GET', `/api/user/amazon-tags/${tagId}`, Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error fetching Amazon tag');
      logUtils.performance.requestEnd('GET', '/api/user/amazon-tags/:tagId', duration, 500);
      sendInternalError(res);
    }
  };

  // PATCH /api/user/amazon-tags/:tagId
  updateAmazonTag = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { tagId } = req.params;
      const updates: UpdateAmazonTagRequest = req.body;

      userLogger.debug({ 
        userId: user.id,
        tagId,
        updateFields: Object.keys(updates)
      }, 'Amazon tag update request started');

      if (!tagId) {
        userLogger.warn({ userId: user.id }, 'Amazon tag update failed: missing tag ID');
        sendValidationError(res, 'Tag ID is required');
        return;
      }

      const updatedTag = await this.models.user.updateAmazonTag(user.id, tagId, updates);

      if (!updatedTag) {
        userLogger.warn({ 
          userId: user.id, 
          tagId 
        }, 'Amazon tag update failed: tag not found');
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

      // Log successful Amazon tag update
      userLogger.info({ 
        userId: user.id,
        tagId,
        updatedFields: Object.keys(updates)
      }, 'Amazon tag updated successfully');
      logUtils.performance.requestEnd('PATCH', `/api/user/amazon-tags/${tagId}`, Date.now() - startTime, 200);

      sendSuccess(res, responseData, {
        message: 'Amazon tag updated successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error updating Amazon tag');
      logUtils.performance.requestEnd('PATCH', '/api/user/amazon-tags/:tagId', duration, 500);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update Amazon tag';
      sendValidationError(res, errorMessage);
    }
  };

  // DELETE /api/user/amazon-tags/:tagId
  deleteAmazonTag = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { tagId } = req.params;

      userLogger.debug({ 
        userId: user.id, 
        tagId 
      }, 'Amazon tag deletion request started');

      if (!tagId) {
        userLogger.warn({ userId: user.id }, 'Amazon tag deletion failed: missing tag ID');
        sendValidationError(res, 'Tag ID is required');
        return;
      }

      const deleted = await this.models.user.deleteAmazonTag(user.id, tagId);

      if (!deleted) {
        userLogger.warn({ 
          userId: user.id, 
          tagId 
        }, 'Amazon tag deletion failed: tag not found');
        sendNotFoundError(res, 'Amazon tag');
        return;
      }

      // Log successful Amazon tag deletion
      userLogger.info({ 
        userId: user.id, 
        tagId 
      }, 'Amazon tag deleted successfully');
      logUtils.performance.requestEnd('DELETE', `/api/user/amazon-tags/${tagId}`, Date.now() - startTime, 200);

      sendSuccess(res, null, {
        message: 'Amazon tag deleted successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error deleting Amazon tag');
      logUtils.performance.requestEnd('DELETE', '/api/user/amazon-tags/:tagId', duration, 500);
      sendInternalError(res);
    }
  };

  // ===== ✨ NEW v1.8.x: CHANNELS ENDPOINTS =====

  // POST /api/user/channels
  createChannel = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const channelData: CreateChannelRequest = req.body;

      userLogger.debug({ 
        userId: user.id,
        channelType: channelData.type,
        channelName: channelData.name
      }, 'Channel creation request started');

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

      // Log successful channel creation
      userLogger.info({ 
        userId: user.id,
        channelId: channel.id,
        channelType: channel.type,
        isDefault: channel.isDefault
      }, 'Channel created successfully');
      logUtils.performance.requestEnd('POST', '/api/user/channels', Date.now() - startTime, 201);

      sendSuccess(res, responseData, {
        message: 'Channel created successfully',
        statusCode: 201
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error creating channel');
      logUtils.performance.requestEnd('POST', '/api/user/channels', duration, 500);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create channel';
      sendValidationError(res, errorMessage);
    }
  };

  // GET /api/user/channels
  getChannels = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      
      userLogger.debug({ userId: user.id }, 'Channels list request started');
      
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

      // Log successful channels retrieval
      userLogger.info({ 
        userId: user.id,
        channelCount: channels.length,
        channelTypes: [...new Set(channels.map(c => c.type))]
      }, 'Channels retrieved successfully');
      logUtils.performance.requestEnd('GET', '/api/user/channels', Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error fetching channels');
      logUtils.performance.requestEnd('GET', '/api/user/channels', duration, 500);
      sendInternalError(res);
    }
  };

  // GET /api/user/channels/:channelId
  getChannelById = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { channelId } = req.params;

      userLogger.debug({ 
        userId: user.id, 
        channelId 
      }, 'Channel details request started');

      if (!channelId) {
        userLogger.warn({ userId: user.id }, 'Channel request failed: missing channel ID');
        sendValidationError(res, 'Channel ID is required');
        return;
      }

      const channel = await this.models.user.getChannelById(user.id, channelId);

      if (!channel) {
        userLogger.warn({ 
          userId: user.id, 
          channelId 
        }, 'Channel request failed: channel not found');
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

      // Log successful channel retrieval
      userLogger.info({ 
        userId: user.id,
        channelId,
        channelType: channel.type,
        totalRevenue: channel.totalRevenue
      }, 'Channel details retrieved successfully');
      logUtils.performance.requestEnd('GET', `/api/user/channels/${channelId}`, Date.now() - startTime, 200);

      sendSuccess(res, responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error fetching channel');
      logUtils.performance.requestEnd('GET', '/api/user/channels/:channelId', duration, 500);
      sendInternalError(res);
    }
  };

  // PATCH /api/user/channels/:channelId
  updateChannel = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { channelId } = req.params;
      const updates: UpdateChannelRequest = req.body;

      userLogger.debug({ 
        userId: user.id,
        channelId,
        updateFields: Object.keys(updates)
      }, 'Channel update request started');

      if (!channelId) {
        userLogger.warn({ userId: user.id }, 'Channel update failed: missing channel ID');
        sendValidationError(res, 'Channel ID is required');
        return;
      }

      const updatedChannel = await this.models.user.updateChannel(user.id, channelId, updates);

      if (!updatedChannel) {
        userLogger.warn({ 
          userId: user.id, 
          channelId 
        }, 'Channel update failed: channel not found');
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

      // Log successful channel update
      userLogger.info({ 
        userId: user.id,
        channelId,
        updatedFields: Object.keys(updates)
      }, 'Channel updated successfully');
      logUtils.performance.requestEnd('PATCH', `/api/user/channels/${channelId}`, Date.now() - startTime, 200);

      sendSuccess(res, responseData, {
        message: 'Channel updated successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error updating channel');
      logUtils.performance.requestEnd('PATCH', '/api/user/channels/:channelId', duration, 500);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update channel';
      sendValidationError(res, errorMessage);
    }
  };

  // DELETE /api/user/channels/:channelId
  deleteChannel = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const user = req.user!;
      const { channelId } = req.params;

      userLogger.debug({ 
        userId: user.id, 
        channelId 
      }, 'Channel deletion request started');

      if (!channelId) {
        userLogger.warn({ userId: user.id }, 'Channel deletion failed: missing channel ID');
        sendValidationError(res, 'Channel ID is required');
        return;
      }

      const deleted = await this.models.user.deleteChannel(user.id, channelId);

      if (!deleted) {
        userLogger.warn({ 
          userId: user.id, 
          channelId 
        }, 'Channel deletion failed: channel not found');
        sendNotFoundError(res, 'Channel');
        return;
      }

      // Log successful channel deletion
      userLogger.info({ 
        userId: user.id, 
        channelId 
      }, 'Channel deleted successfully');
      logUtils.performance.requestEnd('DELETE', `/api/user/channels/${channelId}`, Date.now() - startTime, 200);

      sendSuccess(res, null, {
        message: 'Channel deleted successfully'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ error, duration }, 'Error deleting channel');
      logUtils.performance.requestEnd('DELETE', '/api/user/channels/:channelId', duration, 500);
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
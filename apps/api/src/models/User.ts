import { Collection, Db, ObjectId } from 'mongodb';
import { 
  User, 
  ApiKey, 
  AmazonTag, 
  Channel, 
  CreateAmazonTagRequest,
  UpdateAmazonTagRequest,
  CreateChannelRequest,
  UpdateChannelRequest,
  AMAZON_MARKETPLACES,
  CHANNEL_TYPES,
  AMAZON_TAG_REGEX,
  // 🎨 NEW v1.8.9: Add branding imports
  UserBranding,
  UpdateUserBrandingRequest,
  UserBrandingResponse,
  BACKGROUND_TYPES,
  GRADIENT_DIRECTIONS,
  BRANDING_LIMITS,
  DEFAULT_BRANDING
} from '../types';
import { logUtils, createModuleLogger } from '../config/logger';
import { database } from '../config/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Create module-specific logger
const userLogger = createModuleLogger('user');

export class UserModel {
  private collection: Collection<User>;

  constructor(db: Db) {
    this.collection = db.collection<User>('users');
    userLogger.debug('UserModel initialized');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.collection.createIndex({ email: 1 }, { unique: true }),
        this.collection.createIndex({ id: 1 }, { unique: true }),
        this.collection.createIndex({ 'apiKeys.id': 1 }),
        // ✨ NEW v1.8.x: Indexes for multi-entity support
        this.collection.createIndex({ 'amazonTags.id': 1 }),
        this.collection.createIndex({ 'amazonTags.tag': 1 }),
        this.collection.createIndex({ 'amazonTags.marketplace': 1 }),
        this.collection.createIndex({ 'channels.id': 1 }),
        this.collection.createIndex({ 'channels.type': 1 })
      ]);
      
      const duration = Date.now() - startTime;
      userLogger.info({ 
        duration,
        indexes: [
          'email (unique)', 'id (unique)', 'apiKeys.id',
          'amazonTags.id', 'amazonTags.tag', 'amazonTags.marketplace',
          'channels.id', 'channels.type'
        ]
      }, 'User indexes created successfully (including v1.8.x multi-entity indexes)');
      
      // Log performance if slow
      logUtils.performance.slowQuery('createUserIndexes', duration, 3000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      userLogger.error({ 
        error,
        duration,
        collection: 'users'
      }, 'Failed to create user indexes');
      
      logUtils.database.error('createUserIndexes', error);
      throw error;
    }
  }

  async create(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'apiKeys' | 'balance' | 'amazonTags' | 'channels'>): Promise<User> {
    const startTime = Date.now();
    
    userLogger.info({ 
      email: userData.email,
      role: userData.role 
    }, 'Creating new user');

    return await database.monitoredOperation('users', 'create', async () => {
      const now = new Date();
      const user: User = {
        ...userData,
        balance: 0,
        apiKeys: [],
        // ✨ NEW v1.8.x: Initialize empty arrays for multi-entity support
        amazonTags: [],
        channels: [],
        createdAt: now,
        updatedAt: now
      };

      const result = await this.collection.insertOne(user);
      const createdUser = { ...user, _id: result.insertedId };
      
      const duration = Date.now() - startTime;
      
      // Log successful user creation
      logUtils.auth.register(createdUser.id, userData.email);
      
      userLogger.info({ 
        userId: createdUser.id,
        email: userData.email,
        role: userData.role,
        duration
      }, 'User created successfully');
      
      return createdUser;
    });
  }

  // ===== EXISTING METHODS WITH LOGGING =====

  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    userLogger.debug({ userId, keyId }, 'Deleting API key');
    
    return await database.monitoredOperation('users', 'deleteApiKey', async () => {
      const result = await this.collection.updateOne(
        { id: userId },
        { 
          $pull: { apiKeys: { id: keyId } },
          $set: { updatedAt: new Date() }
        }
      );

      const success = result.modifiedCount > 0;
      
      if (success) {
        userLogger.info({ userId, keyId }, 'API key deleted successfully');
      } else {
        userLogger.warn({ userId, keyId }, 'API key deletion found no matching document');
      }
      
      return success;
    });
  }

  async findById(id: string): Promise<User | null> {
    userLogger.debug({ userId: id }, 'Finding user by ID');
    
    return await database.monitoredOperation('users', 'findById', async () => {
      const user = await this.collection.findOne({ id });
      
      userLogger.debug({ 
        userId: id, 
        found: !!user,
        email: user?.email
      }, 'Find by ID completed');
      
      return user;
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    userLogger.debug({ email }, 'Finding user by email');
    
    return await database.monitoredOperation('users', 'findByEmail', async () => {
      const user = await this.collection.findOne({ email });
      
      userLogger.debug({ 
        email, 
        found: !!user,
        userId: user?.id
      }, 'Find by email completed');
      
      return user;
    });
  }

  async updateById(id: string, updates: Partial<User>): Promise<User | null> {
    userLogger.debug({ userId: id, updates: Object.keys(updates) }, 'Updating user');
    
    return await database.monitoredOperation('users', 'updateById', async () => {
      const result = await this.collection.findOneAndUpdate(
        { id },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        },
        { returnDocument: 'after' }
      );
      
      if (result) {
        userLogger.info({ 
          userId: id, 
          updatedFields: Object.keys(updates) 
        }, 'User updated successfully');
      } else {
        userLogger.warn({ userId: id }, 'User update found no matching document');
      }
      
      return result || null;
    });
  }

  async hashPassword(password: string): Promise<string> {
    userLogger.debug('Hashing password');
    
    const startTime = Date.now();
    const hash = await bcrypt.hash(password, 12);
    const duration = Date.now() - startTime;
    
    userLogger.debug({ duration }, 'Password hashed successfully');
    
    // Log if hashing is slow
    logUtils.performance.slowQuery('passwordHashing', duration, 500);
    
    return hash;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    userLogger.debug('Verifying password');
    
    const startTime = Date.now();
    const isValid = await bcrypt.compare(password, hash);
    const duration = Date.now() - startTime;
    
    userLogger.debug({ 
      valid: isValid, 
      duration 
    }, 'Password verification completed');
    
    // Log if verification is slow
    logUtils.performance.slowQuery('passwordVerification', duration, 500);
    
    return isValid;
  }

  async generateApiKey(userId: string, name: string): Promise<ApiKey> {
    userLogger.info({ userId, keyName: name }, 'Generating API key');
    
    return await database.monitoredOperation('users', 'generateApiKey', async () => {
      const apiKey: ApiKey = {
        id: crypto.randomUUID(),
        name,
        keyHash: crypto.randomBytes(32).toString('hex'),
        isActive: true,
        createdAt: new Date()
      };

      await this.collection.updateOne(
        { id: userId },
        { 
          $push: { apiKeys: apiKey },
          $set: { updatedAt: new Date() }
        }
      );

      // Log successful API key generation
      logUtils.auth.apiKeyGenerated(userId, name);
      
      userLogger.info({ 
        userId, 
        keyId: apiKey.id, 
        keyName: name 
      }, 'API key generated successfully');

      return apiKey;
    });
  }

  async findByApiKey(apiKeyHash: string): Promise<{ user: User; apiKey: ApiKey } | null> {
    userLogger.debug('Finding user by API key');
    
    return await database.monitoredOperation('users', 'findByApiKey', async () => {
      const user = await this.collection.findOne({
        'apiKeys.keyHash': apiKeyHash,
        'apiKeys.isActive': true
      });

      if (!user) {
        userLogger.debug('API key not found or inactive');
        return null;
      }

      const apiKey = user.apiKeys.find(key => key.keyHash === apiKeyHash && key.isActive);
      if (!apiKey) {
        userLogger.warn({ userId: user.id }, 'API key found in user but not active');
        return null;
      }

      // Update last used
      await this.collection.updateOne(
        { id: user.id, 'apiKeys.id': apiKey.id },
        { 
          $set: { 
            'apiKeys.$.lastUsedAt': new Date(),
            updatedAt: new Date()
          }
        }
      );

      userLogger.debug({ 
        userId: user.id, 
        keyId: apiKey.id,
        keyName: apiKey.name
      }, 'API key authentication successful');

      return { user, apiKey };
    });
  }

  // ===== ✨ NEW v1.8.x: AMAZON TAGS MANAGEMENT WITH LOGGING =====

  /**
   * Create a new Amazon Tag for the user
   * ✅ FIX: Inizializza il campo amazonTags se non esiste (per utenti esistenti)
   */
  async createAmazonTag(userId: string, tagData: CreateAmazonTagRequest): Promise<AmazonTag> {
    userLogger.info({ 
      userId, 
      tag: tagData.tag, 
      marketplace: tagData.marketplace,
      name: tagData.name,
      isDefault: tagData.isDefault
    }, 'Creating Amazon tag');

    return await database.monitoredOperation('users', 'createAmazonTag', async () => {
      // Validation
      this.validateAmazonTagData(tagData);

      // Check if user exists
      const user = await this.findById(userId);
      if (!user) {
        userLogger.error({ userId }, 'User not found for Amazon tag creation');
        throw new Error('User not found');
      }

      // ✅ FIX: Ensure amazonTags field exists (automatic migration for existing users)
      await this.collection.updateOne(
        { 
          id: userId,
          amazonTags: { $exists: false }
        },
        {
          $set: { amazonTags: [] }
        }
      );

      // Reload user with updated fields
      const updatedUser = await this.findById(userId);
      if (!updatedUser) {
        userLogger.error({ userId }, 'User not found after amazonTags initialization');
        throw new Error('User not found after initialization');
      }

      // Check if tag already exists for this marketplace
      const existingTag = updatedUser.amazonTags?.find(
        tag => tag.tag === tagData.tag && tag.marketplace === tagData.marketplace
      );
      if (existingTag) {
        userLogger.warn({ 
          userId, 
          tag: tagData.tag, 
          marketplace: tagData.marketplace,
          existingTagId: existingTag.id
        }, 'Amazon tag already exists for marketplace');
        throw new Error(`Amazon tag '${tagData.tag}' already exists for marketplace '${tagData.marketplace}'`);
      }

      // If this should be the default, unset other defaults for this marketplace
      if (tagData.isDefault) {
        await this.collection.updateOne(
          { id: userId },
          { 
            $set: { 
              'amazonTags.$[elem].isDefault': false,
              updatedAt: new Date()
            } 
          },
          { 
            arrayFilters: [{ 'elem.marketplace': tagData.marketplace }] 
          }
        );
        
        userLogger.debug({ 
          userId, 
          marketplace: tagData.marketplace 
        }, 'Unset other default tags for marketplace');
      }

      const amazonTag: AmazonTag = {
        id: crypto.randomUUID(),
        tag: tagData.tag,
        marketplace: tagData.marketplace,
        name: tagData.name,
        isDefault: tagData.isDefault || false,
        isActive: true,
        createdAt: new Date(),
        linksCreated: 0,
        totalClicks: 0,
        totalRevenue: 0
      };

      // ✅ FIX: Now $push will work because the field definitely exists
      await this.collection.updateOne(
        { id: userId },
        { 
          $push: { amazonTags: amazonTag },
          $set: { 
            updatedAt: new Date(),
            // Set as user's default if first tag or explicitly requested
            ...(tagData.isDefault || updatedUser.amazonTags?.length === 0 ? { defaultAmazonTagId: amazonTag.id } : {})
          }
        }
      );

      userLogger.info({ 
        userId, 
        tagId: amazonTag.id,
        tag: amazonTag.tag,
        marketplace: amazonTag.marketplace,
        isDefault: amazonTag.isDefault,
        isFirstTag: updatedUser.amazonTags?.length === 0
      }, 'Amazon tag created successfully');

      return amazonTag;
    });
  }

  /**
   * Get all Amazon Tags for a user
   */
  async getAmazonTags(userId: string): Promise<AmazonTag[]> {
    userLogger.debug({ userId }, 'Getting Amazon tags');
    
    return await database.monitoredOperation('users', 'getAmazonTags', async () => {
      const user = await this.findById(userId);
      const tags = user?.amazonTags || [];
      
      userLogger.debug({ 
        userId, 
        tagCount: tags.length 
      }, 'Amazon tags retrieved');
      
      return tags;
    });
  }

  /**
   * Get Amazon Tag by ID
   */
  async getAmazonTagById(userId: string, tagId: string): Promise<AmazonTag | null> {
    userLogger.debug({ userId, tagId }, 'Getting Amazon tag by ID');
    
    return await database.monitoredOperation('users', 'getAmazonTagById', async () => {
      const user = await this.findById(userId);
      const tag = user?.amazonTags?.find(tag => tag.id === tagId) || null;
      
      userLogger.debug({ 
        userId, 
        tagId, 
        found: !!tag,
        tag: tag?.tag,
        marketplace: tag?.marketplace
      }, 'Amazon tag by ID completed');
      
      return tag;
    });
  }

  /**
   * Update Amazon Tag
   */
  async updateAmazonTag(userId: string, tagId: string, updates: UpdateAmazonTagRequest): Promise<AmazonTag | null> {
    userLogger.info({ 
      userId, 
      tagId, 
      updates: Object.keys(updates) 
    }, 'Updating Amazon tag');

    return await database.monitoredOperation('users', 'updateAmazonTag', async () => {
      const user = await this.findById(userId);
      if (!user) {
        userLogger.error({ userId }, 'User not found for Amazon tag update');
        return null;
      }

      const tagIndex = user.amazonTags?.findIndex(tag => tag.id === tagId) ?? -1;
      if (tagIndex === -1) {
        userLogger.warn({ userId, tagId }, 'Amazon tag not found for update');
        return null;
      }

      // Validate updates
      if (updates.tag !== undefined) {
        if (!AMAZON_TAG_REGEX.test(updates.tag)) {
          userLogger.error({ 
            userId, 
            tagId, 
            invalidTag: updates.tag 
          }, 'Invalid Amazon tag format');
          throw new Error('Invalid Amazon tag format');
        }

        // Check for duplicates
        const currentTag = user.amazonTags[tagIndex];
        if (currentTag) {
          const existingTag = user.amazonTags?.find(
            tag => tag.id !== tagId && tag.tag === updates.tag && tag.marketplace === currentTag.marketplace
          );
          if (existingTag) {
            userLogger.warn({ 
              userId, 
              tagId, 
              duplicateTag: updates.tag,
              marketplace: currentTag.marketplace,
              existingTagId: existingTag.id
            }, 'Amazon tag already exists for marketplace');
            throw new Error(`Amazon tag '${updates.tag}' already exists for this marketplace`);
          }
        }
      }

      // If setting as default, unset other defaults for this marketplace
      if (updates.isDefault === true) {
        const currentTag = user.amazonTags[tagIndex];
        if (currentTag) {
          await this.collection.updateOne(
            { id: userId },
            { 
              $set: { 
                'amazonTags.$[elem].isDefault': false,
                updatedAt: new Date()
              } 
            },
            { 
              arrayFilters: [{ 
                'elem.marketplace': currentTag.marketplace,
                'elem.id': { $ne: tagId }
              }] 
            }
          );
          
          userLogger.debug({ 
            userId, 
            tagId,
            marketplace: currentTag.marketplace 
          }, 'Unset other default tags for marketplace');
        }
      }

      // Build update fields
      const updateFields: any = {};
      if (updates.tag !== undefined) updateFields[`amazonTags.${tagIndex}.tag`] = updates.tag;
      if (updates.name !== undefined) updateFields[`amazonTags.${tagIndex}.name`] = updates.name;
      if (updates.isDefault !== undefined) updateFields[`amazonTags.${tagIndex}.isDefault`] = updates.isDefault;
      if (updates.isActive !== undefined) updateFields[`amazonTags.${tagIndex}.isActive`] = updates.isActive;
      updateFields.updatedAt = new Date();

      const result = await this.collection.findOneAndUpdate(
        { id: userId },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      const updatedTag = result?.amazonTags?.find(tag => tag.id === tagId) || null;
      
      if (updatedTag) {
        userLogger.info({ 
          userId, 
          tagId,
          updatedFields: Object.keys(updates),
          tag: updatedTag.tag,
          marketplace: updatedTag.marketplace
        }, 'Amazon tag updated successfully');
      }

      return updatedTag;
    });
  }

  /**
   * Delete Amazon Tag
   */
  async deleteAmazonTag(userId: string, tagId: string): Promise<boolean> {
    userLogger.info({ userId, tagId }, 'Deleting Amazon tag');
    
    return await database.monitoredOperation('users', 'deleteAmazonTag', async () => {
      const result = await this.collection.updateOne(
        { id: userId },
        { 
          $pull: { amazonTags: { id: tagId } },
          $set: { updatedAt: new Date() }
        }
      );

      const success = result.modifiedCount > 0;
      
      if (success) {
        userLogger.info({ userId, tagId }, 'Amazon tag deleted successfully');
      } else {
        userLogger.warn({ userId, tagId }, 'Amazon tag deletion found no matching document');
      }

      return success;
    });
  }

  // ===== ✨ NEW v1.8.x: CHANNELS MANAGEMENT WITH LOGGING =====

  /**
   * Create a new Channel for the user
   * ✅ FIX: Inizializza il campo channels se non esiste (per utenti esistenti)
   */
  async createChannel(userId: string, channelData: CreateChannelRequest): Promise<Channel> {
    userLogger.info({ 
      userId, 
      name: channelData.name,
      type: channelData.type,
      url: channelData.url,
      isDefault: channelData.isDefault
    }, 'Creating channel');

    return await database.monitoredOperation('users', 'createChannel', async () => {
      // Validation
      this.validateChannelData(channelData);

      const user = await this.findById(userId);
      if (!user) {
        userLogger.error({ userId }, 'User not found for channel creation');
        throw new Error('User not found');
      }

      // ✅ FIX: Ensure channels field exists (automatic migration for existing users)
      await this.collection.updateOne(
        { 
          id: userId,
          channels: { $exists: false }
        },
        {
          $set: { channels: [] }
        }
      );

      // Reload user with updated fields
      const updatedUser = await this.findById(userId);
      if (!updatedUser) {
        userLogger.error({ userId }, 'User not found after channels initialization');
        throw new Error('User not found after initialization');
      }

      // Check if channel name already exists
      const existingChannel = updatedUser.channels?.find(channel => channel.name === channelData.name);
      if (existingChannel) {
        userLogger.warn({ 
          userId, 
          channelName: channelData.name,
          existingChannelId: existingChannel.id
        }, 'Channel name already exists');
        throw new Error(`Channel '${channelData.name}' already exists`);
      }

      // If this should be the default, unset other defaults
      if (channelData.isDefault) {
        await this.collection.updateOne(
          { id: userId },
          { 
            $set: { 
              'channels.$[].isDefault': false,
              updatedAt: new Date()
            } 
          }
        );
        
        userLogger.debug({ userId }, 'Unset other default channels');
      }

      const channel: Channel = {
        id: crypto.randomUUID(),
        name: channelData.name,
        type: channelData.type,
        url: channelData.url,
        description: channelData.description,
        isDefault: channelData.isDefault || false,
        isActive: true,
        createdAt: new Date(),
        linksCreated: 0,
        totalClicks: 0,
        totalRevenue: 0,
        defaultAmazonTagId: channelData.defaultAmazonTagId
      };

      // ✅ FIX: Now $push will work because the field definitely exists
      await this.collection.updateOne(
        { id: userId },
        { 
          $push: { channels: channel },
          $set: { 
            updatedAt: new Date(),
            // Set as user's default if first channel or explicitly requested
            ...(channelData.isDefault || updatedUser.channels?.length === 0 ? { defaultChannelId: channel.id } : {})
          }
        }
      );

      userLogger.info({ 
        userId, 
        channelId: channel.id,
        name: channel.name,
        type: channel.type,
        isDefault: channel.isDefault,
        isFirstChannel: updatedUser.channels?.length === 0
      }, 'Channel created successfully');

      return channel;
    });
  }

  /**
   * Get all Channels for a user
   */
  async getChannels(userId: string): Promise<Channel[]> {
    userLogger.debug({ userId }, 'Getting channels');
    
    return await database.monitoredOperation('users', 'getChannels', async () => {
      const user = await this.findById(userId);
      const channels = user?.channels || [];
      
      userLogger.debug({ 
        userId, 
        channelCount: channels.length 
      }, 'Channels retrieved');
      
      return channels;
    });
  }

  /**
   * Get Channel by ID
   */
  async getChannelById(userId: string, channelId: string): Promise<Channel | null> {
    userLogger.debug({ userId, channelId }, 'Getting channel by ID');
    
    return await database.monitoredOperation('users', 'getChannelById', async () => {
      const user = await this.findById(userId);
      const channel = user?.channels?.find(channel => channel.id === channelId) || null;
      
      userLogger.debug({ 
        userId, 
        channelId, 
        found: !!channel,
        name: channel?.name,
        type: channel?.type
      }, 'Channel by ID completed');
      
      return channel;
    });
  }

  /**
   * Update Channel
   */
  async updateChannel(userId: string, channelId: string, updates: UpdateChannelRequest): Promise<Channel | null> {
    userLogger.info({ 
      userId, 
      channelId, 
      updates: Object.keys(updates) 
    }, 'Updating channel');

    return await database.monitoredOperation('users', 'updateChannel', async () => {
      const user = await this.findById(userId);
      if (!user) {
        userLogger.error({ userId }, 'User not found for channel update');
        return null;
      }

      const channelIndex = user.channels?.findIndex(channel => channel.id === channelId) ?? -1;
      if (channelIndex === -1) {
        userLogger.warn({ userId, channelId }, 'Channel not found for update');
        return null;
      }

      // Validate updates
      if (updates.name !== undefined) {
        // Check for duplicates
        const existingChannel = user.channels?.find(
          channel => channel.id !== channelId && channel.name === updates.name
        );
        if (existingChannel) {
          userLogger.warn({ 
            userId, 
            channelId, 
            duplicateName: updates.name,
            existingChannelId: existingChannel.id
          }, 'Channel name already exists');
          throw new Error(`Channel '${updates.name}' already exists`);
        }
      }

      if (updates.type !== undefined && !CHANNEL_TYPES.includes(updates.type)) {
        userLogger.error({ 
          userId, 
          channelId, 
          invalidType: updates.type 
        }, 'Invalid channel type');
        throw new Error(`Invalid channel type: ${updates.type}`);
      }

      // If setting as default, unset other defaults
      if (updates.isDefault === true) {
        await this.collection.updateOne(
          { id: userId },
          { 
            $set: { 
              'channels.$[elem].isDefault': false,
              updatedAt: new Date()
            } 
          },
          { 
            arrayFilters: [{ 'elem.id': { $ne: channelId } }] 
          }
        );
        
        userLogger.debug({ userId, channelId }, 'Unset other default channels');
      }

      // Build update fields
      const updateFields: any = {};
      if (updates.name !== undefined) updateFields[`channels.${channelIndex}.name`] = updates.name;
      if (updates.type !== undefined) updateFields[`channels.${channelIndex}.type`] = updates.type;
      if (updates.url !== undefined) updateFields[`channels.${channelIndex}.url`] = updates.url;
      if (updates.description !== undefined) updateFields[`channels.${channelIndex}.description`] = updates.description;
      if (updates.isDefault !== undefined) updateFields[`channels.${channelIndex}.isDefault`] = updates.isDefault;
      if (updates.isActive !== undefined) updateFields[`channels.${channelIndex}.isActive`] = updates.isActive;
      if (updates.defaultAmazonTagId !== undefined) updateFields[`channels.${channelIndex}.defaultAmazonTagId`] = updates.defaultAmazonTagId;
      updateFields.updatedAt = new Date();

      const result = await this.collection.findOneAndUpdate(
        { id: userId },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      const updatedChannel = result?.channels?.find(channel => channel.id === channelId) || null;
      
      if (updatedChannel) {
        userLogger.info({ 
          userId, 
          channelId,
          updatedFields: Object.keys(updates),
          name: updatedChannel.name,
          type: updatedChannel.type
        }, 'Channel updated successfully');
      }

      return updatedChannel;
    });
  }

  /**
   * Delete Channel
   */
  async deleteChannel(userId: string, channelId: string): Promise<boolean> {
    userLogger.info({ userId, channelId }, 'Deleting channel');
    
    return await database.monitoredOperation('users', 'deleteChannel', async () => {
      const result = await this.collection.updateOne(
        { id: userId },
        { 
          $pull: { channels: { id: channelId } },
          $set: { updatedAt: new Date() }
        }
      );

      const success = result.modifiedCount > 0;
      
      if (success) {
        userLogger.info({ userId, channelId }, 'Channel deleted successfully');
      } else {
        userLogger.warn({ userId, channelId }, 'Channel deletion found no matching document');
      }

      return success;
    });
  }

  // ===== ✨ NEW v1.8.x: STATISTICS UPDATES WITH LOGGING =====

  /**
   * Update Amazon Tag statistics (called when links are created/used)
   */
  async updateAmazonTagStats(userId: string, tagId: string, stats: { linksCreated?: number; totalClicks?: number; totalRevenue?: number }): Promise<void> {
    userLogger.debug({ 
      userId, 
      tagId, 
      stats 
    }, 'Updating Amazon tag stats');
    
    return await database.monitoredOperation('users', 'updateAmazonTagStats', async () => {
      const updateFields: any = {};
      if (stats.linksCreated !== undefined) updateFields['amazonTags.$.linksCreated'] = stats.linksCreated;
      if (stats.totalClicks !== undefined) updateFields['amazonTags.$.totalClicks'] = stats.totalClicks;
      if (stats.totalRevenue !== undefined) updateFields['amazonTags.$.totalRevenue'] = stats.totalRevenue;
      updateFields['amazonTags.$.lastUsedAt'] = new Date();
      updateFields.updatedAt = new Date();

      await this.collection.updateOne(
        { id: userId, 'amazonTags.id': tagId },
        { $inc: updateFields }
      );
      
      userLogger.debug({ 
        userId, 
        tagId, 
        statsUpdated: Object.keys(stats) 
      }, 'Amazon tag stats updated successfully');
    });
  }

  /**
   * Update Channel statistics (called when links are created/used)
   */
  async updateChannelStats(userId: string, channelId: string, stats: { linksCreated?: number; totalClicks?: number; totalRevenue?: number }): Promise<void> {
    userLogger.debug({ 
      userId, 
      channelId, 
      stats 
    }, 'Updating channel stats');
    
    return await database.monitoredOperation('users', 'updateChannelStats', async () => {
      const updateFields: any = {};
      if (stats.linksCreated !== undefined) updateFields['channels.$.linksCreated'] = stats.linksCreated;
      if (stats.totalClicks !== undefined) updateFields['channels.$.totalClicks'] = stats.totalClicks;
      if (stats.totalRevenue !== undefined) updateFields['channels.$.totalRevenue'] = stats.totalRevenue;
      updateFields['channels.$.lastUsedAt'] = new Date();
      updateFields.updatedAt = new Date();

      await this.collection.updateOne(
        { id: userId, 'channels.id': channelId },
        { $inc: updateFields }
      );
      
      userLogger.debug({ 
        userId, 
        channelId, 
        statsUpdated: Object.keys(stats) 
      }, 'Channel stats updated successfully');
    });
  }

  // ===== ✨ NEW v1.8.x: VALIDATION HELPERS WITH LOGGING =====

  /**
   * Validate Amazon Tag data
   */
  private validateAmazonTagData(data: CreateAmazonTagRequest): void {
    if (!data.tag || !AMAZON_TAG_REGEX.test(data.tag)) {
      userLogger.error({ 
        tag: data.tag,
        regex: AMAZON_TAG_REGEX.toString()
      }, 'Invalid Amazon tag format');
      throw new Error('Invalid Amazon tag format. Must be 3-20 characters, alphanumeric and hyphens only');
    }

    if (!data.marketplace || !AMAZON_MARKETPLACES.includes(data.marketplace as any)) {
      userLogger.error({ 
        marketplace: data.marketplace,
        supportedMarketplaces: AMAZON_MARKETPLACES
      }, 'Invalid marketplace');
      throw new Error(`Invalid marketplace. Supported: ${AMAZON_MARKETPLACES.join(', ')}`);
    }

    if (!data.name || data.name.trim().length === 0) {
      userLogger.error('Tag name is required');
      throw new Error('Tag name is required');
    }

    if (data.name.length > 100) {
      userLogger.error({ nameLength: data.name.length }, 'Tag name too long');
      throw new Error('Tag name must be less than 100 characters');
    }
  }

  /**
   * Validate Channel data
   */
  private validateChannelData(data: CreateChannelRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      userLogger.error('Channel name is required');
      throw new Error('Channel name is required');
    }

    if (data.name.length > 100) {
      userLogger.error({ nameLength: data.name.length }, 'Channel name too long');
      throw new Error('Channel name must be less than 100 characters');
    }

    if (!CHANNEL_TYPES.includes(data.type)) {
      userLogger.error({ 
        type: data.type,
        supportedTypes: CHANNEL_TYPES
      }, 'Invalid channel type');
      throw new Error(`Invalid channel type. Supported: ${CHANNEL_TYPES.join(', ')}`);
    }

    if (data.url && !this.isValidUrl(data.url)) {
      userLogger.error({ url: data.url }, 'Invalid URL format');
      throw new Error('Invalid URL format');
    }

    if (data.description && data.description.length > 500) {
      userLogger.error({ descriptionLength: data.description.length }, 'Description too long');
      throw new Error('Description must be less than 500 characters');
    }
  }

  /**
   * URL validation helper
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ===== 🎨 NEW v1.8.9: USER BRANDING METHODS =====
// Add these methods to your existing UserModel class

/**
 * Update user branding configuration
 */
async updateBranding(userId: string, brandingData: UpdateUserBrandingRequest): Promise<UserBranding | null> {
  userLogger.info({ 
    userId, 
    updates: Object.keys(brandingData) 
  }, 'Updating user branding');

  return await database.monitoredOperation('users', 'updateBranding', async () => {
    // Validate branding data
    this.validateBrandingData(brandingData);

    const user = await this.findById(userId);
    if (!user) {
      userLogger.error({ userId }, 'User not found for branding update');
      return null;
    }

    // Merge with existing branding or create new
    const currentBranding = user.branding || {};
    const updatedBranding: UserBranding = {
      ...currentBranding,
      ...brandingData
    };

    const result = await this.collection.findOneAndUpdate(
      { id: userId },
      { 
        $set: { 
          branding: updatedBranding,
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    if (result) {
      userLogger.info({ 
        userId, 
        updatedFields: Object.keys(brandingData),
        displayName: updatedBranding.displayName,
        themeColor: updatedBranding.themeColor
      }, 'User branding updated successfully');
    }

    return result?.branding || null;
  });
}

/**
 * Get user branding configuration
 */
async getBranding(userId: string): Promise<UserBranding | null> {
  userLogger.debug({ userId }, 'Getting user branding');
  
  return await database.monitoredOperation('users', 'getBranding', async () => {
    const user = await this.findById(userId);
    const branding = user?.branding || null;
    
    userLogger.debug({ 
      userId, 
      hasBranding: !!branding,
      displayName: branding?.displayName
    }, 'User branding retrieved');
    
    return branding;
  });
}

/**
 * Get user branding for preview page (public data only)
 */
async getBrandingForPreview(userId: string): Promise<UserBrandingResponse> {
  userLogger.debug({ userId }, 'Getting user branding for preview');
  
  return await database.monitoredOperation('users', 'getBrandingForPreview', async () => {
    const user = await this.findById(userId);
    const branding = user?.branding || {};
    
    // Return only public branding data (no customCss for security)
    const publicBranding: UserBrandingResponse = {
      displayName: branding.displayName,
      logoUrl: branding.logoUrl,
      themeColor: branding.themeColor || DEFAULT_BRANDING.themeColor,
      backgroundType: branding.backgroundType || DEFAULT_BRANDING.backgroundType,
      backgroundColor: branding.backgroundColor || DEFAULT_BRANDING.backgroundColor,
      backgroundGradient: branding.backgroundGradient,
      backgroundImageUrl: branding.backgroundImageUrl,
      description: branding.description,
      socialLinks: branding.socialLinks,
      showAffiliateBadge: branding.showAffiliateBadge ?? DEFAULT_BRANDING.showAffiliateBadge,
      customAffiliateText: branding.customAffiliateText || DEFAULT_BRANDING.customAffiliateText
    };
    
    userLogger.debug({ 
      userId, 
      displayName: publicBranding.displayName,
      hasLogo: !!publicBranding.logoUrl
    }, 'User branding for preview retrieved');
    
    return publicBranding;
  });
}

/**
 * Get user display name for preview (fallback chain)
 */
async getDisplayNameForPreview(userId: string): Promise<string> {
  const user = await this.findById(userId);
  
  // Fallback chain: branding.displayName -> firstName -> name -> "Afflyt Creator"
  return user?.branding?.displayName || 
         user?.firstName || 
         user?.name || 
         "Afflyt Creator";
}

/**
 * Reset user branding to defaults
 */
async resetBranding(userId: string): Promise<UserBranding> {
  userLogger.info({ userId }, 'Resetting user branding to defaults');
  
  return await database.monitoredOperation('users', 'resetBranding', async () => {
    const defaultBranding: UserBranding = {
      ...DEFAULT_BRANDING,
      showAffiliateBadge: true,
      customAffiliateText: DEFAULT_BRANDING.customAffiliateText
    };

    await this.collection.updateOne(
      { id: userId },
      { 
        $set: { 
          branding: defaultBranding,
          updatedAt: new Date() 
        } 
      }
    );

    userLogger.info({ userId }, 'User branding reset successfully');
    return defaultBranding;
  });
}

// ===== 🎨 BRANDING VALIDATION HELPERS =====

/**
 * Validate branding data
 */
private validateBrandingData(data: UpdateUserBrandingRequest): void {
  // Display name validation
  if (data.displayName !== undefined) {
    if (data.displayName.trim().length === 0) {
      userLogger.error('Display name cannot be empty');
      throw new Error('Display name cannot be empty');
    }
    if (data.displayName.length > BRANDING_LIMITS.displayName.max) {
      userLogger.error({ nameLength: data.displayName.length }, 'Display name too long');
      throw new Error(`Display name must be less than ${BRANDING_LIMITS.displayName.max} characters`);
    }
  }

  // Description validation
  if (data.description !== undefined && data.description.length > BRANDING_LIMITS.description.max) {
    userLogger.error({ descriptionLength: data.description.length }, 'Description too long');
    throw new Error(`Description must be less than ${BRANDING_LIMITS.description.max} characters`);
  }

  // Theme color validation (HEX format)
  if (data.themeColor !== undefined && !this.isValidHexColor(data.themeColor)) {
    userLogger.error({ themeColor: data.themeColor }, 'Invalid theme color format');
    throw new Error('Theme color must be a valid HEX color (e.g., #FF6B35)');
  }

  // Background type validation
  if (data.backgroundType !== undefined && !BACKGROUND_TYPES.includes(data.backgroundType)) {
    userLogger.error({ 
      backgroundType: data.backgroundType,
      supportedTypes: BACKGROUND_TYPES
    }, 'Invalid background type');
    throw new Error(`Invalid background type. Supported: ${BACKGROUND_TYPES.join(', ')}`);
  }

  // Background color validation
  if (data.backgroundColor !== undefined && !this.isValidHexColor(data.backgroundColor)) {
    userLogger.error({ backgroundColor: data.backgroundColor }, 'Invalid background color format');
    throw new Error('Background color must be a valid HEX color');
  }

  // Gradient validation
  if (data.backgroundGradient !== undefined) {
    const { from, to, direction } = data.backgroundGradient;
    if (!this.isValidHexColor(from) || !this.isValidHexColor(to)) {
      userLogger.error({ gradient: data.backgroundGradient }, 'Invalid gradient colors');
      throw new Error('Gradient colors must be valid HEX colors');
    }
    if (direction && !GRADIENT_DIRECTIONS.includes(direction)) {
      userLogger.error({ direction }, 'Invalid gradient direction');
      throw new Error(`Invalid gradient direction. Supported: ${GRADIENT_DIRECTIONS.join(', ')}`);
    }
  }

  // URL validations
  if (data.logoUrl !== undefined && !this.isValidImageUrl(data.logoUrl)) {
    userLogger.error({ logoUrl: data.logoUrl }, 'Invalid logo URL');
    throw new Error('Logo URL must be a valid image URL');
  }

  if (data.backgroundImageUrl !== undefined && !this.isValidImageUrl(data.backgroundImageUrl)) {
    userLogger.error({ backgroundImageUrl: data.backgroundImageUrl }, 'Invalid background image URL');
    throw new Error('Background image URL must be a valid image URL');
  }

  // Social links validation
  if (data.socialLinks !== undefined) {
    Object.entries(data.socialLinks).forEach(([platform, url]) => {
      if (url && !this.isValidUrl(url)) {
        userLogger.error({ platform, url }, 'Invalid social link URL');
        throw new Error(`Invalid ${platform} URL format`);
      }
    });
  }

  // Custom affiliate text validation
  if (data.customAffiliateText !== undefined) {
    if (data.customAffiliateText.length < BRANDING_LIMITS.customAffiliateText.min ||
        data.customAffiliateText.length > BRANDING_LIMITS.customAffiliateText.max) {
      userLogger.error({ textLength: data.customAffiliateText.length }, 'Invalid affiliate text length');
      throw new Error(`Affiliate text must be between ${BRANDING_LIMITS.customAffiliateText.min} and ${BRANDING_LIMITS.customAffiliateText.max} characters`);
    }
  }
}

/**
 * Validate HEX color format
 */
private isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate image URL (basic check for common image extensions)
 */
private isValidImageUrl(url: string): boolean {
  if (!this.isValidUrl(url)) return false;
  return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url) || 
         url.includes('cloudinary.com') || 
         url.includes('imgur.com') ||
         url.includes('gravatar.com');
}

/**
 * Create indexes for branding fields
 */
private async createBrandingIndexes(): Promise<void> {
  try {
    await Promise.all([
      this.collection.createIndex({ 'branding.displayName': 1 }),
      this.collection.createIndex({ 'branding.themeColor': 1 }),
    ]);
    
    userLogger.debug('Branding indexes created successfully');
  } catch (error) {
    userLogger.error({ error }, 'Failed to create branding indexes');
  }
}
}


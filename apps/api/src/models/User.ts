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
  AMAZON_TAG_REGEX
} from '../types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class UserModel {
  private collection: Collection<User>;

  constructor(db: Db) {
    this.collection = db.collection<User>('users');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ email: 1 }, { unique: true });
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ 'apiKeys.id': 1 });
      
      // ✨ NEW v1.8.x: Indexes for multi-entity support
      await this.collection.createIndex({ 'amazonTags.id': 1 });
      await this.collection.createIndex({ 'amazonTags.tag': 1 });
      await this.collection.createIndex({ 'amazonTags.marketplace': 1 });
      await this.collection.createIndex({ 'channels.id': 1 });
      await this.collection.createIndex({ 'channels.type': 1 });
      
      console.log('✅ User indexes created (including v1.8.x multi-entity indexes)');
    } catch (error) {
      console.error('❌ Error creating user indexes:', error);
    }
  }

  async create(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'apiKeys' | 'balance' | 'amazonTags' | 'channels'>): Promise<User> {
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
    return { ...user, _id: result.insertedId };
  }

  // ===== EXISTING METHODS =====

  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id: userId },
      { 
        $pull: { apiKeys: { id: keyId } },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  async findById(id: string): Promise<User | null> {
    return await this.collection.findOne({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.collection.findOne({ email });
  }

  async updateById(id: string, updates: Partial<User>): Promise<User | null> {
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
    return result || null;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async generateApiKey(userId: string, name: string): Promise<ApiKey> {
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

    return apiKey;
  }

  async findByApiKey(apiKeyHash: string): Promise<{ user: User; apiKey: ApiKey } | null> {
    const user = await this.collection.findOne({
      'apiKeys.keyHash': apiKeyHash,
      'apiKeys.isActive': true
    });

    if (!user) return null;

    const apiKey = user.apiKeys.find(key => key.keyHash === apiKeyHash && key.isActive);
    if (!apiKey) return null;

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

    return { user, apiKey };
  }

  // ===== ✨ NEW v1.8.x: AMAZON TAGS MANAGEMENT =====

  /**
   * Create a new Amazon Tag for the user
   * ✅ FIX: Inizializza il campo amazonTags se non esiste (per utenti esistenti)
   */
  async createAmazonTag(userId: string, tagData: CreateAmazonTagRequest): Promise<AmazonTag> {
    // Validation
    this.validateAmazonTagData(tagData);

    // Check if user exists
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // ✅ FIX: Assicurati che il campo amazonTags esista (migrazione automatica per utenti esistenti)
    await this.collection.updateOne(
      { 
        id: userId,
        amazonTags: { $exists: false }
      },
      {
        $set: { amazonTags: [] }
      }
    );

    // Ricarica l'utente con i campi aggiornati
    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new Error('User not found after initialization');
    }

    // Check if tag already exists for this marketplace
    const existingTag = updatedUser.amazonTags?.find(
      tag => tag.tag === tagData.tag && tag.marketplace === tagData.marketplace
    );
    if (existingTag) {
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

    // ✅ FIX: Ora il $push funzionerà perché il campo esiste sicuramente
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

    return amazonTag;
  }

  /**
   * Get all Amazon Tags for a user
   */
  async getAmazonTags(userId: string): Promise<AmazonTag[]> {
    const user = await this.findById(userId);
    return user?.amazonTags || [];
  }

  /**
   * Get Amazon Tag by ID
   */
  async getAmazonTagById(userId: string, tagId: string): Promise<AmazonTag | null> {
    const user = await this.findById(userId);
    return user?.amazonTags?.find(tag => tag.id === tagId) || null;
  }

  /**
   * Update Amazon Tag
   */
  async updateAmazonTag(userId: string, tagId: string, updates: UpdateAmazonTagRequest): Promise<AmazonTag | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const tagIndex = user.amazonTags?.findIndex(tag => tag.id === tagId) ?? -1;
    if (tagIndex === -1) return null;

    // Validate updates
    if (updates.tag !== undefined) {
      if (!AMAZON_TAG_REGEX.test(updates.tag)) {
        throw new Error('Invalid Amazon tag format');
      }

      // Check for duplicates
      const currentTag = user.amazonTags[tagIndex];
      if (currentTag) {
        const existingTag = user.amazonTags?.find(
          tag => tag.id !== tagId && tag.tag === updates.tag && tag.marketplace === currentTag.marketplace
        );
        if (existingTag) {
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

    return result?.amazonTags?.find(tag => tag.id === tagId) || null;
  }

  /**
   * Delete Amazon Tag
   */
  async deleteAmazonTag(userId: string, tagId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id: userId },
      { 
        $pull: { amazonTags: { id: tagId } },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  // ===== ✨ NEW v1.8.x: CHANNELS MANAGEMENT =====

  /**
   * Create a new Channel for the user
   * ✅ FIX: Inizializza il campo channels se non esiste (per utenti esistenti)
   */
  async createChannel(userId: string, channelData: CreateChannelRequest): Promise<Channel> {
    // Validation
    this.validateChannelData(channelData);

    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // ✅ FIX: Assicurati che il campo channels esista (migrazione automatica per utenti esistenti)
    await this.collection.updateOne(
      { 
        id: userId,
        channels: { $exists: false }
      },
      {
        $set: { channels: [] }
      }
    );

    // Ricarica l'utente con i campi aggiornati
    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new Error('User not found after initialization');
    }

    // Check if channel name already exists
    const existingChannel = updatedUser.channels?.find(channel => channel.name === channelData.name);
    if (existingChannel) {
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

    // ✅ FIX: Ora il $push funzionerà perché il campo esiste sicuramente
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

    return channel;
  }

  /**
   * Get all Channels for a user
   */
  async getChannels(userId: string): Promise<Channel[]> {
    const user = await this.findById(userId);
    return user?.channels || [];
  }

  /**
   * Get Channel by ID
   */
  async getChannelById(userId: string, channelId: string): Promise<Channel | null> {
    const user = await this.findById(userId);
    return user?.channels?.find(channel => channel.id === channelId) || null;
  }

  /**
   * Update Channel
   */
  async updateChannel(userId: string, channelId: string, updates: UpdateChannelRequest): Promise<Channel | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const channelIndex = user.channels?.findIndex(channel => channel.id === channelId) ?? -1;
    if (channelIndex === -1) return null;

    // Validate updates
    if (updates.name !== undefined) {
      // Check for duplicates
      const existingChannel = user.channels?.find(
        channel => channel.id !== channelId && channel.name === updates.name
      );
      if (existingChannel) {
        throw new Error(`Channel '${updates.name}' already exists`);
      }
    }

    if (updates.type !== undefined && !CHANNEL_TYPES.includes(updates.type)) {
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

    return result?.channels?.find(channel => channel.id === channelId) || null;
  }

  /**
   * Delete Channel
   */
  async deleteChannel(userId: string, channelId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id: userId },
      { 
        $pull: { channels: { id: channelId } },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  // ===== ✨ NEW v1.8.x: STATISTICS UPDATES =====

  /**
   * Update Amazon Tag statistics (called when links are created/used)
   */
  async updateAmazonTagStats(userId: string, tagId: string, stats: { linksCreated?: number; totalClicks?: number; totalRevenue?: number }): Promise<void> {
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
  }

  /**
   * Update Channel statistics (called when links are created/used)
   */
  async updateChannelStats(userId: string, channelId: string, stats: { linksCreated?: number; totalClicks?: number; totalRevenue?: number }): Promise<void> {
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
  }

  // ===== ✨ NEW v1.8.x: VALIDATION HELPERS =====

  /**
   * Validate Amazon Tag data
   */
  private validateAmazonTagData(data: CreateAmazonTagRequest): void {
    if (!data.tag || !AMAZON_TAG_REGEX.test(data.tag)) {
      throw new Error('Invalid Amazon tag format. Must be 3-20 characters, alphanumeric and hyphens only');
    }

    if (!data.marketplace || !AMAZON_MARKETPLACES.includes(data.marketplace as any)) {
      throw new Error(`Invalid marketplace. Supported: ${AMAZON_MARKETPLACES.join(', ')}`);
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Tag name is required');
    }

    if (data.name.length > 100) {
      throw new Error('Tag name must be less than 100 characters');
    }
  }

  /**
   * Validate Channel data
   */
  private validateChannelData(data: CreateChannelRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Channel name is required');
    }

    if (data.name.length > 100) {
      throw new Error('Channel name must be less than 100 characters');
    }

    if (!CHANNEL_TYPES.includes(data.type)) {
      throw new Error(`Invalid channel type. Supported: ${CHANNEL_TYPES.join(', ')}`);
    }

    if (data.url && !this.isValidUrl(data.url)) {
      throw new Error('Invalid URL format');
    }

    if (data.description && data.description.length > 500) {
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
}
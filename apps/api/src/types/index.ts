import { ObjectId } from 'mongodb';

// Base types
export interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ✨ NEW v1.8.x: Multi-Tags and Multi-Channels Support

/**
 * Amazon Associate Tag configuration
 * Supports multiple Amazon marketplaces and tags per user
 */
export interface AmazonTag {
  id: string; // Unique identifier
  tag: string; // Amazon Associate Tag (es. "afflyt-21")
  marketplace: string; // Amazon marketplace (es. "it", "com", "de", "fr", "es", "co.uk")
  name: string; // User-friendly name (es. "Main IT Tag", "Gaming Products")
  isDefault: boolean; // Default tag for this marketplace
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  // Statistics
  linksCreated: number;
  totalClicks: number;
  totalRevenue: number;
}

/**
 * Channel/Website configuration  
 * Supports multiple channels per user (websites, social media, etc.)
 */
export interface Channel {
  id: string; // Unique identifier
  name: string; // Channel name (es. "My Tech Blog", "Instagram @techreview")
  type: 'website' | 'blog' | 'youtube' | 'instagram' | 'telegram' | 'discord' | 'other';
  url?: string; // Channel URL (if applicable)
  description?: string; // Optional description
  isDefault: boolean; // Default channel for link creation
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  // Statistics
  linksCreated: number;
  totalClicks: number;
  totalRevenue: number;
  // Configuration
  defaultAmazonTagId?: string; // Default Amazon tag for this channel
}

// User types (UPDATED for v1.8.x)
export interface User extends BaseDocument {
  id: string;
  email: string;
  name?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  role: 'affiliate' | 'advertiser' | 'admin';
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  balance: number;
  apiKeys: ApiKey[];
  
  // ⚠️ DEPRECATED (kept for backward compatibility)
  // These fields will be migrated to amazonTags and channels arrays
  amazonAssociateTag?: string;
  websiteUrl?: string;
  companyName?: string;
  
  // ✨ NEW v1.8.x: Multi-entity support
  amazonTags: AmazonTag[]; // Array of Amazon Associate Tags
  channels: Channel[]; // Array of channels/websites
  
  // Default preferences
  defaultAmazonTagId?: string; // ID of default Amazon tag
  defaultChannelId?: string; // ID of default channel
}

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}

// Affiliate Link types (UPDATED for v1.8.x)
export interface AffiliateLink extends BaseDocument {
  hash: string;
  userId: string;
  originalUrl: string;
  tag?: string; // ⚠️ DEPRECATED - use amazonTagId instead
  campaignId?: ObjectId;
  isActive: boolean;
  clickCount: number;
  uniqueClickCount: number;
  conversionCount: number;
  totalRevenue: number;
  // Existing v1.3.0 fields
  source?: string;
  expiresAt?: Date;
  
  // ✨ NEW v1.8.x: Multi-entity references
  amazonTagId?: string; // Reference to AmazonTag.id
  channelId?: string; // Reference to Channel.id
  marketplace?: string; // Amazon marketplace (derived from AmazonTag)
}

// Click types
export interface Click extends BaseDocument {
  linkHash: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  referer?: string;
  country?: string;
  device?: string;
  browser?: string;
  isUnique: boolean;
  sessionId?: string;
  trackingId?: string;
}

// Existing types for v1.3.0
export interface UserSetting extends BaseDocument {
  userId: string;
  dashboardLayout: DashboardLayoutItem[];
}

export interface DashboardLayoutItem {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface Conversion extends BaseDocument {
  linkId: ObjectId;
  userId: string;
  trackingId: string;
  payoutAmount: number;
  advertiserRevenue?: number;
  status: 'pending' | 'approved' | 'rejected';
  conversionTimestamp: Date;
  ipAddress?: string;
  orderId?: string;
  notes?: string;
}

// ✨ NEW v1.8.x: Request/Response types for Multi-Tags and Multi-Channels

/**
 * Request body for creating Amazon Tag
 */
export interface CreateAmazonTagRequest {
  tag: string;
  marketplace: string;
  name: string;
  isDefault?: boolean;
}

/**
 * Request body for updating Amazon Tag
 */
export interface UpdateAmazonTagRequest {
  tag?: string;
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

/**
 * Request body for creating Channel
 */
export interface CreateChannelRequest {
  name: string;
  type: Channel['type'];
  url?: string;
  description?: string;
  isDefault?: boolean;
  defaultAmazonTagId?: string;
}

/**
 * Request body for updating Channel
 */
export interface UpdateChannelRequest {
  name?: string;
  type?: Channel['type'];
  url?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  defaultAmazonTagId?: string;
}

/**
 * Response for Amazon Tag operations
 */
export interface AmazonTagResponse {
  id: string;
  tag: string;
  marketplace: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  linksCreated: number;
  totalClicks: number;
  totalRevenue: number;
}

/**
 * Response for Channel operations
 */
export interface ChannelResponse {
  id: string;
  name: string;
  type: Channel['type'];
  url?: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  linksCreated: number;
  totalClicks: number;
  totalRevenue: number;
  defaultAmazonTagId?: string;
}

// API Response types (existing)
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request types (existing)
export interface AuthenticatedRequest extends Request {
  user?: User;
  apiKey?: ApiKey;
}

// Analytics types per dashboard (existing)
export interface AnalyticsSummary {
  totalLinks: number;
  totalClicks: number;
  uniqueClicks: number;
  totalConversions: number;
  pendingConversions: number;
  rejectedConversions: number;
  totalRevenue: number;
  conversionRate: number;
  earningsPerClick: number;
  dataPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

export interface TrendDataPoint {
  date: string;
  clicks?: number;
  uniqueClicks?: number;
  revenue?: number;
  conversions?: number;
}

export interface DistributionDataPoint {
  label: string;
  value: number;
  percentage?: number;
}

// ✨ NEW v1.8.x: Validation constants

/**
 * Supported Amazon marketplaces
 */
export const AMAZON_MARKETPLACES = [
  'com', // amazon.com (US)
  'it',  // amazon.it (Italy)  
  'de',  // amazon.de (Germany)
  'fr',  // amazon.fr (France)
  'es',  // amazon.es (Spain)
  'co.uk', // amazon.co.uk (UK)
  'ca',  // amazon.ca (Canada)
  'com.au', // amazon.com.au (Australia)
  'co.jp', // amazon.co.jp (Japan)
] as const;

export type AmazonMarketplace = typeof AMAZON_MARKETPLACES[number];

/**
 * Supported channel types
 */
export const CHANNEL_TYPES = [
  'website',
  'blog', 
  'youtube',
  'instagram',
  'telegram',
  'discord',
  'other'
] as const;

export type ChannelType = typeof CHANNEL_TYPES[number];

/**
 * Amazon Associate Tag validation regex
 * Format: alphanumeric, hyphens allowed, 3-20 characters
 */
export const AMAZON_TAG_REGEX = /^[a-zA-Z0-9\-]{3,20}$/;
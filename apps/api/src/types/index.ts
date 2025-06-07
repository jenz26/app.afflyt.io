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


// ===== SUPPORT TICKET TYPES =====

/**
 * Support ticket subject categories
 */
export const SUPPORT_SUBJECTS = [
  'technical',
  'billing', 
  'feature',
  'account',
  'general'
] as const;

export type SupportSubject = typeof SUPPORT_SUBJECTS[number];

/**
 * Support ticket interface
 */
export interface SupportTicket extends BaseDocument {
  id: string;
  ticketNumber: string; // Auto-generated unique identifier (e.g., "SUP-2025-001234")
  userId?: string; // Optional - for logged-in users
  name: string;
  email: string;
  subject: SupportSubject;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string; // Admin user ID who handles the ticket
  
  // Metadata for debugging and context
  userAgent?: string;
  url?: string; // Page where the ticket was submitted
  ipAddress?: string; // Server will capture this
  
  // Timestamps
  submittedAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  
  // Internal notes (not visible to user)
  internalNotes?: string;
  
  // Statistics
  responseCount: number; // Number of responses from support team
}

/**
 * Request body for creating support ticket (from frontend)
 */
export interface CreateSupportTicketRequest {
  name: string;
  email: string;
  subject: SupportSubject;
  message: string;
  userId?: string; // Optional - if user is logged in
  timestamp: string; // ISO date string from frontend
  userAgent?: string;
  url?: string;
}

/**
 * Response for support ticket operations
 */
export interface SupportTicketResponse {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  subject: SupportSubject;
  message: string;
  status: SupportTicket['status'];
  priority: SupportTicket['priority'];
  submittedAt: string;
  userId?: string;
}

// ===== 🎨 NEW v1.8.9: USER BRANDING SUPPORT =====

/**
 * User branding configuration for custom preview pages
 * This transforms compliance requirement into a powerful branding feature
 */
export interface UserBranding {
  displayName?: string; // Custom name for preview pages (e.g., "TechReviews by Marco")
  logoUrl?: string; // URL to user's logo/avatar
  themeColor?: string; // Primary color for preview page (#HEX format)
  backgroundType?: 'solid' | 'gradient' | 'image'; // Background style
  backgroundColor?: string; // Background color for solid type
  backgroundGradient?: { 
    from: string; 
    to: string; 
    direction?: 'to-r' | 'to-br' | 'to-b' | 'to-bl'; 
  }; // Gradient colors
  backgroundImageUrl?: string; // Background image URL
  description?: string; // Short description/tagline for preview pages
  socialLinks?: {
    website?: string;
    instagram?: string;
    youtube?: string;
    telegram?: string;
    discord?: string;
  };
  // Advanced customization
  customCss?: string; // Custom CSS for advanced users
  showAffiliateBadge?: boolean; // Show "Amazon Associate" badge
  customAffiliateText?: string; // Custom affiliate disclosure text
}

// User interface updated with branding
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
  amazonAssociateTag?: string;
  websiteUrl?: string;
  companyName?: string;
  
  // ✨ v1.8.x: Multi-entity support
  amazonTags: AmazonTag[];
  channels: Channel[];
  
  // Default preferences
  defaultAmazonTagId?: string;
  defaultChannelId?: string;
  
  // 🎨 NEW v1.8.9: Branding configuration
  branding?: UserBranding;
}

// ===== REQUEST/RESPONSE TYPES FOR BRANDING =====

/**
 * Request body for updating user branding
 */
export interface UpdateUserBrandingRequest {
  displayName?: string;
  logoUrl?: string;
  themeColor?: string;
  backgroundType?: UserBranding['backgroundType'];
  backgroundColor?: string;
  backgroundGradient?: UserBranding['backgroundGradient'];
  backgroundImageUrl?: string;
  description?: string;
  socialLinks?: UserBranding['socialLinks'];
  showAffiliateBadge?: boolean;
  customAffiliateText?: string;
  // Note: customCss not included in public API for security
}

/**
 * Response for user branding operations
 */
export interface UserBrandingResponse {
  displayName?: string;
  logoUrl?: string;
  themeColor?: string;
  backgroundType?: UserBranding['backgroundType'];
  backgroundColor?: string;
  backgroundGradient?: UserBranding['backgroundGradient'];
  backgroundImageUrl?: string;
  description?: string;
  socialLinks?: UserBranding['socialLinks'];
  showAffiliateBadge?: boolean;
  customAffiliateText?: string;
}

/**
 * Enhanced response for preview page endpoint
 * Contains link data + user branding for single API call
 */
export interface LinkPreviewResponse {
  // Link data
  link: {
    hash: string;
    originalUrl: string;
    tag?: string;
    amazonTagId?: string;
    channelId?: string;
    source?: string;
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
  };
  // User branding data
  branding: UserBrandingResponse;
  // Owner information (minimal for privacy)
  owner: {
    displayName?: string; // Falls back to firstName, name, or "Afflyt Creator"
  };
}

// ===== VALIDATION CONSTANTS =====

/**
 * Supported background types for branding
 */
export const BACKGROUND_TYPES = ['solid', 'gradient', 'image'] as const;

/**
 * Supported gradient directions
 */
export const GRADIENT_DIRECTIONS = ['to-r', 'to-br', 'to-b', 'to-bl'] as const;

/**
 * Validation limits for branding fields
 */
export const BRANDING_LIMITS = {
  displayName: { min: 1, max: 50 },
  description: { min: 1, max: 200 },
  customAffiliateText: { min: 10, max: 300 },
  logoUrl: { max: 500 },
  backgroundImageUrl: { max: 500 },
  socialUrls: { max: 500 }
} as const;

/**
 * Default branding values
 */
export const DEFAULT_BRANDING: Partial<UserBranding> = {
  showAffiliateBadge: true,
  customAffiliateText: "In qualità di Affiliato Amazon, ricevo un guadagno dagli acquisti idonei.",
  themeColor: "#FF6B35", // Afflyt brand color
  backgroundType: "solid",
  backgroundColor: "#ffffff"
} as const;
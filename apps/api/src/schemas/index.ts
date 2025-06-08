import { z } from 'zod';
import { AMAZON_MARKETPLACES, CHANNEL_TYPES } from '../types';

// ===== 🔒 VALIDATION SCHEMAS v1.9.2 - COMPLETE EDITION =====
// Centralized validation schemas using Zod for type-safe input validation
// 100% endpoint coverage - Zero manual validation

// ===== BASE SCHEMAS =====

/**
 * Common string validations
 */
export const trimmedString = z.string().trim();
export const nonEmptyString = z.string().trim().min(1, 'This field is required');
export const emailSchema = z.string().email('Invalid email format');
export const urlSchema = z.string().url('Invalid URL format').optional();

/**
 * MongoDB ObjectId validation
 */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

/**
 * Amazon Associate Tag validation
 * Format: alphanumeric + hyphens, 3-20 characters
 */
export const amazonTagSchema = z.string()
  .regex(/^[a-zA-Z0-9\-]{3,20}$/, 'Amazon tag must be 3-20 characters, alphanumeric and hyphens only');

/**
 * Amazon Marketplace validation
 */
export const amazonMarketplaceSchema = z.enum(['com', 'it', 'de', 'fr', 'es', 'co.uk', 'ca', 'com.au', 'co.jp'], {
  errorMap: () => ({ message: `Marketplace must be one of: ${AMAZON_MARKETPLACES.join(', ')}` })
});

/**
 * Channel Type validation
 */
export const channelTypeSchema = z.enum(['website', 'blog', 'youtube', 'instagram', 'telegram', 'discord', 'other'], {
  errorMap: () => ({ message: `Channel type must be one of: ${CHANNEL_TYPES.join(', ')}` })
});

// ===== AUTH SCHEMAS =====

/**
 * User registration schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  name: nonEmptyString.max(100, 'Name must be less than 100 characters').optional(),
  firstName: trimmedString.max(50, 'First name must be less than 50 characters').optional(),
  lastName: trimmedString.max(50, 'Last name must be less than 50 characters').optional()
});

/**
 * User login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: nonEmptyString.max(128, 'Password must be less than 128 characters')
});

/**
 * Send magic link schema
 */
export const sendMagicLinkSchema = z.object({
  email: emailSchema,
  locale: z.enum(['it', 'en', 'es', 'fr', 'de']).default('it'),
  returnUrl: z.string().url('Invalid return URL format').optional()
});

/**
 * Verify magic link schema  
 */
export const verifyMagicLinkSchema = z.object({
  token: nonEmptyString.max(500, 'Token is too long')
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  token: nonEmptyString,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

// ===== USER PROFILE SCHEMAS =====

/**
 * Update user profile schema
 */
export const updateProfileSchema = z.object({
  name: trimmedString.max(100, 'Name must be less than 100 characters').optional(),
  firstName: trimmedString.max(50, 'First name must be less than 50 characters').optional(),
  lastName: trimmedString.max(50, 'Last name must be less than 50 characters').optional(),
  // Backward compatibility fields
  amazonAssociateTag: amazonTagSchema.optional(),
  websiteUrl: urlSchema,
  companyName: trimmedString.max(200, 'Company name must be less than 200 characters').optional(),
  // New v1.8.x fields
  defaultAmazonTagId: trimmedString.optional(),
  defaultChannelId: trimmedString.optional()
}).refine(data => {
  // At least one field must be provided
  return Object.values(data).some(value => value !== undefined && value !== '');
}, {
  message: 'At least one field must be provided for update'
});

// ===== API KEY SCHEMAS =====

/**
 * Create API key schema
 */
export const createApiKeySchema = z.object({
  name: nonEmptyString
    .max(100, 'API key name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'API key name can only contain letters, numbers, spaces, hyphens, and underscores')
});

/**
 * Update API key schema
 */
export const updateApiKeySchema = z.object({
  name: trimmedString
    .max(100, 'API key name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'API key name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  isActive: z.boolean().optional()
}).refine(data => {
  // At least one field must be provided
  return data.name !== undefined || data.isActive !== undefined;
}, {
  message: 'At least one field (name or isActive) must be provided'
});

// ===== AMAZON TAG SCHEMAS =====

/**
 * Create Amazon tag schema
 */
export const createAmazonTagSchema = z.object({
  tag: amazonTagSchema,
  marketplace: amazonMarketplaceSchema,
  name: nonEmptyString
    .max(100, 'Tag name must be less than 100 characters'),
  isDefault: z.boolean().default(false)
});

/**
 * Update Amazon tag schema
 */
export const updateAmazonTagSchema = z.object({
  tag: amazonTagSchema.optional(),
  name: trimmedString
    .max(100, 'Tag name must be less than 100 characters')
    .optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional()
}).refine(data => {
  // At least one field must be provided
  return Object.values(data).some(value => value !== undefined);
}, {
  message: 'At least one field must be provided for update'
});

// ===== CHANNEL SCHEMAS =====

/**
 * Create channel schema
 */
export const createChannelSchema = z.object({
  name: nonEmptyString
    .max(100, 'Channel name must be less than 100 characters'),
  type: channelTypeSchema,
  url: urlSchema,
  description: trimmedString
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isDefault: z.boolean().default(false),
  defaultAmazonTagId: trimmedString.optional()
});

/**
 * Update channel schema
 */
export const updateChannelSchema = z.object({
  name: trimmedString
    .max(100, 'Channel name must be less than 100 characters')
    .optional(),
  type: channelTypeSchema.optional(),
  url: urlSchema,
  description: trimmedString
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  defaultAmazonTagId: trimmedString.optional()
}).refine(data => {
  // At least one field must be provided
  return Object.values(data).some(value => value !== undefined && value !== '');
}, {
  message: 'At least one field must be provided for update'
});

// ===== AFFILIATE LINK SCHEMAS =====

/**
 * Create affiliate link schema
 */
export const createAffiliateLinkSchema = z.object({
  originalUrl: z.string()
    .url('Invalid URL format')
    .refine(url => {
      // Additional validation for Amazon URLs
      const domain = new URL(url).hostname.toLowerCase();
      return domain.includes('amazon.') || domain.includes('amzn.to');
    }, 'URL must be an Amazon product link'),
  // Backward compatibility
  tag: amazonTagSchema.optional(),
  // New v1.8.x fields
  amazonTagId: trimmedString.optional(),
  channelId: trimmedString.optional(),
  source: trimmedString.max(100, 'Source must be less than 100 characters').optional(),
  expiresAt: z.string().datetime().optional().or(z.date().optional())
}).refine(data => {
  // Either tag (legacy) or amazonTagId (new) should be provided
  return data.tag || data.amazonTagId;
}, {
  message: 'Either tag or amazonTagId must be provided'
});

/**
 * Update affiliate link schema
 */
export const updateAffiliateLinkSchema = z.object({
  isActive: z.boolean().optional(),
  source: trimmedString.max(100, 'Source must be less than 100 characters').optional(),
  expiresAt: z.string().datetime().optional().or(z.date().optional()),
  amazonTagId: trimmedString.optional(),
  channelId: trimmedString.optional()
}).refine(data => {
  // At least one field must be provided
  return Object.values(data).some(value => value !== undefined);
}, {
  message: 'At least one field must be provided for update'
});

// ===== ANALYTICS SCHEMAS =====

/**
 * Date range validation for analytics
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  groupBy: z.enum(['day', 'week', 'month']).default('day')
}).refine(data => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date'
});

/**
 * Analytics query parameters
 */
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['24h', '7d', '30d', '90d', '12m']).default('7d'),
  granularity: z.enum(['hourly', 'daily', 'weekly', 'monthly']).default('daily'),
  linkId: trimmedString.optional(),
  subId: trimmedString.optional(),
  groupBy: z.enum(['day', 'week', 'month', 'country', 'device']).default('day')
});

/**
 * Top performing links query
 */
export const topLinksQuerySchema = z.object({
  sortBy: z.enum(['revenue', 'clicks', 'conversions', 'conversionRate', 'earningsPerClick']).default('revenue'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

/**
 * Heatmap query schema
 */
export const heatmapQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('7d'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// ===== DASHBOARD SCHEMAS =====

/**
 * Dashboard layout item schema
 */
export const dashboardLayoutItemSchema = z.object({
  i: nonEmptyString,
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
  minW: z.number().int().min(1).optional(),
  minH: z.number().int().min(1).optional(),
  maxW: z.number().int().min(1).optional(),
  maxH: z.number().int().min(1).optional(),
  static: z.boolean().optional()
});

/**
 * Update dashboard layout schema
 */
export const updateDashboardLayoutSchema = z.object({
  layout: z.array(dashboardLayoutItemSchema)
    .min(1, 'Layout must contain at least one item')
    .max(20, 'Layout cannot contain more than 20 items')
});

// ===== CONVERSION SCHEMAS =====

/**
 * Track conversion schema
 */
export const trackConversionSchema = z.object({
  trackingId: nonEmptyString,
  orderId: trimmedString.max(100, 'Order ID must be less than 100 characters').optional(),
  payoutAmount: z.number().positive('Payout amount must be positive'),
  advertiserRevenue: z.number().positive('Advertiser revenue must be positive').optional(),
  notes: trimmedString.max(1000, 'Notes must be less than 1000 characters').optional()
});

/**
 * Update conversion status schema
 */
export const updateConversionSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be pending, approved, or rejected' })
  }),
  notes: trimmedString.max(1000, 'Notes must be less than 1000 characters').optional()
});

/**
 * User conversions query schema
 */
export const userConversionsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  sortBy: z.enum(['conversionTimestamp', 'payoutAmount', 'status']).default('conversionTimestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

// ===== LINK SCHEMAS =====

/**
 * Get links query schema
 */
export const getLinksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'clickCount', 'totalRevenue', 'conversionRate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isActive: z.coerce.boolean().optional(),
  tag: trimmedString.optional()
});

/**
 * Link stats query schema (for recent/top performing)
 */
export const linkStatsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(['revenue', 'clicks', 'conversions', 'conversionRate']).optional(),
  period: z.enum(['24h', '7d', '30d', '90d']).optional()
});

// ===== PARAMETER VALIDATION SCHEMAS =====

/**
 * URL parameter validation for IDs
 */
export const paramIdSchema = z.object({
  id: nonEmptyString
});

export const paramKeyIdSchema = z.object({
  keyId: nonEmptyString
});

export const paramTagIdSchema = z.object({
  tagId: nonEmptyString
});

export const paramChannelIdSchema = z.object({
  channelId: nonEmptyString
});

export const paramHashSchema = z.object({
  hash: nonEmptyString
});

export const paramConversionIdSchema = z.object({
  conversionId: nonEmptyString.regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversion ID format')
});

// ===== QUERY PARAMETER SCHEMAS =====

/**
 * Common query parameters for lists
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'name', 'clicks', 'revenue']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: trimmedString.optional(),
  isActive: z.coerce.boolean().optional()
});

// ===== 🎨 NEW v1.8.9: BRANDING VALIDATION SCHEMAS =====

/**
 * Branding validation constants
 */
export const BACKGROUND_TYPES = ['solid', 'gradient', 'image'] as const;
export const GRADIENT_DIRECTIONS = ['to-r', 'to-br', 'to-b', 'to-bl'] as const;

export const BRANDING_LIMITS = {
  displayName: { min: 1, max: 50 },
  description: { min: 1, max: 200 },
  customAffiliateText: { min: 10, max: 300 },
  logoUrl: { max: 500 },
  backgroundImageUrl: { max: 500 },
  socialUrls: { max: 500 }
} as const;

/**
 * HEX color validation
 */
const hexColorSchema = z.string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid HEX color (e.g., #FF6B35)')
  .optional();

/**
 * URL validation with image extension check
 */
const imageUrlSchema = z.string()
  .url('Must be a valid URL')
  .refine(
    (url) => {
      return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url) || 
             url.includes('cloudinary.com') || 
             url.includes('imgur.com') ||
             url.includes('gravatar.com');
    },
    'Must be a valid image URL (jpg, png, gif, svg, webp) or from supported CDN'
  )
  .optional();

/**
 * Social links schema
 */
const socialLinksSchema = z.object({
  website: z.string().url().optional(),
  instagram: z.string().url().optional(),
  youtube: z.string().url().optional(),
  telegram: z.string().url().optional(),
  discord: z.string().url().optional(),
}).optional();

/**
 * Background gradient schema
 */
const backgroundGradientSchema = z.object({
  from: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'From color must be valid HEX'),
  to: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'To color must be valid HEX'),
  direction: z.enum(GRADIENT_DIRECTIONS).optional()
}).optional();

/**
 * Update user branding request schema
 */
export const updateUserBrandingSchema = z.object({
  displayName: z.string()
    .min(BRANDING_LIMITS.displayName.min, `Display name must be at least ${BRANDING_LIMITS.displayName.min} character`)
    .max(BRANDING_LIMITS.displayName.max, `Display name must be less than ${BRANDING_LIMITS.displayName.max} characters`)
    .trim()
    .optional(),
    
  logoUrl: imageUrlSchema,
  
  themeColor: hexColorSchema,
  
  backgroundType: z.enum(BACKGROUND_TYPES).optional(),
  
  backgroundColor: hexColorSchema,
  
  backgroundGradient: backgroundGradientSchema,
  
  backgroundImageUrl: imageUrlSchema,
  
  description: z.string()
    .max(BRANDING_LIMITS.description.max, `Description must be less than ${BRANDING_LIMITS.description.max} characters`)
    .trim()
    .optional(),
    
  socialLinks: socialLinksSchema,
  
  showAffiliateBadge: z.boolean().optional(),
  
  customAffiliateText: z.string()
    .min(BRANDING_LIMITS.customAffiliateText.min, `Affiliate text must be at least ${BRANDING_LIMITS.customAffiliateText.min} characters`)
    .max(BRANDING_LIMITS.customAffiliateText.max, `Affiliate text must be less than ${BRANDING_LIMITS.customAffiliateText.max} characters`)
    .trim()
    .optional()
});

/**
 * Reset branding request schema (empty body)
 */
export const resetUserBrandingSchema = z.object({});

/**
 * Get branding query schema (no parameters needed)
 */
export const getUserBrandingSchema = z.object({});

// ===== 🎯 NEW v1.8.9: CLICK TRACKING SCHEMAS =====

/**
 * Click tracking metadata schema
 */
const clickMetadataSchema = z.object({
  referer: z.string().url().optional(),
  country: z.string().max(10).optional(),
  device: z.enum(['mobile', 'tablet', 'desktop', 'unknown']).optional(),
  browser: z.string().max(50).optional(),
  sessionId: z.string().max(100).optional(),
  timestamp: z.string().datetime().optional(),
  // NEW v1.9.2: Security check metadata
  securityCheckShown: z.boolean().optional(),
  securityCheckDuration: z.number().optional(),
  userAgent: z.string().optional(),
}).optional();

/**
 * Track click request schema
 * Used by preview pages to record click events
 */
export const trackClickSchema = z.object({
  hash: nonEmptyString.regex(/^[a-zA-Z0-9]{6,12}$/, 'Invalid link hash format'),
  metadata: clickMetadataSchema
});

// ===== 🎯 NEW v1.9.2: PIXEL TRACKING SCHEMA =====
export const pixelTrackSchema = z.object({
  hash: z.string()
    .min(1, 'Hash is required')
    .max(50, 'Hash too long'),
  t: z.string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), 'Invalid timestamp'),
  ref: z.string()
    .optional()
    .refine((val) => !val || val.length <= 500, 'Referer too long'),
  ua: z.string()
    .optional()
    .refine((val) => !val || val.length <= 500, 'User agent too long'),
  // Cache busting e metadata opzionali
  cb: z.string().optional(), // cache buster
  sid: z.string().optional(), // session id
  v: z.string().optional(), // version tracking
});

// ===== SUPPORT SCHEMAS =====

/**
 * Support subject validation
 */
export const supportSubjectSchema = z.enum(['technical', 'billing', 'feature', 'account', 'general'], {
  errorMap: () => ({ message: 'Subject must be one of: technical, billing, feature, account, general' })
});

/**
 * Create support ticket schema
 * Validates incoming request from frontend contact form
 */
export const supportTicketSchema = z.object({
  name: nonEmptyString
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and dots'),
  
  email: emailSchema,
  
  subject: supportSubjectSchema,
  
  message: nonEmptyString
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),
  
  userId: trimmedString.optional(), // Optional - only if user is logged in
  
  timestamp: z.string().datetime('Invalid timestamp format'),
  
  userAgent: trimmedString
    .max(500, 'User agent must be less than 500 characters')
    .optional(),
  
  url: z.string()
    .url('Invalid URL format')
    .max(2000, 'URL must be less than 2000 characters')
    .optional()
});

/**
 * Update support ticket schema (for admin panel - future use)
 */
export const updateSupportTicketSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: trimmedString.optional(),
  internalNotes: trimmedString
    .max(2000, 'Internal notes must be less than 2000 characters')
    .optional()
}).refine(data => {
  // At least one field must be provided
  return Object.values(data).some(value => value !== undefined && value !== '');
}, {
  message: 'At least one field must be provided for update'
});

/**
 * Support tickets query schema (for admin panel - future use)
 */
export const supportTicketsQuerySchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: trimmedString.optional(),
  subject: supportSubjectSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['submittedAt', 'status', 'priority', 'ticketNumber']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: trimmedString.optional() // Search in name, email, or ticket number
});

// ===== EXPORT ALL SCHEMAS =====

export const validationSchemas = {
  // ===== AUTH =====
  register: registerSchema,
  login: loginSchema,
  sendMagicLink: sendMagicLinkSchema,
  verifyMagicLink: verifyMagicLinkSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema,
  
  // ===== USER PROFILE =====
  updateProfile: updateProfileSchema,
  
  // 🎨 NEW v1.8.9: USER BRANDING =====
  updateUserBranding: updateUserBrandingSchema,
  resetUserBranding: resetUserBrandingSchema,
  getUserBranding: getUserBrandingSchema,
  
  // 🎯 NEW v1.8.9 + v1.9.2: CLICK TRACKING =====
  trackClick: trackClickSchema,
  
  // 🎯 NEW v1.9.2: PIXEL TRACKING =====
  pixelTrack: pixelTrackSchema,
  
  // ===== API KEYS =====
  createApiKey: createApiKeySchema,
  updateApiKey: updateApiKeySchema,
  
  // ===== AMAZON TAGS =====
  createAmazonTag: createAmazonTagSchema,
  updateAmazonTag: updateAmazonTagSchema,
  
  // ===== CHANNELS =====
  createChannel: createChannelSchema,
  updateChannel: updateChannelSchema,
  
  // ===== AFFILIATE LINKS =====
  createAffiliateLink: createAffiliateLinkSchema,
  updateAffiliateLink: updateAffiliateLinkSchema,
  getLinks: getLinksQuerySchema,
  linkStats: linkStatsQuerySchema,
  
  // ===== ANALYTICS =====
  dateRange: dateRangeSchema,
  analyticsQuery: analyticsQuerySchema,
  topLinksQuery: topLinksQuerySchema,
  heatmapQuery: heatmapQuerySchema,
  
  // ===== DASHBOARD =====
  updateDashboardLayout: updateDashboardLayoutSchema,
  
  // ===== CONVERSIONS =====
  trackConversion: trackConversionSchema,
  updateConversion: updateConversionSchema,
  userConversionsQuery: userConversionsQuerySchema,
  
  // ===== PARAMETERS =====
  paramId: paramIdSchema,
  paramKeyId: paramKeyIdSchema,
  paramTagId: paramTagIdSchema,
  paramChannelId: paramChannelIdSchema,
  paramHash: paramHashSchema,
  paramConversionId: paramConversionIdSchema,
  
  // ===== QUERY PARAMETERS =====
  listQuery: listQuerySchema
};

export default validationSchemas;
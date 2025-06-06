import { z } from 'zod';
import { AMAZON_MARKETPLACES, CHANNEL_TYPES } from '../types';

// ===== 🔒 VALIDATION SCHEMAS v1.8.5 =====
// Centralized validation schemas using Zod for type-safe input validation

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

// ===== EXPORT ALL SCHEMAS =====

export const validationSchemas = {
  // Auth
  register: registerSchema,
  login: loginSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema,
  
  // User Profile
  updateProfile: updateProfileSchema,
  
  // API Keys
  createApiKey: createApiKeySchema,
  updateApiKey: updateApiKeySchema,
  
  // Amazon Tags
  createAmazonTag: createAmazonTagSchema,
  updateAmazonTag: updateAmazonTagSchema,
  
  // Channels
  createChannel: createChannelSchema,
  updateChannel: updateChannelSchema,
  
  // Affiliate Links
  createAffiliateLink: createAffiliateLinkSchema,
  updateAffiliateLink: updateAffiliateLinkSchema,
  
  // Analytics
  dateRange: dateRangeSchema,
  
  // Dashboard
  updateDashboardLayout: updateDashboardLayoutSchema,
  
  // Conversions
  trackConversion: trackConversionSchema,
  
  // Parameters
  paramId: paramIdSchema,
  paramKeyId: paramKeyIdSchema,
  paramTagId: paramTagIdSchema,
  paramChannelId: paramChannelIdSchema,
  paramHash: paramHashSchema,
  
  // Query parameters
  listQuery: listQuerySchema
};

export default validationSchemas;
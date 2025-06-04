import { ObjectId } from 'mongodb';

// Base types
export interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface User extends BaseDocument {
  id: string;
  email: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  role: 'affiliate' | 'advertiser' | 'admin';
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  balance: number;
  apiKeys: ApiKey[];
}

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}

// Affiliate Link types
export interface AffiliateLink extends BaseDocument {
  hash: string;
  userId: string;
  originalUrl: string;
  tag?: string;
  campaignId?: ObjectId;
  isActive: boolean;
  clickCount: number;
  uniqueClickCount: number;
  conversionCount: number;
  totalRevenue: number;
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
}

// API Response types
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

// Request types
export interface AuthenticatedRequest extends Request {
  user?: User;
  apiKey?: ApiKey;
}
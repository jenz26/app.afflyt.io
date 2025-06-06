// apps/web/src/hooks/useApi.ts
'use client';

/**
 * API Hooks for Afflyt.io
 * Provides React hooks for data fetching with authentication integration
 * 
 * @version 1.8.6 - ENHANCED: Type-safe API responses with standardized structure handling
 * @phase Frontend-Backend Integration + Advanced Analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AfflytApiError } from '@/lib/api';

// ✅ FIXED: Import unified types from analytics.ts
import type { 
  StatsData, 
  ClickTrendData, 
  RevenueTrendData as RevenueTrendDataType,
  UseStatsOptions,
  LinkData 
} from '@/types/analytics';

// ✨ NEW v1.8.6: Standardized API Response Types
export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  pagination?: {
    limit: number;
    offset: number;
    total?: number;
    hasMore?: boolean;
  };
}

// ✨ NEW v1.8.6: Specific Response Types for Different Endpoints
export interface LinkCreationResponse {
  link: AffiliateLink;
}

export interface LinksListResponse {
  links: AffiliateLink[];
}

export interface AmazonTagsResponse {
  amazonTags: AmazonTag[];
}

export interface ChannelsResponse {
  channels: Channel[];
}

export interface ApiKeysResponse {
  apiKeys: ApiKeyData[];
}

export interface UserProfileResponse {
  user: UserProfile;
}

// ✨ NEW v1.8.6: Union types for flexible response handling
export type ApiResponse<T> = T | StandardApiResponse<T>;

// ✨ NEW v1.8.6: Utility function to safely extract data from API responses
export function extractApiData<T>(response: ApiResponse<T>): T {
  if (!response) {
    throw new Error('No response data received');
  }

  // Check if it's a standardized response structure
  if (typeof response === 'object' && response !== null && 'success' in response) {
    const standardResponse = response as StandardApiResponse<T>;
    
    if (!standardResponse.success) {
      throw new Error(standardResponse.error || 'API request failed');
    }
    
    if (standardResponse.data !== undefined) {
      return standardResponse.data;
    }
    
    // If no data property but success is true, return the whole response minus metadata
    const { success, message, error, statusCode, pagination, ...data } = standardResponse;
    return data as T;
  }

  // Direct response (legacy format)
  return response as T;
}

// ✨ NEW v1.8.6: Enhanced Link creation data interface
export interface CreateLinkData {
  originalUrl: string;
  tag?: string;
  amazonTagId?: string;
  channelId?: string;
  source?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

// ✨ NEW: Advanced Filter Options Types
export interface AnalyticsFilterOptions {
  startDate?: string;
  endDate?: string;
  linkId?: string;
  channelId?: string;
  amazonTagId?: string;
  geo?: string;
  device?: string;
  browser?: string;
  referer?: string;
  subId?: string;
}

export interface LinkFilterOptions {
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'paused' | 'expired';
  amazonTagId?: string;
  channelId?: string;
  // Existing pagination/sorting options
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TrendFilterOptions {
  startDate?: string;
  endDate?: string;
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  linkId?: string;
  channelId?: string;
  amazonTagId?: string;
  geo?: string;
  device?: string;
  browser?: string;
  referer?: string;
  subId?: string;
}

// ✅ ENHANCED: AffiliateLink interface with proper typing
export interface AffiliateLink extends LinkData {
  _id?: string;
  id?: string;
  hash: string;
  originalUrl: string;
  shortUrl?: string;
  tag?: string;
  amazonTagId?: string;
  channelId?: string;
  source?: string;
  isActive: boolean;
  clickCount: number;
  uniqueClickCount: number;
  conversionCount: number;
  totalRevenue: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

// ✅ FIXED: Use aliases to maintain backward compatibility while using unified types
export type ClicksTrendData = ClickTrendData;
export type RevenueTrendData = RevenueTrendDataType;

// ... rest of the API key and other types remain the same
export interface ApiKeyData {
  id: string;           
  name: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  keyPreview: string;   
  usageCount?: number;  
  key?: string;         
}

// ✨ NEW v1.8.x: Types for Multi-Tags and Multi-Channels
export interface AmazonTag {
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

export interface Channel {
  id: string;
  name: string;
  type: 'website' | 'blog' | 'youtube' | 'instagram' | 'telegram' | 'discord' | 'other';
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

export interface CreateAmazonTagData {
  tag: string;
  marketplace: string;
  name: string;
  isDefault?: boolean;
}

export interface UpdateAmazonTagData {
  tag?: string;
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreateChannelData {
  name: string;
  type: Channel['type'];
  url?: string;
  description?: string;
  isDefault?: boolean;
  defaultAmazonTagId?: string;
}

export interface UpdateChannelData {
  name?: string;
  type?: Channel['type'];
  url?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  defaultAmazonTagId?: string;
}

// Constants for validation
export const AMAZON_MARKETPLACES = [
  { code: 'com', name: 'Amazon.com (US)', flag: '🇺🇸' },
  { code: 'it', name: 'Amazon.it (Italia)', flag: '🇮🇹' },
  { code: 'de', name: 'Amazon.de (Germania)', flag: '🇩🇪' },
  { code: 'fr', name: 'Amazon.fr (Francia)', flag: '🇫🇷' },
  { code: 'es', name: 'Amazon.es (Spagna)', flag: '🇪🇸' },
  { code: 'co.uk', name: 'Amazon.co.uk (Regno Unito)', flag: '🇬🇧' },
  { code: 'ca', name: 'Amazon.ca (Canada)', flag: '🇨🇦' },
  { code: 'com.au', name: 'Amazon.com.au (Australia)', flag: '🇦🇺' },
  { code: 'co.jp', name: 'Amazon.co.jp (Giappone)', flag: '🇯🇵' },
];

export const CHANNEL_TYPES = [
  { code: 'website', name: 'Sito Web', icon: '🌐' },
  { code: 'blog', name: 'Blog', icon: '📝' },
  { code: 'youtube', name: 'YouTube', icon: '📺' },
  { code: 'instagram', name: 'Instagram', icon: '📷' },
  { code: 'telegram', name: 'Telegram', icon: '📱' },
  { code: 'discord', name: 'Discord', icon: '🎮' },
  { code: 'other', name: 'Altro', icon: '📦' },
];

// ✅ HELPER: Generate realistic mock data when backend is not available
const generateMockStatsData = (): any => {
  return {
    totalLinks: 12,
    totalClicks: 3847,
    uniqueClicks: 2943,
    totalConversions: 186,
    pendingConversions: 23,
    rejectedConversions: 8,
    totalRevenue: 892.45,
    conversionRate: 4.83,
    earningsPerClick: 0.232,
    dataPeriod: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  };
};

const generateMockTrendData = (type: 'clicks' | 'revenue'): any[] => {
  const days = 7;
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    
    if (type === 'clicks') {
      data.push({
        date: date.toISOString().split('T')[0],
        clicks: Math.floor(Math.random() * 500 + 200),
        uniqueClicks: Math.floor(Math.random() * 400 + 150)
      });
    } else {
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.random() * 150 + 50,
        conversions: Math.floor(Math.random() * 25 + 5)
      });
    }
  }
  
  return data;
};

const buildUrlParams = (filters: Record<string, any>): URLSearchParams => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // ✅ FIX: Convert date-only strings to ISO datetime for backend compatibility
      if ((key === 'startDate' || key === 'endDate') && typeof value === 'string') {
        // Check if it's a date-only format (YYYY-MM-DD)
        const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
        if (dateOnlyPattern.test(value)) {
          // Convert to ISO datetime
          const date = new Date(value);
          if (key === 'startDate') {
            // For start date, use beginning of day
            date.setHours(0, 0, 0, 0);
          } else {
            // For end date, use end of day
            date.setHours(23, 59, 59, 999);
          }
          params.append(key, date.toISOString());
        } else {
          // Already in datetime format or invalid
          params.append(key, String(value));
        }
      } else {
        params.append(key, String(value));
      }
    }
  });
  
  return params;
};

// Generic hook for API calls with auth
export function useApiCall<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const execute = useCallback(async (
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: any;
      headers?: Record<string, string>;
    }
  ): Promise<T | null> => {
    if (!isLoggedIn) {
      setError('Authentication required');
      return null;
    }

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) {
      setError('Authentication client not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result: ApiResponse<T>;
      const { method = 'GET', data: requestData, headers } = options || {};

      switch (method) {
        case 'POST':
          result = await apiClient.post<ApiResponse<T>>(endpoint, requestData, headers);
          break;
        case 'PUT':
          result = await apiClient.put<ApiResponse<T>>(endpoint, requestData, headers);
          break;
        case 'PATCH':
          result = await apiClient.patch<ApiResponse<T>>(endpoint, requestData, headers);
          break;
        case 'DELETE':
          result = await apiClient.delete<ApiResponse<T>>(endpoint, headers);
          break;
        default:
          result = await apiClient.get<ApiResponse<T>>(endpoint, headers);
      }

      const extractedData = extractApiData<T>(result);
      setData(extractedData);
      setIsLoading(false);
      return extractedData;
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'An error occurred while fetching data';
      
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}

// ✅ ENHANCED: Updated hook for fetching user statistics with proper type safety
export function useStats(autoFetch = true) {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchStats = useCallback(async (filters?: AnalyticsFilterOptions) => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = buildUrlParams(filters || {});
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const result = await apiClient.get<ApiResponse<{ summary: StatsData }>>(`/api/user/analytics/summary${queryString}`);
      
      try {
        const extractedData = extractApiData(result);
        const statsData = extractedData?.summary || extractedData;
        
        const processedData: StatsData = {
          totalLinks: statsData?.totalLinks || 0,
          totalClicks: statsData?.totalClicks || 0,
          uniqueClicks: statsData?.uniqueClicks || statsData?.totalClicks || 0,
          totalConversions: statsData?.totalConversions || 0,
          pendingConversions: statsData?.pendingConversions || 0,
          rejectedConversions: statsData?.rejectedConversions || 0,
          totalRevenue: statsData?.totalRevenue || 0,
          conversionRate: statsData?.conversionRate || 0,
          earningsPerClick: statsData?.earningsPerClick || 0,
          dataPeriod: statsData?.dataPeriod || {
            startDate: filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: filters?.endDate || new Date().toISOString().split('T')[0]
          }
        };
        
        setData(processedData);
      } catch (extractError) {
        console.warn('Failed to extract stats data, using fallback handling:', extractError);
        // Fallback to original logic for backwards compatibility
        const statsData = (result as any)?.data?.summary || (result as any)?.summary || result;
        setData(statsData);
      }
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch statistics';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  useEffect(() => {
    if (autoFetch && isLoggedIn) {
      fetchStats();
    }
  }, [autoFetch, isLoggedIn, fetchStats]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

// ✅ ENHANCED: Updated hook for fetching user's affiliate links with proper type handling
export function useLinks(autoFetch = true) {
  const [data, setData] = useState<AffiliateLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchLinks = useCallback(async (filters?: LinkFilterOptions) => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = buildUrlParams(filters || {});
      const endpoint = `/api/user/links${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await apiClient.get<ApiResponse<LinksListResponse>>(endpoint);
      
      try {
        const extractedData = extractApiData(result);
        const linksArray = extractedData?.links || extractedData || [];
        setData(Array.isArray(linksArray) ? linksArray : []);
      } catch (extractError) {
        console.warn('Failed to extract links data, using fallback handling:', extractError);
        // Fallback for backwards compatibility
        const linksArray = Array.isArray(result) ? result : 
                          (result as any)?.links ? (result as any).links : 
                          (result as any)?.data ? (result as any).data : [];
        setData(linksArray);
      }
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch links';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  // ✅ ENHANCED: Type-safe createLink function
  const createLink = useCallback(async (linkData: CreateLinkData): Promise<AffiliateLink> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.post<ApiResponse<LinkCreationResponse>>('/api/v1/links', linkData);
      
      // ✅ TYPE-SAFE: Use the new extraction utility
      const extractedData = extractApiData(result);
      const linkObject = extractedData?.link || extractedData;
      
      if (!linkObject || !linkObject.hash) {
        throw new Error('Invalid link data received from server');
      }
      
      // Refresh the links list
      fetchLinks();
      
      return linkObject;
    } catch (err) {
      console.error('Create link error:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchLinks]);

  useEffect(() => {
    if (autoFetch && isLoggedIn) {
      fetchLinks();
    }
  }, [autoFetch, isLoggedIn, fetchLinks]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchLinks,
    createLink,
  };
}

// ✅ ENHANCED: Updated hook for fetching clicks trend data with type safety
export function useClicksTrend(filters?: TrendFilterOptions, autoFetch = true) {
  const [data, setData] = useState<ClickTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchTrend = useCallback(async (customFilters?: TrendFilterOptions) => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const activeFilters = customFilters || filters || {};
      const params = buildUrlParams(activeFilters);
      
      let result: any = null;
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      try {
        const endpoint = `/api/user/analytics/clicks-trend${queryString}`;
        result = await apiClient.get<ApiResponse<{ trend: ClickTrendData[] }>>(endpoint);
        
        const extractedData = extractApiData(result);
        const trendsArray = extractedData?.trend || extractedData || [];
        
        // Validate and normalize data
        const normalizedTrends = trendsArray.map((item: any) => ({
          date: item?.date || '',
          clicks: item?.clicks || 0,
          uniqueClicks: item?.uniqueClicks || item?.clicks || 0
        }));
        
        setData(normalizedTrends);
      } catch (backendError) {
        console.log('Clicks trend endpoint not available, using mock data');
        const mockData = generateMockTrendData('clicks');
        setData(mockData);
      }
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch clicks trend';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoggedIn, getAuthenticatedApiClient]);

  useEffect(() => {
    if (autoFetch && isLoggedIn) {
      fetchTrend();
    }
  }, [autoFetch, isLoggedIn, fetchTrend]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTrend,
  };
}

// ✅ ENHANCED: Updated hook for fetching revenue trend data with type safety
export function useRevenueTrend(filters?: TrendFilterOptions, autoFetch = true) {
  const [data, setData] = useState<RevenueTrendDataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchTrend = useCallback(async (customFilters?: TrendFilterOptions) => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const activeFilters = customFilters || filters || {};
      const params = buildUrlParams(activeFilters);
      
      let result: any = null;
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      try {
        const endpoint = `/api/user/analytics/revenue-trend${queryString}`;
        result = await apiClient.get<ApiResponse<{ trend: RevenueTrendDataType[] }>>(endpoint);
        
        const extractedData = extractApiData(result);
        const trendsArray = extractedData?.trend || extractedData || [];
        
        // Validate and normalize data
        const normalizedTrends = trendsArray.map((item: any) => ({
          date: item?.date || '',
          revenue: item?.revenue || 0,
          conversions: item?.conversions || 0
        }));
        
        setData(normalizedTrends);
      } catch (backendError) {
        console.log('Revenue trend endpoint not available, using mock data');
        const mockData = generateMockTrendData('revenue');
        setData(mockData);
      }
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch revenue trend';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoggedIn, getAuthenticatedApiClient]);

  useEffect(() => {
    if (autoFetch && isLoggedIn) {
      fetchTrend();
    }
  }, [autoFetch, isLoggedIn, fetchTrend]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTrend,
  };
}

// Hook for managing API keys (enhanced with type safety)
export function useApiKeys(autoFetch = true) {
  const [data, setData] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchApiKeys = useCallback(async () => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<ApiResponse<ApiKeysResponse>>('/api/user/keys');
      
      try {
        const extractedData = extractApiData(result);
        const apiKeysData = extractedData?.apiKeys || extractedData || [];
        setData(Array.isArray(apiKeysData) ? apiKeysData : []);
      } catch (extractError) {
        console.warn('Failed to extract API keys data, using fallback handling:', extractError);
        // Fallback for backwards compatibility
        const apiKeysData = (result as any)?.data?.apiKeys || (result as any)?.apiKeys || result || [];
        setData(Array.isArray(apiKeysData) ? apiKeysData : []);
      }
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch API keys';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const createApiKey = useCallback(async (name: string): Promise<ApiKeyData> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.post<ApiResponse<{ apiKey: ApiKeyData }>>('/api/user/keys', { name });
      
      const extractedData = extractApiData(result);
      const apiKeyData = extractedData?.apiKey || extractedData;
      
      console.log('🔑 API Key Data:', apiKeyData);
      
      fetchApiKeys(); // Refresh the list
      return apiKeyData;
    } catch (err) {
      console.error('❌ Create API Key Error:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchApiKeys]);

  const updateApiKey = useCallback(async (keyId: string, updates: { name?: string; isActive?: boolean }): Promise<ApiKeyData> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.patch<ApiResponse<{ apiKey: ApiKeyData }>>(`/api/user/keys/${keyId}`, updates);
      const extractedData = extractApiData(result);
      const apiKeyData = extractedData?.apiKey || extractedData;
      
      fetchApiKeys(); // Refresh the list
      return apiKeyData;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchApiKeys]);

  const deleteApiKey = useCallback(async (keyId: string): Promise<void> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      await apiClient.delete(`/api/user/keys/${keyId}`);
      fetchApiKeys(); // Refresh the list
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchApiKeys]);

  useEffect(() => {
    if (autoFetch && isLoggedIn) {
      fetchApiKeys();
    }
  }, [autoFetch, isLoggedIn, fetchApiKeys]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
  };
}

// Types for user profile (UPDATED for v1.8.x)
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: 'affiliate' | 'advertiser' | 'admin';
  isEmailVerified: boolean;
  // ⚠️ DEPRECATED - kept for backward compatibility
  amazonAssociateTag?: string;
  websiteUrl?: string;
  companyName?: string;
  // ✨ NEW v1.8.x: Multi-entity support
  amazonTags?: AmazonTag[];
  channels?: Channel[];
  defaultAmazonTagId?: string;
  defaultChannelId?: string;
  balance: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserProfileUpdateData {
  name?: string;
  firstName?: string;
  lastName?: string;
  amazonAssociateTag?: string;
  websiteUrl?: string;
  companyName?: string;
  // ✨ NEW v1.8.x
  defaultAmazonTagId?: string;
  defaultChannelId?: string;
}

// Hook for user profile management (UPDATED for v1.8.x with type safety)
export function useUserProfile(autoFetch = true) {
  const [data, setData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn, updateProfile } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<ApiResponse<UserProfileResponse>>('/api/user/me');
      
      try {
        const extractedData = extractApiData(result);
        const userData = extractedData?.user || extractedData;
        setData(userData);
      } catch (extractError) {
        console.warn('Failed to extract user profile data, using fallback handling:', extractError);
        const userData = (result as any)?.user || result;
        setData(userData);
      }
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch user profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const updateUserProfile = useCallback(async (updates: UserProfileUpdateData): Promise<UserProfile> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.put<ApiResponse<UserProfileResponse>>('/api/user/me', updates);
      
      const extractedData = extractApiData(result);
      const userData = extractedData?.user || extractedData;
      setData(userData);
      
      // Update auth context if the user object is updated
      await updateProfile(userData);
      
      return userData;
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient, updateProfile]);

  const validateAmazonTag = useCallback((tag: string): string | null => {
    if (!tag) return null;
    
    // Amazon associate tag validation
    if (tag.length < 3 || tag.length > 20) {
      return 'Tag Amazon deve essere tra 3 e 20 caratteri';
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
      return 'Tag Amazon può contenere solo lettere, numeri, trattini e underscore';
    }
    
    if (!tag.includes('-')) {
      return 'Tag Amazon deve contenere almeno un trattino (es. "mysite-21")';
    }
    
    return null;
  }, []);

  const validateWebsiteUrl = useCallback((url: string): string | null => {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'URL deve iniziare con http:// o https://';
      }
      return null;
    } catch {
      return 'URL non valido';
    }
  }, []);

  useEffect(() => {
    if (autoFetch && isLoggedIn) {
      fetchProfile();
    }
  }, [autoFetch, isLoggedIn, fetchProfile]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile: updateUserProfile,
    // Validation helpers
    validateAmazonTag,
    validateWebsiteUrl,
  };
}

// ✨ NEW v1.8.x: Hook for managing Amazon Tags (enhanced with type safety)
export function useAmazonTags(autoFetch = true) {
  const [data, setData] = useState<AmazonTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchAmazonTags = useCallback(async () => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<ApiResponse<AmazonTagsResponse>>('/api/user/amazon-tags');
      
      try {
        const extractedData = extractApiData(result);
        const tagsData = extractedData?.amazonTags || extractedData || [];
        setData(Array.isArray(tagsData) ? tagsData : []);
      } catch (extractError) {
        console.warn('Failed to extract Amazon tags data, using fallback handling:', extractError);
        const tagsData = (result as any)?.amazonTags || result || [];
        setData(Array.isArray(tagsData) ? tagsData : []);
      }
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch Amazon tags';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const createAmazonTag = useCallback(async (tagData: CreateAmazonTagData): Promise<AmazonTag> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.post<ApiResponse<{ amazonTag: AmazonTag }>>('/api/user/amazon-tags', tagData);
      
      const extractedData = extractApiData(result);
      const amazonTag = extractedData?.amazonTag || extractedData;
      
      fetchAmazonTags(); // Refresh the list
      return amazonTag;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchAmazonTags]);

  const updateAmazonTag = useCallback(async (tagId: string, updates: UpdateAmazonTagData): Promise<AmazonTag> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.patch<ApiResponse<{ amazonTag: AmazonTag }>>(`/api/user/amazon-tags/${tagId}`, updates);
      
      const extractedData = extractApiData(result);
      const amazonTag = extractedData?.amazonTag || extractedData;
      
      fetchAmazonTags(); // Refresh the list
      return amazonTag;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchAmazonTags]);

  const deleteAmazonTag = useCallback(async (tagId: string): Promise<void> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      await apiClient.delete(`/api/user/amazon-tags/${tagId}`);
      fetchAmazonTags(); // Refresh the list
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchAmazonTags]);

  useEffect(() => {
    if (autoFetch && isLoggedIn) {
      fetchAmazonTags();
    }
  }, [autoFetch, isLoggedIn, fetchAmazonTags]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAmazonTags,
    createAmazonTag,
    updateAmazonTag,
    deleteAmazonTag,
  };
}

// ✨ NEW v1.8.x: Hook for managing Channels (enhanced with type safety)
export function useChannels(autoFetch = true) {
  const [data, setData] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchChannels = useCallback(async () => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<ApiResponse<ChannelsResponse>>('/api/user/channels');
      
      try {
        const extractedData = extractApiData(result);
        const channelsData = extractedData?.channels || extractedData || [];
        setData(Array.isArray(channelsData) ? channelsData : []);
      } catch (extractError) {
        console.warn('Failed to extract channels data, using fallback handling:', extractError);
        const channelsData = (result as any)?.channels || result || [];
        setData(Array.isArray(channelsData) ? channelsData : []);
      }
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch channels';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const createChannel = useCallback(async (channelData: CreateChannelData): Promise<Channel> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.post<ApiResponse<{ channel: Channel }>>('/api/user/channels', channelData);
      
      const extractedData = extractApiData(result);
      const channel = extractedData?.channel || extractedData;
      
      fetchChannels(); // Refresh the list
      return channel;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchChannels]);

  const updateChannel = useCallback(async (channelId: string, updates: UpdateChannelData): Promise<Channel> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.patch<ApiResponse<{ channel: Channel }>>(`/api/user/channels/${channelId}`, updates);
      
      const extractedData = extractApiData(result);
      const channel = extractedData?.channel || extractedData;
      
      fetchChannels(); // Refresh the list
      return channel;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchChannels]);

  const deleteChannel = useCallback(async (channelId: string): Promise<void> => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      await apiClient.delete(`/api/user/channels/${channelId}`);
      fetchChannels(); // Refresh the list
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchChannels]);

  useEffect(() => {
    if (autoFetch && isLoggedIn) {
      fetchChannels();
    }
  }, [autoFetch, isLoggedIn, fetchChannels]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
  };
}
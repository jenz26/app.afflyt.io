'use client';

/**
 * API Hooks for Afflyt.io
 * Provides React hooks for data fetching with authentication integration
 * 
 * @version 1.8.0 - Extended for Multi-Tags and Multi-Channels Support
 * @phase Frontend-Backend Integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AfflytApiError } from '@/lib/api';

// Types for API responses
export interface StatsData {
  totalLinks: number;
  totalClicks: number;
  uniqueClicks?: number;
  totalConversions: number;
  pendingConversions?: number;
  rejectedConversions?: number;
  totalRevenue: number;
  conversionRate: number;
  earningsPerClick: number;
  dataPeriod?: {
    startDate: string;
    endDate: string;
  };
}

export interface AffiliateLink {
  _id: string;
  hash: string;
  originalUrl: string;
  tag?: string;
  clickCount: number;
  status: 'active' | 'paused' | 'expired';
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface ClicksTrendData {
  date: string;
  clicks: number;
  uniqueClicks: number;
}

export interface RevenueTrendData {
  date: string;
  revenue: number;
  conversions: number;
}

export interface ApiKeyData {
  id: string;           // Backend usa 'id' (non keyId)
  name: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  keyPreview: string;   // Backend fornisce 'keyPreview' 
  usageCount?: number;  // Opzionale per compatibilità
  key?: string;         // Key completa solo alla creazione
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
  ) => {
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
      let result: T;
      const { method = 'GET', data: requestData, headers } = options || {};

      switch (method) {
        case 'POST':
          result = await apiClient.post<T>(endpoint, requestData, headers);
          break;
        case 'PUT':
          result = await apiClient.put<T>(endpoint, requestData, headers);
          break;
        case 'PATCH':
          result = await apiClient.patch<T>(endpoint, requestData, headers);
          break;
        case 'DELETE':
          result = await apiClient.delete<T>(endpoint, headers);
          break;
        default:
          result = await apiClient.get<T>(endpoint, headers);
      }

      setData(result);
      setIsLoading(false);
      return result;
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

// Hook for fetching user statistics/summary
export function useStats(autoFetch = true) {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchStats = useCallback(async (dateRange?: {
    startDate?: string;
    endDate?: string;
  }) => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const endpoint = `/api/user/analytics/summary${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await apiClient.get<StatsData>(endpoint);
      
      setData(result);
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

// Hook for fetching user's affiliate links
export function useLinks(autoFetch = true) {
  const [data, setData] = useState<AffiliateLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchLinks = useCallback(async (options?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

      const endpoint = `/api/user/links${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await apiClient.get<AffiliateLink[]>(endpoint);
      
      setData(result || []);
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch links';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  // Create new link
  const createLink = useCallback(async (linkData: {
    originalUrl: string;
    tag?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.post<AffiliateLink>('/api/v1/links', linkData);
      
      // Refresh the links list
      fetchLinks();
      
      return result;
    } catch (err) {
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

// Hook for fetching clicks trend data
export function useClicksTrend(period: '24h' | '7d' | '30d' | '90d' | '12m' = '7d') {
  const [data, setData] = useState<ClicksTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchTrend = useCallback(async () => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<ClicksTrendData[]>(
        `/api/user/analytics/clicks-trend?period=${period}`
      );
      
      setData(result || []);
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch clicks trend';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [period, isLoggedIn, getAuthenticatedApiClient]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTrend();
    }
  }, [isLoggedIn, fetchTrend]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTrend,
  };
}

// Hook for fetching revenue trend data
export function useRevenueTrend(period: '24h' | '7d' | '30d' | '90d' | '12m' = '7d') {
  const [data, setData] = useState<RevenueTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  const fetchTrend = useCallback(async () => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<RevenueTrendData[]>(
        `/api/user/analytics/revenue-trend?period=${period}`
      );
      
      setData(result || []);
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch revenue trend';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [period, isLoggedIn, getAuthenticatedApiClient]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTrend();
    }
  }, [isLoggedIn, fetchTrend]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTrend,
  };
}

// Hook for managing API keys
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
    const result = await apiClient.get('/api/user/keys');
    
    // 🔧 FIX: Il backend ritorna { success: true, data: { apiKeys: [...] } }
    const apiKeysData = result?.data?.apiKeys || result?.apiKeys || result || [];
    setData(Array.isArray(apiKeysData) ? apiKeysData : []);
  } catch (err) {
    const errorMessage = err instanceof AfflytApiError 
      ? err.message 
      : 'Failed to fetch API keys';
    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
}, [isLoggedIn, getAuthenticatedApiClient]);

  const createApiKey = useCallback(async (name: string) => {
  if (!isLoggedIn) throw new Error('Authentication required');

  const apiClient = getAuthenticatedApiClient();
  if (!apiClient) throw new Error('Authentication client not available');

  try {
    const result = await apiClient.post('/api/user/keys', { name });
    
    // 🔧 FIX: Il backend ritorna { apiKey: { key: "...", ... } }
    // Ma noi ci aspettiamo { key: "...", ... } direttamente
    const apiKeyData = result?.apiKey || result;
    
    console.log('🔑 API Key Data:', apiKeyData);
    
    fetchApiKeys(); // Refresh the list
    return apiKeyData; // ← Ritorna apiKeyData invece di result
  } catch (err) {
    console.error('❌ Create API Key Error:', err);
    throw err;
  }
}, [isLoggedIn, getAuthenticatedApiClient, fetchApiKeys]);

  const updateApiKey = useCallback(async (keyId: string, updates: { name?: string; isActive?: boolean }) => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.patch(`/api/user/keys/${keyId}`, updates);
      fetchApiKeys(); // Refresh the list
      return result;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchApiKeys]);

  const deleteApiKey = useCallback(async (keyId: string) => {
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

// Hook for user profile management (UPDATED for v1.8.x)
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
      const result = await apiClient.get<{ user: UserProfile }>('/api/user/me');
      const userData = result?.user || result;
      setData(userData);
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch user profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const updateUserProfile = useCallback(async (updates: UserProfileUpdateData) => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.put<{ user: UserProfile }>('/api/user/me', updates);
      const userData = result?.user || result;
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

// ✨ NEW v1.8.x: Hook for managing Amazon Tags
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
      const result = await apiClient.get<{ amazonTags: AmazonTag[] }>('/api/user/amazon-tags');
      const tagsData = result?.amazonTags || result || [];
      setData(Array.isArray(tagsData) ? tagsData : []);
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch Amazon tags';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const createAmazonTag = useCallback(async (tagData: CreateAmazonTagData) => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.post<{ amazonTag: AmazonTag }>('/api/user/amazon-tags', tagData);
      fetchAmazonTags(); // Refresh the list
      return result?.amazonTag || result;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchAmazonTags]);

  const updateAmazonTag = useCallback(async (tagId: string, updates: UpdateAmazonTagData) => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.patch<{ amazonTag: AmazonTag }>(`/api/user/amazon-tags/${tagId}`, updates);
      fetchAmazonTags(); // Refresh the list
      return result?.amazonTag || result;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchAmazonTags]);

  const deleteAmazonTag = useCallback(async (tagId: string) => {
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

// ✨ NEW v1.8.x: Hook for managing Channels
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
      const result = await apiClient.get<{ channels: Channel[] }>('/api/user/channels');
      const channelsData = result?.channels || result || [];
      setData(Array.isArray(channelsData) ? channelsData : []);
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to fetch channels';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const createChannel = useCallback(async (channelData: CreateChannelData) => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.post<{ channel: Channel }>('/api/user/channels', channelData);
      fetchChannels(); // Refresh the list
      return result?.channel || result;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchChannels]);

  const updateChannel = useCallback(async (channelId: string, updates: UpdateChannelData) => {
    if (!isLoggedIn) throw new Error('Authentication required');

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) throw new Error('Authentication client not available');

    try {
      const result = await apiClient.patch<{ channel: Channel }>(`/api/user/channels/${channelId}`, updates);
      fetchChannels(); // Refresh the list
      return result?.channel || result;
    } catch (err) {
      throw err;
    }
  }, [isLoggedIn, getAuthenticatedApiClient, fetchChannels]);

  const deleteChannel = useCallback(async (channelId: string) => {
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
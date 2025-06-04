// apps/web/src/hooks/useLinks.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { LinksResponse, UseLinksOptions } from '@/types/analytics';

export const useLinks = (options: UseLinksOptions = {}) => {
  const [data, setData] = useState<LinksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient } = useAuth();

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiClient = getAuthenticatedApiClient();
        if (!apiClient) {
          setError('Not authenticated');
          return;
        }

        const queryParams = new URLSearchParams();
        if (options.limit) queryParams.append('limit', options.limit.toString());
        if (options.page) queryParams.append('page', options.page.toString());
        if (options.sortBy) queryParams.append('sortBy', options.sortBy);
        if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

        const response = await apiClient.get<LinksResponse>(`/api/user/links?${queryParams.toString()}`);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch links');
        console.error('Error fetching links:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, [getAuthenticatedApiClient, options.limit, options.page, options.sortBy, options.sortOrder]);

  return { data, isLoading, error, refetch: () => setData(null) };
};
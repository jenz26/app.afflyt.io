// apps/web/src/hooks/useRevenueTrend.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { RevenueTrendData, TrendPeriod, UseTrendOptions } from '@/types/analytics';

export const useRevenueTrend = (
  period: TrendPeriod = '30d',
  options: UseTrendOptions = {}
) => {
  const [data, setData] = useState<RevenueTrendData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient } = useAuth();

  useEffect(() => {
    const fetchRevenueTrend = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiClient = getAuthenticatedApiClient();
        if (!apiClient) {
          setError('Not authenticated');
          return;
        }

        const queryParams = new URLSearchParams();
        queryParams.append('period', period);
        if (options.granularity) queryParams.append('granularity', options.granularity);
        if (options.linkId) queryParams.append('linkId', options.linkId);
        if (options.subId) queryParams.append('subId', options.subId);

        const response = await apiClient.get<RevenueTrendData[]>(`/api/user/analytics/revenue-trend?${queryParams.toString()}`);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch revenue trend');
        console.error('Error fetching revenue trend:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenueTrend();
  }, [getAuthenticatedApiClient, period, options.granularity, options.linkId, options.subId]);

  return { data, isLoading, error };
};
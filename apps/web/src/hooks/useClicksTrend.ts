// apps/web/src/hooks/useClicksTrend.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { ClickTrendData, TrendPeriod, UseTrendOptions } from '@/types/analytics';

export const useClicksTrend = (
  period: TrendPeriod = '7d',
  options: UseTrendOptions = {}
) => {
  const [data, setData] = useState<ClickTrendData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient } = useAuth();

  useEffect(() => {
    const fetchClicksTrend = async () => {
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

        const response = await apiClient.get<ClickTrendData[]>(`/api/user/analytics/clicks-trend?${queryParams.toString()}`);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clicks trend');
        console.error('Error fetching clicks trend:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClicksTrend();
  }, [getAuthenticatedApiClient, period, options.granularity, options.linkId, options.subId]);

  return { data, isLoading, error };
};
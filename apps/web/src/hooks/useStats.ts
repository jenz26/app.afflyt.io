// apps/web/src/hooks/useStats.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { StatsData, UseStatsOptions } from '@/types/analytics';

export const useStats = (options: UseStatsOptions = {}) => {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthenticatedApiClient } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiClient = getAuthenticatedApiClient();
        if (!apiClient) {
          setError('Not authenticated');
          return;
        }

        const queryParams = new URLSearchParams();
        if (options.startDate) queryParams.append('startDate', options.startDate);
        if (options.endDate) queryParams.append('endDate', options.endDate);

        const response = await apiClient.get<StatsData>(`/api/user/analytics/summary?${queryParams.toString()}`);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [getAuthenticatedApiClient, options.startDate, options.endDate]);

  return { data, isLoading, error, refetch: () => setData(null) };
};
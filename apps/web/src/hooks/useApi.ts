'use client';

import { useState, useEffect } from 'react';

// Mock data per ora, poi integreremo con le API reali
const mockStatsData = {
  totalLinks: 24,
  totalClicks: 1247,
  conversions: 89,
  revenue: 2847,
  conversionRate: 7.1,
  earningsPerClick: 2.28
};

export const useStats = () => {
  const [data, setData] = useState(mockStatsData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setData(mockStatsData);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading, error };
};

// Altri hook che potrebbero servire
export const useLinks = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  return { data, isLoading };
};
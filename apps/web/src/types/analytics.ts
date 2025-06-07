// apps/web/src/types/analytics.ts
export type TrendPeriod = '24h' | '7d' | '30d' | '90d' | '12m';
export type TrendGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface StatsData {
  totalLinks: number;
  totalClicks: number;
  uniqueClicks: number;
  totalConversions: number;
  pendingConversions: number;
  rejectedConversions: number;
  totalRevenue: number;
  conversionRate: number;
  earningsPerClick: number;
  dataPeriod: {
    startDate: string;
    endDate: string;
  };
}

export interface ClickTrendData {
  date: string;
  clicks: number;
  uniqueClicks: number;
}

export interface RevenueTrendData {
  date: string;
  revenue: number;
  conversions: number;
}

export interface LinkData {
  hash: string;
  originalUrl: string;
  tag?: string;
  clickCount: number;
  createdAt: string;
  status: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

export interface LinksResponse {
  links: LinkData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UseStatsOptions {
  startDate?: string;
  endDate?: string;
}

export interface UseLinksOptions {
  limit?: number;
  page?: number;
  sortBy?: 'createdAt' | 'clickCount' | 'tag';
  sortOrder?: 'asc' | 'desc';
}

export interface UseTrendOptions {
  linkId?: string;
  subId?: string;
  granularity?: TrendGranularity;
}


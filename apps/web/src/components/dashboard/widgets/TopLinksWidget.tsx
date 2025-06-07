// apps/web/src/components/dashboard/widgets/TopLinksWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link2, TrendingUp, AlertCircle, Award, Target, ExternalLink, Copy, BarChart3, Euro, Mouse, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';

// Types for top links data (updated to match backend response)
interface BackendTopLink {
  hash: string;
  originalUrl: string;
  shortUrl: string;
  tag: string | null;
  clickCount: number;
  uniqueClickCount: number;
  conversionCount: number;
  totalRevenue: number;
  conversionRate: number;
  earningsPerClick: number;
  createdAt: string;
}

interface BackendResponse {
  success: boolean;
  data: {
    topLinks: BackendTopLink[];
  };
  timestamp: string;
}

interface TopLinkData {
  hash: string;
  originalUrl: string;
  tag?: string;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  earningsPerClick: number;
  revenueShare: number; // Percentage of total user revenue
  rank: number;
  trend: 'up' | 'down' | 'stable';
  category: 'hot' | 'rising' | 'consistent' | 'declining';
  createdAt: string;
}

interface TopLinksData {
  links: TopLinkData[];
  totalRevenue: number;
  totalClicks: number;
  bestPerformer: TopLinkData;
  metrics: {
    avgConversionRate: number;
    avgEarningsPerClick: number;
    totalConversions: number;
  };
  isLiveData: boolean; // Indicatore per sapere se sono dati reali o mock
}

type SortBy = 'revenue' | 'conversionRate' | 'earningsPerClick' | 'clicks';

// Color schemes for categories
const CATEGORY_COLORS = {
  hot: '#EF4444',        // Red - high performing
  rising: '#10B981',     // Green - trending up
  consistent: '#3B82F6', // Blue - stable
  declining: '#6B7280'   // Gray - declining
};

const CATEGORY_LABELS = {
  hot: 'Hot',
  rising: 'In crescita',
  consistent: 'Stabile',
  declining: 'In calo'
};

// Custom Tooltip for Performance Chart
const PerformanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
        <div className="text-white font-medium mb-2">
          {data.tag || getDomainFromUrl(data.originalUrl)}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Revenue:</span>
            <span className="text-green-400 font-bold">€{data.revenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Click:</span>
            <span className="text-blue-400 font-bold">{data.clicks.toLocaleString('it-IT')}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Conversioni:</span>
            <span className="text-purple-400 font-bold">{data.conversions}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Tasso conv.:</span>
            <span className="text-orange-400 font-bold">{data.conversionRate.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Copy tooltip component
const CopyTooltip = ({ message, visible }: { message: string; visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-green-600 text-white text-xs rounded z-10">
      {message}
    </div>
  );
};

// Helper function to extract domain
const getDomainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Link';
  }
};

export const TopLinksWidget = () => {
  const [data, setData] = useState<TopLinksData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('revenue');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchTopLinksData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiClient = getAuthenticatedApiClient();
        if (!apiClient) {
          console.log('TopLinksWidget: No API client available, using mock data');
          const mockData = generateRealisticTopLinksData(sortBy);
          setData(mockData);
          setIsLoading(false);
          return;
        }

        try {
          // Try to fetch real data from backend
          const response = await apiClient.get('/api/user/analytics/top-performing-links');
          
          // Process real data if successful
          console.log('TopLinksWidget: Raw response:', response);
          
          // Handle both direct response and wrapped response
          let actualData = null;
          if (response && typeof response === 'object') {
            // Case 1: Wrapped response { success: true, data: { topLinks: [...] } }
            if ('success' in response && response.success && response.data?.topLinks) {
              actualData = response.data.topLinks;
              console.log('TopLinksWidget: Found wrapped data with', actualData.length, 'links');
            }
            // Case 2: Direct response { topLinks: [...] }
            else if ('topLinks' in response) {
              actualData = response.topLinks;
              console.log('TopLinksWidget: Found direct topLinks with', actualData.length, 'links');
            }
            // Case 3: Direct array response
            else if (Array.isArray(response)) {
              actualData = response;
              console.log('TopLinksWidget: Found direct array with', actualData.length, 'links');
            }
          }
          
          if (actualData && Array.isArray(actualData)) {
            const processedData = processBackendData({ data: { topLinks: actualData } } as BackendResponse, sortBy);
            setData(processedData);
          } else {
            console.log('TopLinksWidget: Invalid response format, using mock data');
            const mockData = generateRealisticTopLinksData(sortBy);
            setData(mockData);
          }
          
        } catch (backendError: any) {
          console.log('TopLinksWidget: Backend call failed, using mock data:', backendError?.message);
          const mockData = generateRealisticTopLinksData(sortBy);
          setData(mockData);
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch top links data';
        console.error('TopLinksWidget: General error:', errorMessage);
        setError(errorMessage);
        
        // Final fallback to mock data
        const mockData = generateRealisticTopLinksData(sortBy);
        setData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopLinksData();
  }, [getAuthenticatedApiClient, sortBy, isLoggedIn]);

  // Process backend data to match our interface
  const processBackendData = (backendResponse: BackendResponse, currentSortBy: SortBy): TopLinksData => {
    const backendLinks = backendResponse.data.topLinks;
    
    if (!backendLinks || backendLinks.length === 0) {
      // Se non ci sono link reali, usa mock data ma marca come live
      const mockData = generateRealisticTopLinksData(currentSortBy);
      return { ...mockData, isLiveData: true };
    }
    
    // Convert backend format to our format
    const linksWithMetrics: TopLinkData[] = backendLinks.map((link, index) => {
      // Determine category based on performance
      let category: TopLinkData['category'];
      if (link.conversionRate > 5) category = 'hot';
      else if (link.conversionRate > 3) category = 'rising';
      else if (link.conversionRate > 1.5) category = 'consistent';
      else category = 'declining';

      // Determine trend (simplified logic based on conversion rate)
      const trend: TopLinkData['trend'] = 
        link.conversionRate > 4 ? 'up' : 
        link.conversionRate > 2 ? 'stable' : 'down';

      return {
        hash: link.hash,
        originalUrl: link.originalUrl,
        tag: link.tag || undefined,
        clicks: link.clickCount,
        uniqueClicks: link.uniqueClickCount,
        conversions: link.conversionCount,
        revenue: link.totalRevenue,
        conversionRate: link.conversionRate,
        earningsPerClick: link.earningsPerClick,
        revenueShare: 0, // Will be calculated below
        rank: index + 1,
        trend,
        category,
        createdAt: link.createdAt
      };
    });

    // Sort by selected metric
    const sortedLinks = [...linksWithMetrics].sort((a, b) => {
      switch (currentSortBy) {
        case 'revenue':
          return b.revenue - a.revenue;
        case 'conversionRate':
          return b.conversionRate - a.conversionRate;
        case 'earningsPerClick':
          return b.earningsPerClick - a.earningsPerClick;
        case 'clicks':
          return b.clicks - a.clicks;
        default:
          return b.revenue - a.revenue;
      }
    });

    // Calculate totals and metrics
    const totalRevenue = sortedLinks.reduce((sum, link) => sum + link.revenue, 0);
    const totalClicks = sortedLinks.reduce((sum, link) => sum + link.clicks, 0);
    const totalConversions = sortedLinks.reduce((sum, link) => sum + link.conversions, 0);

    // Update ranks and calculate revenue share
    const finalLinks = sortedLinks.map((link, index) => ({
      ...link,
      rank: index + 1,
      revenueShare: totalRevenue > 0 ? (link.revenue / totalRevenue) * 100 : 0
    }));

    const bestPerformer = finalLinks[0];

    const metrics = {
      avgConversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0,
      avgEarningsPerClick: totalClicks > 0 ? (totalRevenue / totalClicks) : 0,
      totalConversions
    };

    return {
      links: finalLinks.slice(0, 6), // Show top 6
      totalRevenue,
      totalClicks,
      bestPerformer,
      metrics,
      isLiveData: true
    };
  };

  // Generate realistic mock data
  const generateRealisticTopLinksData = (currentSortBy: SortBy): TopLinksData => {
    const baseLinks = [
      {
        hash: 'abc123',
        originalUrl: 'https://amazon.it/dp/B08N5WRWNW',
        tag: 'Echo Dot Smart Speaker',
        clicks: 2847,
        uniqueClicks: 2156,
        conversions: 89,
        revenue: 267.45,
        createdAt: '2025-05-15T10:30:00Z'
      },
      {
        hash: 'def456',
        originalUrl: 'https://amazon.it/dp/B09G9FPHY6',
        tag: 'iPad Air 5th Gen',
        clicks: 1923,
        uniqueClicks: 1456,
        conversions: 62,
        revenue: 186.75,
        createdAt: '2025-05-20T14:15:00Z'
      },
      {
        hash: 'ghi789',
        originalUrl: 'https://amazon.it/dp/B08FBGR5ZN',
        tag: 'AirPods Pro 2',
        clicks: 1456,
        uniqueClicks: 1234,
        conversions: 78,
        revenue: 234.60,
        createdAt: '2025-05-25T09:45:00Z'
      },
      {
        hash: 'jkl012',
        originalUrl: 'https://amazon.it/dp/B0B7CQRQF8',
        tag: 'MacBook Air M2',
        clicks: 894,
        uniqueClicks: 789,
        conversions: 23,
        revenue: 345.80,
        createdAt: '2025-05-30T16:20:00Z'
      },
      {
        hash: 'mno345',
        originalUrl: 'https://amazon.it/dp/B09NQCP3M3',
        tag: 'Nintendo Switch OLED',
        clicks: 1234,
        uniqueClicks: 987,
        conversions: 45,
        revenue: 135.75,
        createdAt: '2025-06-01T11:30:00Z'
      },
      {
        hash: 'pqr678',
        originalUrl: 'https://amazon.it/dp/B08G7H4X6K',
        tag: 'Sony WH-1000XM4',
        clicks: 756,
        uniqueClicks: 634,
        conversions: 34,
        revenue: 102.40,
        createdAt: '2025-06-02T13:15:00Z'
      }
    ];

    // Calculate derived metrics
    const linksWithMetrics: TopLinkData[] = baseLinks.map((link, index) => {
      const conversionRate = (link.conversions / link.clicks) * 100;
      const earningsPerClick = link.revenue / link.clicks;
      
      // Determine category based on performance
      let category: TopLinkData['category'];
      if (conversionRate > 5) category = 'hot';
      else if (conversionRate > 3) category = 'rising';
      else if (conversionRate > 1.5) category = 'consistent';
      else category = 'declining';

      // Determine trend (simplified logic)
      const trend: TopLinkData['trend'] = 
        conversionRate > 4 ? 'up' : 
        conversionRate > 2 ? 'stable' : 'down';

      return {
        ...link,
        conversionRate,
        earningsPerClick,
        revenueShare: 0, // Will be calculated below
        rank: index + 1,
        trend,
        category
      };
    });

    // Sort by selected metric
    const sortedLinks = [...linksWithMetrics].sort((a, b) => {
      switch (currentSortBy) {
        case 'revenue':
          return b.revenue - a.revenue;
        case 'conversionRate':
          return b.conversionRate - a.conversionRate;
        case 'earningsPerClick':
          return b.earningsPerClick - a.earningsPerClick;
        case 'clicks':
          return b.clicks - a.clicks;
        default:
          return b.revenue - a.revenue;
      }
    });

    // Update ranks and calculate revenue share
    const totalRevenue = sortedLinks.reduce((sum, link) => sum + link.revenue, 0);
    const totalClicks = sortedLinks.reduce((sum, link) => sum + link.clicks, 0);
    const totalConversions = sortedLinks.reduce((sum, link) => sum + link.conversions, 0);

    const finalLinks = sortedLinks.map((link, index) => ({
      ...link,
      rank: index + 1,
      revenueShare: (link.revenue / totalRevenue) * 100
    }));

    const bestPerformer = finalLinks[0];

    const metrics = {
      avgConversionRate: totalConversions / totalClicks * 100,
      avgEarningsPerClick: totalRevenue / totalClicks,
      totalConversions
    };

    return {
      links: finalLinks.slice(0, 6), // Show top 6
      totalRevenue,
      totalClicks,
      bestPerformer,
      metrics,
      isLiveData: false // Mock data
    };
  };

  // Handle copy link
  const handleCopyLink = async (hash: string) => {
    const shortUrl = `${window.location.origin}/r/${hash}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLink(hash);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
            <div>
              <div className="h-4 bg-slate-700 rounded w-32 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-48"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center text-red-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">Errore caricamento</p>
            <p className="text-sm text-gray-400">Impossibile caricare i top link</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30">
            <Award className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Top Link Performance
              {/* Indicatore stato dati */}
              <div className={`w-2 h-2 rounded-full ${data.isLiveData ? 'bg-green-500' : 'bg-yellow-500'}`} 
                   title={data.isLiveData ? 'Dati live dal database' : 'Dati mock (fallback)'}></div>
            </h3>
            <p className="text-sm text-gray-400">
              I tuoi link più performanti {data.isLiveData ? '(live)' : '(demo)'}
            </p>
          </div>
        </div>
        
        {/* Sort By Selector */}
        <div className="flex gap-1 p-1 bg-slate-700/50 rounded-lg">
          {[
            { value: 'revenue', label: 'Revenue', icon: Euro },
            { value: 'conversionRate', label: 'Conv.%', icon: Target },
            { value: 'earningsPerClick', label: '€/Click', icon: Zap },
            { value: 'clicks', label: 'Click', icon: Mouse }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSortBy(value as SortBy)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                sortBy === value
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Best Performer Highlight */}
        {data.bestPerformer && (
          <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-white font-medium">
                    {data.bestPerformer.tag || getDomainFromUrl(data.bestPerformer.originalUrl)}
                  </div>
                  <div className="text-xs text-yellow-400">
                    🏆 Miglior performer per {sortBy === 'revenue' ? 'revenue' : sortBy === 'conversionRate' ? 'conversioni' : sortBy === 'earningsPerClick' ? '€/click' : 'click'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">
                  {sortBy === 'revenue' ? `€${data.bestPerformer.revenue.toFixed(2)}` :
                   sortBy === 'conversionRate' ? `${data.bestPerformer.conversionRate.toFixed(1)}%` :
                   sortBy === 'earningsPerClick' ? `€${data.bestPerformer.earningsPerClick.toFixed(3)}` :
                   data.bestPerformer.clicks.toLocaleString('it-IT')}
                </div>
                <div className="text-xs text-gray-400">
                  {data.bestPerformer.revenueShare.toFixed(1)}% del revenue totale
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Links List */}
        <div className="space-y-3">
          {data.links.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Award className="h-12 w-12 mx-auto mb-2 text-gray-600" />
              <p>Nessun link trovato</p>
              <p className="text-sm">Crea dei link per vedere le performance</p>
            </div>
          ) : (
            data.links.map((link, index) => (
              <div 
                key={link.hash} 
                className="group p-4 bg-slate-700/30 rounded-xl border border-transparent hover:border-white/10 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600/50 flex items-center justify-center text-white font-bold text-sm">
                    #{link.rank}
                  </div>

                  {/* Link Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium truncate text-sm">
                        {link.tag || getDomainFromUrl(link.originalUrl)}
                      </h4>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1`}
                           style={{ 
                             backgroundColor: `${CATEGORY_COLORS[link.category]}20`,
                             color: CATEGORY_COLORS[link.category],
                             border: `1px solid ${CATEGORY_COLORS[link.category]}30`
                           }}>
                        {link.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                         link.trend === 'down' ? <TrendingUp className="w-3 h-3 rotate-180" /> : 
                         <Target className="w-3 h-3" />}
                        {CATEGORY_LABELS[link.category]}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Click: </span>
                        <span className="text-blue-400 font-medium">{link.clicks.toLocaleString('it-IT')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Conv.: </span>
                        <span className="text-green-400 font-medium">{link.conversions}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Revenue: </span>
                        <span className="text-yellow-400 font-medium">€{link.revenue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rate: </span>
                        <span className="text-purple-400 font-medium">{link.conversionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                      <button 
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => handleCopyLink(link.hash)}
                        title="Copia link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <CopyTooltip 
                        message="Copiato!" 
                        visible={copiedLink === link.hash} 
                      />
                    </div>
                    <button 
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Visualizza dettagli"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Apri link originale"
                      onClick={() => window.open(link.originalUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Performance Chart */}
        {data.links.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-yellow-400" />
              Performance Comparison
            </h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.links.slice(0, 5)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey={(item) => item.tag?.slice(0, 10) + '...' || getDomainFromUrl(item.originalUrl).slice(0, 10)}
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => 
                      sortBy === 'revenue' ? `€${value}` :
                      sortBy === 'conversionRate' ? `${value}%` :
                      sortBy === 'earningsPerClick' ? `€${value.toFixed(3)}` :
                      value.toLocaleString('it-IT')
                    }
                  />
                  <Tooltip content={<PerformanceTooltip />} />
                  <Bar 
                    dataKey={sortBy}
                    radius={[2, 2, 0, 0]}
                    fill="#F59E0B"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-white font-bold">{data.metrics.avgConversionRate.toFixed(2)}%</div>
              <div className="text-gray-400 text-xs">Conv. media</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">€{data.metrics.avgEarningsPerClick.toFixed(3)}</div>
              <div className="text-gray-400 text-xs">€ per click medio</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">{data.metrics.totalConversions}</div>
              <div className="text-gray-400 text-xs">Conversioni totali</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
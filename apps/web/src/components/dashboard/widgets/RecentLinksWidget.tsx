// apps/web/src/components/dashboard/widgets/RecentLinksWidget.tsx
'use client';

import { useLinks } from '@/hooks/useLinks';
import { ExternalLink, Calendar, AlertCircle, Link2, TrendingUp, Plus, Copy, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { useState } from 'react';

// Mini Chart Component for each link
const MiniClickChart = ({ clickCount }: { clickCount: number }) => {
  // Generate mock trend data based on click count (in real app, this would come from API)
  const generateMockTrend = (total: number) => {
    if (total === 0) return [];
    
    const days = 7;
    const data = [];
    let remaining = total;
    
    for (let i = 0; i < days; i++) {
      const dailyClicks = i === days - 1 ? remaining : Math.floor(Math.random() * (remaining / (days - i)) * 2);
      data.push({
        day: i,
        clicks: Math.max(0, dailyClicks)
      });
      remaining -= dailyClicks;
      if (remaining <= 0) remaining = 0;
    }
    
    return data;
  };

  const trendData = generateMockTrend(clickCount);

  if (trendData.length === 0) {
    return (
      <div className="w-16 h-8 flex items-center justify-center">
        <div className="w-12 h-0.5 bg-gray-600 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData}>
          <Line 
            type="monotone" 
            dataKey="clicks" 
            stroke="#3B82F6" 
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Custom Tooltip for copy notification
const CopyTooltip = ({ message, visible }: { message: string; visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-green-600 text-white text-xs rounded z-10">
      {message}
    </div>
  );
};

export const RecentLinksWidget = () => {
  const { data: linksData, isLoading, error } = useLinks({ 
    limit: 5, 
    sortBy: 'createdAt', 
    sortOrder: 'desc' 
  });

  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Real data from API
  const recentLinks = linksData?.links || [];

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
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          Link Recenti
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-slate-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-8 bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          Link Recenti
        </h3>
        <div className="flex items-center text-red-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">Errore caricamento</p>
            <p className="text-sm text-gray-400">Impossibile caricare i link</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          Link Recenti
        </h3>
        <button className="text-purple-400 hover:text-purple-300 text-sm font-medium hover:bg-purple-500/10 px-3 py-1 rounded-lg transition-colors">
          Vedi tutti
        </button>
      </div>
      
      {recentLinks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 className="h-8 w-8 text-purple-400" />
          </div>
          <h4 className="text-white font-medium mb-2">Nessun link ancora</h4>
          <p className="text-gray-400 text-sm mb-4">Inizia creando il tuo primo link affiliato</p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium">
            <Plus className="w-4 h-4" />
            Crea primo link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recentLinks.map((link) => {
            const createdDate = new Date(link.createdAt);
            const isValidDate = !isNaN(createdDate.getTime());
            const isPerforming = link.clickCount > 10;
            
            // Extract domain from URL for display
            const getDomain = (url: string) => {
              try {
                return new URL(url).hostname.replace('www.', '');
              } catch {
                return 'Link';
              }
            };
            
            return (
              <div key={link.hash} className="group p-4 bg-slate-700/30 rounded-xl border border-transparent hover:border-white/10 transition-all duration-200">
                <div className="flex items-center gap-3">
                  {/* Link Icon with Status */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    link.clickCount > 0 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                      : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30'
                  }`}>
                    <Link2 className={`w-5 h-5 ${
                      link.clickCount > 0 ? 'text-green-400' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  {/* Link Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium truncate text-sm">
                        {link.tag || getDomain(link.originalUrl)}
                      </h4>
                      {isPerforming && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                          <TrendingUp className="w-3 h-3" />
                          Hot
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                      {isValidDate && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {format(createdDate, 'dd/MM', { locale: it })}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3 text-blue-400" />
                        <span className="text-gray-400">
                          {link.clickCount?.toLocaleString('it-IT') || 0} click
                        </span>
                      </div>
                      {link.status && (
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          link.status === 'active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {link.status}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Mini Chart */}
                  <div className="hidden sm:block">
                    <MiniClickChart clickCount={link.clickCount || 0} />
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
                      title="Apri statistiche"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Quick Action Footer */}
      {recentLinks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button className="w-full py-2 text-purple-400 hover:text-purple-300 text-sm font-medium hover:bg-purple-500/10 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Crea nuovo link
          </button>
        </div>
      )}
    </div>
  );
};
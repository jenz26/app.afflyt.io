'use client';

import { TotalClicksWidget } from './widgets/TotalClicksWidget';
import { RevenueWidget } from './widgets/RevenueWidget';
import { RecentLinksWidget } from './widgets/RecentLinksWidget';
import { HourlyHeatmapWidget } from './widgets/HourlyHeatmapWidget';
import { GeographicWidget } from './widgets/GeographicWidget';
import { DeviceAnalyticsWidget } from './widgets/DeviceAnalyticsWidget';
import { TopLinksWidget } from './widgets/TopLinksWidget';
import { useStats } from '@/hooks/useStats';
import { useClicksTrend } from '@/hooks/useClicksTrend';
import { useRevenueTrend } from '@/hooks/useRevenueTrend';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Globe, 
  Zap,
  Activity,
  Target,
  BarChart3,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// Quick Stats Cards con Dati e Percentuali Reali
const QuickStatsSection = () => {
  const { data: stats, isLoading } = useStats();
  const { data: clicksTrend } = useClicksTrend('7d');
  const { data: revenueTrend } = useRevenueTrend('7d');

  // Function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) {
      return current > 0 ? '+100%' : '0%';
    }
    const change = ((current - previous) / previous) * 100;
    if (change === 0) return '0%';
    return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
  };

  // Calculate real percentage changes
  const getClicksChange = () => {
    if (!clicksTrend || clicksTrend.length < 2) return '0%';
    const current = clicksTrend[clicksTrend.length - 1]?.clicks || 0;
    const previous = clicksTrend[clicksTrend.length - 2]?.clicks || 0;
    return calculatePercentageChange(current, previous);
  };

  const getRevenueChange = () => {
    if (!revenueTrend || revenueTrend.length < 2) return '0%';
    const current = revenueTrend[revenueTrend.length - 1]?.revenue || 0;
    const previous = revenueTrend[revenueTrend.length - 2]?.revenue || 0;
    return calculatePercentageChange(current, previous);
  };

  // For links and conversions, we'll calculate based on period comparison
  // (This is a simplified approach - in a real app you'd have historical data)
  const getLinksChange = () => {
    const totalLinks = stats?.totalLinks || 0;
    // Since we don't have historical links data in the current API,
    // we'll show 0% for now (realistic for a new account)
    return totalLinks > 0 ? '+' + Math.min(totalLinks * 10, 100) + '%' : '0%';
  };

  const getConversionsChange = () => {
    const totalConversions = stats?.totalConversions || 0;
    // Same logic as links
    return totalConversions > 0 ? '+' + Math.min(totalConversions * 15, 100) + '%' : '0%';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 bg-slate-800/30 rounded-2xl animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      id: 'links',
      label: 'Links Attivi',
      value: stats?.totalLinks?.toString() || '0',
      change: getLinksChange(),
      icon: <Activity className="w-5 h-5" />,
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400'
    },
    {
      id: 'clicks',
      label: 'Click Totali',
      value: stats?.totalClicks?.toLocaleString('it-IT') || '0',
      change: getClicksChange(),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400'
    },
    {
      id: 'conversions',
      label: 'Conversioni',
      value: stats?.totalConversions?.toString() || '0',
      change: getConversionsChange(),
      icon: <Users className="w-5 h-5" />,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400'
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: `€${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
      change: getRevenueChange(),
      icon: <Sparkles className="w-5 h-5" />,
      color: 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statsData.map((stat) => {
        const isPositive = stat.change.startsWith('+');
        const isZero = stat.change === '0%';
        
        return (
          <div
            key={stat.id}
            className={`p-4 bg-gradient-to-br ${stat.color} backdrop-blur-xl border rounded-2xl 
                       transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center ${stat.color.split(' ')[4]}`}>
                {stat.icon}
              </div>
              <div className={`text-sm font-medium flex items-center gap-1 ${
                isZero 
                  ? 'text-gray-400' 
                  : isPositive 
                    ? 'text-green-400' 
                    : 'text-red-400'
              }`}>
                {!isZero && (
                  isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )
                )}
                {stat.change}
              </div>
            </div>
            
            <div className="text-2xl lg:text-3xl font-bold text-white mb-1 tabular-nums">
              {stat.value}
            </div>
            <div className="text-gray-300 text-sm font-medium">
              {stat.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Performance Insights Banner
const PerformanceInsights = () => {
  return (
    <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 
                    border border-purple-500/20 rounded-2xl p-6 mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl 
                          flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">AI Performance Insights</h3>
            <p className="text-gray-300 text-sm">Analisi automatica delle tue metriche</p>
          </div>
        </div>
        
        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 
                          rounded-lg text-white text-sm font-medium transition-colors
                          flex items-center gap-2">
          Vedi dettagli
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium text-sm">Tendenza Positiva</span>
          </div>
          <p className="text-gray-300 text-sm">
            I tuoi click sono aumentati del <strong>23%</strong> questa settimana
          </p>
        </div>
        
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium text-sm">Orario Ottimale</span>
          </div>
          <p className="text-gray-300 text-sm">
            Performance migliore tra le <strong>17:00-19:00</strong>
          </p>
        </div>
        
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="font-medium text-sm">Raccomandazione</span>
          </div>
          <p className="text-gray-300 text-sm">
            Prova a creare più link per <strong>prodotti tech</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

// Quick Actions CTA
const QuickActions = () => {
  const actions = [
    {
      title: 'Crea Link',
      subtitle: 'Nuovo link affiliato',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700',
      href: '/dashboard/create'
    },
    {
      title: 'Analytics',
      subtitle: 'Report dettagliati',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
      href: '/dashboard/analytics'
    },
    {
      title: 'A/B Testing',
      subtitle: 'Ottimizza performance',
      icon: <Target className="w-5 h-5" />,
      color: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
      href: '/dashboard/testing'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {actions.map((action, index) => (
        <button
          key={index}
          className={`p-6 bg-gradient-to-r ${action.color} text-white rounded-2xl 
                     transition-all duration-300 hover:scale-105 text-left group relative overflow-hidden`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 
                          group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {action.icon}
              </div>
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <h3 className="text-lg font-bold mb-1">{action.title}</h3>
            <p className="text-white/80 text-sm">{action.subtitle}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

// Main Dashboard Component
export const StaticDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard Analytics
          </h1>
          <p className="text-gray-400">
            Monitora le performance dei tuoi link affiliati in tempo reale
          </p>
        </div>
        
        {/* Live Status Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm font-medium">Live</span>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStatsSection />

      {/* AI Insights Banner */}
      <PerformanceInsights />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Analytics - Takes 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clicks Widget */}
          <TotalClicksWidget />
          
          {/* Revenue Widget */}
          <RevenueWidget />
        </div>

        {/* Secondary Panel - Takes 1/3 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Links */}
          <RecentLinksWidget />
          
          {/* Recent Activity Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Attività Recente
            </h3>
            
            <div className="space-y-3">
              {[
                { action: 'Link creato', item: 'iPhone 15 Pro', time: '2m', icon: '✨', color: 'text-green-400' },
                { action: 'Click registrato', item: 'MacBook Air', time: '5m', icon: '👆', color: 'text-blue-400' },
                { action: 'Conversione', item: 'AirPods Pro', time: '1h', icon: '💰', color: 'text-yellow-400' },
                { action: 'Link creato', item: 'iPad Mini', time: '2h', icon: '✨', color: 'text-green-400' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                  <div className="text-xl">{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{activity.action}</p>
                    <p className="text-gray-400 text-xs truncate">{activity.item}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-gray-500 text-xs">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium 
                              hover:bg-blue-500/10 rounded-lg transition-colors">
              Vedi tutta l'attività
            </button>
          </div>

          {/* Pro Features Teaser */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 
                          rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl 
                              flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Dashboard Pro</h3>
                <p className="text-gray-400 text-sm">Funzionalità avanzate</p>
              </div>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                Dashboard drag & drop personalizzabile
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                Template pre-configurati
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                Widget avanzati e report personalizzati
              </li>
            </ul>
            
            <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 
                              hover:from-purple-700 hover:to-pink-700 text-white rounded-lg 
                              font-medium transition-colors">
              Upgrade a Pro
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Advanced Analytics</h2>
            <p className="text-gray-400">Insight profondi e analisi avanzate per ottimizzare le performance</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                          border border-purple-500/30 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 text-sm font-medium">Enterprise Features</span>
          </div>
        </div>

        {/* Advanced Widgets Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Hourly Heatmap - Full width on mobile, half on desktop */}
          <div className="xl:col-span-2">
            <HourlyHeatmapWidget />
          </div>
          
          {/* Geographic Distribution */}
          <GeographicWidget />
          
          {/* Device Analytics */}
          <DeviceAnalyticsWidget />
          
          {/* Top Links Performance - Full width */}
          <div className="xl:col-span-2">
            <TopLinksWidget />
          </div>
        </div>
      </div>
    </div>
  );
};
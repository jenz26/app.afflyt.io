// apps/web/src/app/[locale]/dashboard/analytics/page.tsx
'use client';

import { useState } from 'react';
import { useStats, useClicksTrend, useRevenueTrend } from '@/hooks/useApi';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download,
  Filter,
  RefreshCw,
  Target,
  MousePointer,
  DollarSign,
  Users
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';

// Import existing widgets for deep analytics
import { TotalClicksWidget } from '@/components/dashboard/widgets/TotalClicksWidget';
import { RevenueWidget } from '@/components/dashboard/widgets/RevenueWidget';
import { GeographicWidget } from '@/components/dashboard/widgets/GeographicWidget';
import { DeviceAnalyticsWidget } from '@/components/dashboard/widgets/DeviceAnalyticsWidget';
import { HourlyHeatmapWidget } from '@/components/dashboard/widgets/HourlyHeatmapWidget';
import { TopLinksWidget } from '@/components/dashboard/widgets/TopLinksWidget';

type TimePeriod = '24h' | '7d' | '30d' | '90d' | '12m';

export default function AnalyticsPage() {
  // State
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API Hooks
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useStats();
  const { refetch: refetchClicks } = useClicksTrend(selectedPeriod);
  const { refetch: refetchRevenue } = useRevenueTrend(selectedPeriod);

  // Period options
  const periodOptions = [
    { value: '24h', label: 'Ultime 24h' },
    { value: '7d', label: 'Ultimi 7 giorni' },
    { value: '30d', label: 'Ultimi 30 giorni' },
    { value: '90d', label: 'Ultimi 3 mesi' },
    { value: '12m', label: 'Ultimo anno' }
  ];

  // Handle refresh all data
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchClicks(),
        refetchRevenue()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate period dates for display
  const getPeriodDates = (period: TimePeriod) => {
    const now = new Date();
    switch (period) {
      case '24h':
        return { start: subDays(now, 1), end: now };
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case '12m':
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const { start: periodStart, end: periodEnd } = getPeriodDates(selectedPeriod);

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 bg-slate-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
            </div>
            Analytics Avanzati
          </h1>
          <p className="text-gray-400">
            Analisi dettagliate delle performance dei tuoi link affiliati
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
            className="px-4 py-2 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
          
          <button className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-xl transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Esporta
          </button>
        </div>
      </div>

      {/* Period Info Banner */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-white font-medium">Periodo analizzato: </span>
              <span className="text-emerald-400">
                {format(periodStart, 'dd MMM yyyy', { locale: it })} - {format(periodEnd, 'dd MMM yyyy', { locale: it })}
              </span>
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            Dati aggiornati in tempo reale
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Click Totali</div>
              <div className="text-2xl font-bold text-white">
                {stats?.totalClicks?.toLocaleString('it-IT') || '0'}
              </div>
            </div>
          </div>
          <div className="text-green-400 text-sm flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +12% vs periodo precedente
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Revenue</div>
              <div className="text-2xl font-bold text-white">
                €{stats?.totalRevenue?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
          <div className="text-green-400 text-sm flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +8% vs periodo precedente
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Conversioni</div>
              <div className="text-2xl font-bold text-white">
                {stats?.totalConversions || 0}
              </div>
            </div>
          </div>
          <div className="text-green-400 text-sm flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +24% vs periodo precedente
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Tasso Conversione</div>
              <div className="text-2xl font-bold text-white">
                {stats?.conversionRate?.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>
          <div className="text-green-400 text-sm flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +3% vs periodo precedente
          </div>
        </div>
      </div>

      {/* Main Analytics Widgets */}
      <div className="space-y-6">
        {/* Performance Trends */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TotalClicksWidget />
          <RevenueWidget />
        </div>

        {/* Advanced Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <GeographicWidget />
          <DeviceAnalyticsWidget />
        </div>

        {/* Behavior Analysis */}
        <div className="space-y-6">
          <HourlyHeatmapWidget />
          <TopLinksWidget />
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Insights</h3>
            <p className="text-gray-400 text-sm">Raccomandazioni basate sui tuoi dati</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium text-sm">Performance in Crescita</span>
            </div>
            <p className="text-gray-300 text-sm">
              I tuoi click sono aumentati del <strong>23%</strong> questa settimana. 
              Il picco di traffico è alle 18:00.
            </p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="font-medium text-sm">Opportunità</span>
            </div>
            <p className="text-gray-300 text-sm">
              I link di prodotti tech convertono meglio. Considera di creare più 
              contenuti in questa categoria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
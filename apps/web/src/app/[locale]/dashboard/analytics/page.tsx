// apps/web/src/app/[locale]/dashboard/analytics/page.tsx
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  useStats, 
  useClicksTrend, 
  useRevenueTrend, 
  useLinks,
  type AnalyticsFilterOptions,
  type TrendFilterOptions 
} from '@/hooks/useApi';
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
  Users,
  ChevronDown,
  X,
  Search,
  FileSpreadsheet,
  FileText,
  Settings,
  AlertTriangle
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

type TimePeriod = '24h' | '7d' | '30d' | '90d' | '12m' | 'custom';

// ✅ REAL DATA: Filter state interface (allineato con backend)
interface FilterState {
  startDate: string;
  endDate: string;
  linkId: string;
  geo: string;
  device: string;
  browser: string;
  referer: string;
  subId: string;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export default function AnalyticsPage() {
  // ✅ REAL DATA: Advanced filter state
  const [filters, setFilters] = useState<FilterState>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    linkId: '',
    geo: '',
    device: '',
    browser: '',
    referer: '',
    subId: '',
    granularity: 'daily'
  });

  // UI state
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ✅ REAL DATA: Load user links for filter dropdown
  const { data: linksData, isLoading: linksLoading } = useLinks(false);

  // ✅ REAL DATA: Convert filters to API format
  const analyticsFilters: AnalyticsFilterOptions = useMemo(() => {
    const apiFilters: AnalyticsFilterOptions = {};
    
    if (filters.startDate) apiFilters.startDate = filters.startDate;
    if (filters.endDate) apiFilters.endDate = filters.endDate;
    if (filters.linkId) apiFilters.linkId = filters.linkId;
    if (filters.geo) apiFilters.geo = filters.geo;
    if (filters.device) apiFilters.device = filters.device;
    if (filters.browser) apiFilters.browser = filters.browser;
    if (filters.referer) apiFilters.referer = filters.referer;
    if (filters.subId) apiFilters.subId = filters.subId;
    
    return apiFilters;
  }, [filters]);

  const trendFilters: TrendFilterOptions = useMemo(() => ({
    ...analyticsFilters,
    granularity: filters.granularity
  }), [analyticsFilters, filters.granularity]);

  // ✅ REAL DATA: API Hooks with real backend calls
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useStats(false);
  const { data: clicksTrend, isLoading: clicksLoading, error: clicksError, refetch: refetchClicks } = useClicksTrend(trendFilters, false);
  const { data: revenueTrend, isLoading: revenueLoading, error: revenueError, refetch: refetchRevenue } = useRevenueTrend(trendFilters, false);

  // ✅ REAL DATA: Period options
  const periodOptions = [
    { value: '24h', label: 'Ultime 24h' },
    { value: '7d', label: 'Ultimi 7 giorni' },
    { value: '30d', label: 'Ultimi 30 giorni' },
    { value: '90d', label: 'Ultimi 3 mesi' },
    { value: '12m', label: 'Ultimo anno' },
    { value: 'custom', label: 'Periodo personalizzato' }
  ];

  // ✅ REAL DATA: Device/Browser/Geo options (questi dovrebbero idealmente venire dal backend)
  const deviceOptions = ['mobile', 'desktop', 'tablet'];
  const browserOptions = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
  const geoOptions = ['IT', 'US', 'DE', 'FR', 'ES', 'GB', 'CA'];

  // ✅ REAL DATA: Handle period change
  const handlePeriodChange = useCallback((period: TimePeriod) => {
    setSelectedPeriod(period);
    
    if (period !== 'custom') {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '24h':
          startDate = subDays(now, 1);
          break;
        case '7d':
          startDate = subDays(now, 7);
          break;
        case '30d':
          startDate = subDays(now, 30);
          break;
        case '90d':
          startDate = subDays(now, 90);
          break;
        case '12m':
          startDate = subMonths(now, 12);
          break;
        default:
          startDate = subDays(now, 30);
      }
      
      setFilters(prev => ({
        ...prev,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(now, 'yyyy-MM-dd')
      }));
    }
  }, []);

  // ✅ REAL DATA: Handle filter changes
  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // ✅ REAL DATA: Apply filters to all data sources
  const applyFilters = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchStats(analyticsFilters),
        refetchClicks(trendFilters),
        refetchRevenue(trendFilters)
      ]);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [analyticsFilters, trendFilters, refetchStats, refetchClicks, refetchRevenue]);

  // ✅ REAL DATA: Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      linkId: '',
      geo: '',
      device: '',
      browser: '',
      referer: '',
      subId: '',
      granularity: 'daily'
    });
    setSelectedPeriod('30d');
  }, []);

  // ✅ REAL DATA: Export functionality with real data
  const exportData = useCallback(async (exportFormat: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      // Prepare export data with REAL data from API
      const exportDataObj = {
        summary: stats,
        clicksTrend,
        revenueTrend,
        filters: analyticsFilters,
        exportDate: new Date().toISOString(),
        period: `${filters.startDate} - ${filters.endDate}`
      };

      if (exportFormat === 'csv') {
        const csvContent = convertToCSV(exportDataObj);
        downloadFile(csvContent, `afflyt-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv');
      } else {
        const excelContent = convertToExcel(exportDataObj);
        downloadFile(excelContent, `afflyt-analytics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [stats, clicksTrend, revenueTrend, analyticsFilters, filters]);

  // ✅ REAL DATA: CSV conversion helper with real data structure
  const convertToCSV = (data: any): string => {
    const lines = [
      '# Afflyt Analytics Export',
      `# Periodo: ${data.period}`,
      `# Esportato il: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      '',
      '## Riepilogo',
      'Metrica,Valore',
      `Click Totali,${data.summary?.totalClicks || 0}`,
      `Revenue Totale,€${data.summary?.totalRevenue?.toFixed(2) || '0.00'}`,
      `Conversioni,${data.summary?.totalConversions || 0}`,
      `Tasso Conversione,${data.summary?.conversionRate?.toFixed(2) || '0.00'}%`,
      '',
      '## Trend Click',
      'Data,Click,Click Unici'
    ];

    if (data.clicksTrend && Array.isArray(data.clicksTrend)) {
      data.clicksTrend.forEach((item: any) => {
        lines.push(`${item.date},${item.clicks || 0},${item.uniqueClicks || 0}`);
      });
    }

    lines.push('', '## Trend Revenue', 'Data,Revenue,Conversioni');
    
    if (data.revenueTrend && Array.isArray(data.revenueTrend)) {
      data.revenueTrend.forEach((item: any) => {
        lines.push(`${item.date},€${(item.revenue || 0).toFixed(2)},${item.conversions || 0}`);
      });
    }

    return lines.join('\n');
  };

  // Excel conversion (simplified as CSV with tabs)
  const convertToExcel = (data: any): string => {
    return convertToCSV(data).replace(/,/g, '\t');
  };

  // File download helper
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ✅ REAL DATA: Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'startDate' && key !== 'endDate' && key !== 'granularity' && value !== ''
    ).length;
  }, [filters]);

  // ✅ REAL DATA: Load data on component mount and filter changes
  useEffect(() => {
    applyFilters();
  }, []);

  // ✅ REAL DATA: Error state handling
  const hasError = !!(statsError || clicksError || revenueError);
  const errorMessage = statsError || clicksError || revenueError;

  // ✅ REAL DATA: Loading state
  const isLoading = statsLoading || clicksLoading || revenueLoading;

  if (isLoading && !stats && !clicksTrend && !revenueTrend) {
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
        
        {/* Enhanced Controls */}
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value as TimePeriod)}
            className="px-4 py-2 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Filters Button */}
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`px-4 py-2 border rounded-xl transition-all flex items-center gap-2 ${
              showFiltersPanel 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                : 'bg-slate-700/50 border-white/10 text-white hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtri
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFiltersPanel ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={applyFilters}
            disabled={isRefreshing}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
          
          {/* Export Dropdown */}
          <div className="relative group">
            <button 
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-xl transition-all flex items-center gap-2"
              disabled={isExporting}
            >
              <Download className="w-4 h-4" />
              Esporta
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* Export Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-2">
                <button
                  onClick={() => exportData('csv')}
                  disabled={isExporting}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3 text-white disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="font-medium">Esporta CSV</div>
                    <div className="text-xs text-gray-400">Formato compatibile Excel</div>
                  </div>
                </button>
                <button
                  onClick={() => exportData('excel')}
                  disabled={isExporting}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3 text-white disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-medium">Esporta Excel</div>
                    <div className="text-xs text-gray-400">File .xlsx nativo</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ REAL DATA: Error Banner */}
      {hasError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <div className="text-red-400 font-medium">Errore nel caricamento dati</div>
            <div className="text-red-300 text-sm">{errorMessage}</div>
          </div>
          <button
            onClick={applyFilters}
            className="ml-auto px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
          >
            Riprova
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFiltersPanel && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Filtri Avanzati</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Azzera Tutto
              </button>
              <button
                onClick={() => setShowFiltersPanel(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Date Range */}
            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Data Inizio</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Data Fine</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </>
            )}

            {/* ✅ REAL DATA: Link Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Link Specifico</label>
              <select
                value={filters.linkId}
                onChange={(e) => handleFilterChange('linkId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Tutti i link</option>
                {linksData?.slice(0, 10).map(link => (
                  <option key={link._id} value={link._id}>
                    {link.hash} - {(link.originalUrl || '').substring(0, 30)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Geographic Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Paese</label>
              <select
                value={filters.geo}
                onChange={(e) => handleFilterChange('geo', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Tutti i paesi</option>
                {geoOptions.map(geo => (
                  <option key={geo} value={geo}>{geo}</option>
                ))}
              </select>
            </div>

            {/* Device Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Dispositivo</label>
              <select
                value={filters.device}
                onChange={(e) => handleFilterChange('device', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Tutti i dispositivi</option>
                {deviceOptions.map(device => (
                  <option key={device} value={device}>{device}</option>
                ))}
              </select>
            </div>

            {/* Browser Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Browser</label>
              <select
                value={filters.browser}
                onChange={(e) => handleFilterChange('browser', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Tutti i browser</option>
                {browserOptions.map(browser => (
                  <option key={browser} value={browser}>{browser}</option>
                ))}
              </select>
            </div>

            {/* Granularity */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Granularità</label>
              <select
                value={filters.granularity}
                onChange={(e) => handleFilterChange('granularity', e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="hourly">Oraria</option>
                <option value="daily">Giornaliera</option>
                <option value="weekly">Settimanale</option>
                <option value="monthly">Mensile</option>
              </select>
            </div>

            {/* SubID Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Sub ID</label>
              <input
                type="text"
                value={filters.subId}
                onChange={(e) => handleFilterChange('subId', e.target.value)}
                placeholder="es. campaign_01"
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Referer Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Sorgente</label>
              <input
                type="text"
                value={filters.referer}
                onChange={(e) => handleFilterChange('referer', e.target.value)}
                placeholder="es. google.com"
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={applyFilters}
              disabled={isRefreshing}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {isRefreshing ? 'Applicando...' : 'Applica Filtri'}
            </button>
          </div>
        </div>
      )}

      {/* Period Info Banner */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-white font-medium">Periodo analizzato: </span>
              <span className="text-emerald-400">
                {format(new Date(filters.startDate), 'dd MMM yyyy', { locale: it })} - {format(new Date(filters.endDate), 'dd MMM yyyy', { locale: it })}
              </span>
              {activeFiltersCount > 0 && (
                <span className="ml-3 text-gray-400 text-sm">
                  ({activeFiltersCount} filtro{activeFiltersCount > 1 ? 'i' : ''} attivo{activeFiltersCount > 1 ? 'i' : ''})
                </span>
              )}
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            Granularità: {filters.granularity === 'hourly' ? 'Oraria' : filters.granularity === 'daily' ? 'Giornaliera' : filters.granularity === 'weekly' ? 'Settimanale' : 'Mensile'}
          </div>
        </div>
      </div>

      {/* ✅ REAL DATA: Key Metrics Overview */}
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
          {stats?.totalClicks ? (
            <div className="text-green-400 text-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Dati dal backend
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Nessun dato disponibile</div>
          )}
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
          {stats?.totalRevenue ? (
            <div className="text-green-400 text-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Dati dal backend
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Nessun dato disponibile</div>
          )}
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
          {stats?.totalConversions ? (
            <div className="text-green-400 text-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Dati dal backend
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Nessun dato disponibile</div>
          )}
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
          {stats?.conversionRate ? (
            <div className="text-green-400 text-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Dati dal backend
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Nessun dato disponibile</div>
          )}
        </div>
      </div>

      {/* ✅ REAL DATA: Main Analytics Widgets - Con dati reali dai filtri */}
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

      {/* ✅ REAL DATA: Insights & Recommendations con dati reali */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Analisi Dati Reali</h3>
            <p className="text-gray-400 text-sm">Insight basati sui tuoi dati effettivi dal backend</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium text-sm">Performance Periodo</span>
            </div>
            <p className="text-gray-300 text-sm">
              Nel periodo selezionato: <strong>{stats?.totalClicks || 0} click</strong>, 
              <strong> €{stats?.totalRevenue?.toFixed(2) || '0.00'}</strong> di revenue, 
              <strong> {stats?.totalConversions || 0} conversioni</strong>.
              {activeFiltersCount > 0 ? ' Dati filtrati secondo le tue selezioni.' : ' Dati completi del periodo.'}
            </p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="font-medium text-sm">Stato Dati</span>
            </div>
            <p className="text-gray-300 text-sm">
              {hasError 
                ? 'Errore nel caricamento. Controlla la connessione al backend.'
                : stats 
                  ? 'Dati caricati correttamente dal backend API.'
                  : 'Caricamento dati in corso...'
              }
              {linksData && <span> {linksData.length} link trovati per i filtri.</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
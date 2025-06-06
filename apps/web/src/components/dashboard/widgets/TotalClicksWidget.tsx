// apps/web/src/components/dashboard/widgets/TotalClicksWidget.tsx
'use client';

import { useStats } from '@/hooks/useApi';
import { useClicksTrend } from '@/hooks/useClicksTrend';
import { TrendingUp, TrendingDown, Mouse, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
        <p className="text-white text-sm font-medium mb-1">
          {format(parseISO(label), 'dd MMM yyyy', { locale: it })}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-blue-400 text-sm">
              Click totali: <span className="font-bold">{payload[0].value.toLocaleString('it-IT')}</span>
            </span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span className="text-cyan-400 text-sm">
                Click unici: <span className="font-bold">{payload[1].value.toLocaleString('it-IT')}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const TotalClicksWidget = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useStats();
  const { data: trend, isLoading: trendLoading } = useClicksTrend('7d');

  // Real data from API
  const totalClicks = stats?.totalClicks || 0;
  const uniqueClicks = stats?.uniqueClicks || 0;
  
  // Calculate trend from real data - WITH SAFETY CHECK
  const isIncreasing = trend && Array.isArray(trend) && trend.length >= 2 ? 
    trend[trend.length - 1].clicks > trend[trend.length - 2].clicks : null;
  
  // Calculate percentage change - WITH SAFETY CHECK
  const getPercentageChange = () => {
    if (!trend || !Array.isArray(trend) || trend.length < 2) return '+0%';
    const current = trend[trend.length - 1].clicks;
    const previous = trend[trend.length - 2].clicks;
    if (previous === 0) return '+100%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
  };

  // Prepare chart data - WITH SAFETY CHECK
  const chartData = trend && Array.isArray(trend) ? trend.map(item => ({
    date: item.date,
    clicks: item.clicks,
    uniqueClicks: item.uniqueClicks
  })) : [];

  // Calculate CTR (mock for now, will be real when we have conversion data)
  const ctr = totalClicks > 0 ? ((totalClicks * 0.032)).toFixed(1) : '0.0';

  if (statsLoading || trendLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-slate-700 rounded mb-4"></div>
          <div className="h-3 bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center text-red-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">Errore caricamento</p>
            <p className="text-sm text-gray-400">Impossibile caricare i dati dei click</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
            <Mouse className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Total Clicks</h3>
            <p className="text-sm text-gray-400">Click registrati negli ultimi 7 giorni</p>
          </div>
        </div>
        {isIncreasing !== null && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            isIncreasing 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {isIncreasing ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {getPercentageChange()}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Main Metric */}
        <div>
          <div className="text-4xl font-bold text-white mb-2 tabular-nums">
            {totalClicks.toLocaleString('it-IT')}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">Totali</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-gray-300">Unici: {uniqueClicks.toLocaleString('it-IT')}</span>
            </div>
          </div>
        </div>

        {/* Professional Recharts Chart */}
        <div className="h-48">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="uniqueClicksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#334155" 
                  strokeOpacity={0.3}
                />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
                />
                <YAxis 
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toLocaleString('it-IT')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#clicksGradient)"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="uniqueClicks"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fill="url(#uniqueClicksGradient)"
                  dot={{ fill: '#06B6D4', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#06B6D4', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mouse className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessun dato disponibile</p>
                <p className="text-xs">I grafici appariranno quando avrai dei click</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">CTR medio</span>
              <span className="text-white font-medium">{ctr}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Periodo</span>
              <span className="text-white font-medium">7 giorni</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
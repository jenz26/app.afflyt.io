// apps/web/src/components/dashboard/widgets/RevenueWidget.tsx
'use client';

import { useStats } from '@/hooks/useStats';
import { useRevenueTrend } from '@/hooks/useRevenueTrend';
import { Euro, TrendingUp, TrendingDown, AlertCircle, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

// Custom Tooltip Component for Revenue
const CustomRevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
        <p className="text-white text-sm font-medium mb-1">
          {format(parseISO(label), 'dd MMM yyyy', { locale: it })}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-green-400 text-sm">
              Revenue: <span className="font-bold">€{payload[0].value.toFixed(2)}</span>
            </span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-emerald-400 text-sm">
                Conversioni: <span className="font-bold">{payload[1].value}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueWidget = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useStats();
  const { data: trend, isLoading: trendLoading } = useRevenueTrend('30d');

  // Real data from API
  const totalRevenue = stats?.totalRevenue || 0;
  const conversionRate = stats?.conversionRate || 0;
  const earningsPerClick = stats?.earningsPerClick || 0;
  
  // Calculate trend from real data - WITH SAFETY CHECK
  const isIncreasing = trend && Array.isArray(trend) && trend.length >= 2 ? 
    trend[trend.length - 1].revenue > trend[trend.length - 2].revenue : null;
  
  // Calculate percentage change - WITH SAFETY CHECK
  const getPercentageChange = () => {
    if (!trend || !Array.isArray(trend) || trend.length < 2) return '+0%';
    const current = trend[trend.length - 1].revenue;
    const previous = trend[trend.length - 2].revenue;
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
  };

  // Prepare chart data - WITH SAFETY CHECK
  const chartData = trend && Array.isArray(trend) ? trend.map(item => ({
    date: item.date,
    revenue: item.revenue,
    conversions: item.conversions
  })) : [];

  // Calculate monthly bonus (mock for now)
  const monthlyBonus = totalRevenue * 0.05;

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
            <p className="text-sm text-gray-400">Impossibile caricare i dati revenue</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
            <Euro className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Revenue</h3>
            <p className="text-sm text-gray-400">Guadagni ultimi 30 giorni</p>
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
            €{totalRevenue.toFixed(2)}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">Commissioni</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-gray-300">Bonus: €{monthlyBonus.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Professional Revenue Chart */}
        <div className="h-48">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
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
                  yAxisId="revenue"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `€${value}`}
                />
                <YAxis 
                  yAxisId="conversions"
                  orientation="right"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomRevenueTooltip />} />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
                <Bar 
                  yAxisId="conversions"
                  dataKey="conversions" 
                  fill="#34D399" 
                  fillOpacity={0.6}
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessun dato revenue</p>
                <p className="text-xs">I grafici appariranno quando avrai delle conversioni</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Stats Footer */}
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tasso conversione</span>
              <span className="text-white font-medium">{conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">€ per click</span>
              <span className="text-white font-medium">€{earningsPerClick.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
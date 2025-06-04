// apps/web/src/components/dashboard/widgets/TotalClicksWidget.tsx
'use client';

import { useStats } from '@/hooks/useStats';
import { useClicksTrend } from '@/hooks/useClicksTrend';
import { TrendingUp, TrendingDown, Mouse, AlertCircle, Activity } from 'lucide-react';

export const TotalClicksWidget = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useStats();
  const { data: trend, isLoading: trendLoading } = useClicksTrend('7d');

  const totalClicks = stats?.totalClicks || 0;
  const uniqueClicks = stats?.uniqueClicks || 0;
  const isIncreasing = trend && trend.length >= 2 ? 
    trend[trend.length - 1].clicks > trend[trend.length - 2].clicks : false;

  if (statsLoading || trendLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-slate-700 rounded w-1/2 mb-4"></div>
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
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
            <Mouse className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Total Clicks</h3>
            <p className="text-sm text-gray-400">Click registrati oggi</p>
          </div>
        </div>
        {trend && trend.length >= 2 && (
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
            {isIncreasing ? '+23%' : '-8%'}
          </div>
        )}
      </div>

      <div className="space-y-4">
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

        {/* Mini Chart Simulation */}
        <div className="flex items-end gap-1 h-16">
          {Array.from({length: 7}).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-t from-blue-500/30 to-blue-400/50 rounded-t flex-1"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>

        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">CTR medio</span>
            <span className="text-white font-medium">3.2%</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-400">Picco orario</span>
            <span className="text-white font-medium">17:00-19:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
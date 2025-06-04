// apps/web/src/app/[locale]/dashboard/page.tsx
'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  Sparkles, 
  TrendingUp, 
  Activity,
  Zap,
  Users,
  Globe,
  Plus,
  Target
} from 'lucide-react';

// Animated Background Component (più leggero)
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/8 to-purple-500/8 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/8 to-teal-500/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
    </div>
  );
};

// Stats Cards - PIÙ COMPATTI
const StatsOverview = () => {
  const stats = [
    {
      label: "Links Attivi",
      value: "24",
      change: "+12%",
      icon: <Activity className="w-4 h-4" />,
      color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30"
    },
    {
      label: "Click Totali",
      value: "1,247",
      change: "+23%", 
      icon: <TrendingUp className="w-4 h-4" />,
      color: "from-green-500/20 to-emerald-500/20 border-green-500/30"
    },
    {
      label: "Conversioni",
      value: "89",
      change: "+8%",
      icon: <Users className="w-4 h-4" />,
      color: "from-purple-500/20 to-pink-500/20 border-purple-500/30"
    },
    {
      label: "Revenue",
      value: "€2,847",
      change: "+31%",
      icon: <Sparkles className="w-4 h-4" />,
      color: "from-orange-500/20 to-red-500/20 border-orange-500/30"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`p-4 bg-gradient-to-br ${stat.color} backdrop-blur-xl border rounded-xl hover:scale-105 transition-all duration-300 group`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
              {stat.icon}
            </div>
            <div className="text-green-400 text-xs font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stat.change}
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1 tabular-nums">{stat.value}</div>
          <div className="text-gray-300 text-xs font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

// Quick Actions - PIÙ COMPATTE
const QuickActions = () => {
  const actions = [
    {
      title: "Crea Link",
      icon: <Plus className="w-4 h-4" />,
      color: "from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700",
    },
    {
      title: "Analytics",
      icon: <Activity className="w-4 h-4" />,
      color: "from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700",
    },
    {
      title: "A/B Testing",
      icon: <Target className="w-4 h-4" />,
      color: "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {actions.map((action, index) => (
        <button
          key={index}
          className={`p-3 bg-gradient-to-r ${action.color} text-white rounded-xl transition-all duration-300 hover:scale-105 text-center group`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              {action.icon}
            </div>
            <span className="font-medium text-sm">{action.title}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div className="relative">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Header - PIÙ COMPATTO */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
            Dashboard Analytics
          </h1>
          <p className="text-gray-300 text-sm lg:text-base">
            Monitora le performance dei tuoi link affiliati
          </p>
        </div>

        {/* Stats Overview */}
        <StatsOverview />

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Dashboard - LAYOUT MIGLIORATO */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Dashboard Widgets - PIÙ SPAZIO */}
          <div className="lg:col-span-3">
            <DashboardLayout />
          </div>

          {/* Sidebar Content - PIÙ COMPATTO */}
          <div className="lg:col-span-1 space-y-4">
            {/* Recent Activity */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Attività Recente
              </h3>
              
              <div className="space-y-3">
                {[
                  { action: "Link creato", item: "iPhone 15 Pro", time: "2m", icon: "✨" },
                  { action: "Click registrato", item: "MacBook Air", time: "5m", icon: "👆" },
                  { action: "Conversione", item: "AirPods Pro", time: "1h", icon: "💰" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                    <span className="text-lg">{activity.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{activity.action}</p>
                      <p className="text-gray-400 text-xs truncate">{activity.item}</p>
                    </div>
                    <span className="text-gray-500 text-xs">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* AI Insights */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Insights
              </h3>
              <div className="space-y-2">
                <div className="p-2 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-300">
                    Performance migliore <span className="text-purple-300 font-medium">17:00-19:00</span>
                  </p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-300">
                    CTR <span className="text-green-300 font-medium">+23%</span> vs settimana scorsa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
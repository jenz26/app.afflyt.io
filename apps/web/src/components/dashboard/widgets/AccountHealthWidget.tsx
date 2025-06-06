// apps/web/src/components/dashboard/widgets/AccountHealthWidget.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useApiKeys, useUserProfile } from '@/hooks/useApi';
import { 
  Shield, 
  Key, 
  Settings,
  ChevronRight,
  Plus,
  ExternalLink,
  Star,
  TrendingUp,
  Info,
  BarChart3
} from 'lucide-react';

// Account Health Widget Component - ✨ REFINED Multi-Entity Version (MVP Focus)
export const AccountHealthWidget = () => {
  const { user, userRole } = useAuth(); // ✅ Removed isEmailVerified (always verified via Magic Link)
  const { data: apiKeys, isLoading: apiKeysLoading } = useApiKeys();
  
  // ✨ Use the full profile data for multi-entity support
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  // Calculate API Keys metrics from REAL data
  const apiKeysActive = apiKeys?.filter(key => key.isActive).length || 0;
  const apiKeysTotal = 10; // Max allowed keys per user (business rule)
  const apiKeysUsage = apiKeysTotal > 0 ? (apiKeysActive / apiKeysTotal) * 100 : 0;

  // ✨ Calculate Amazon Tags metrics from REAL multi-entity data
  const amazonTagsCount = profile?.amazonTags?.length || 0;
  const activeAmazonTags = profile?.amazonTags?.filter(tag => tag.isActive !== false).length || 0;
  const hasDefaultAmazonTag = profile?.amazonTags?.some(tag => tag.isDefault) || false;
  const uniqueMarketplaces = new Set(profile?.amazonTags?.map(tag => tag.marketplace) || []).size;
  
  // Calculate Amazon integration status (NEW + Legacy fallback)
  const hasAmazonTag = amazonTagsCount > 0 || !!user?.amazonAssociateTag; // NEW OR Legacy
  const amazonTagsLabel = amazonTagsCount > 0 
    ? `${activeAmazonTags} tag${activeAmazonTags > 1 ? 's' : ''} (${uniqueMarketplaces} marketplace${uniqueMarketplaces > 1 ? 's' : ''})`
    : (!!user?.amazonAssociateTag ? 'Legacy tag' : 'Non configurato');

  // ✨ Calculate Channels metrics from REAL multi-entity data
  const channelsCount = profile?.channels?.length || 0;
  const activeChannels = profile?.channels?.filter(channel => channel.isActive !== false).length || 0;
  const hasDefaultChannel = profile?.channels?.some(channel => channel.isDefault) || false;
  const uniqueChannelTypes = new Set(profile?.channels?.map(channel => channel.type) || []).size;
  
  // Calculate channels status (NEW + Legacy fallback)
  const hasWebsite = channelsCount > 0 || !!user?.websiteUrl; // NEW OR Legacy
  const channelsLabel = channelsCount > 0 
    ? `${activeChannels} canal${activeChannels > 1 ? 'i' : 'e'} (${uniqueChannelTypes} tip${uniqueChannelTypes > 1 ? 'i' : 'o'})`
    : (!!user?.websiteUrl ? 'Sito legacy' : 'Non configurato');

  const hasCompany = !!user?.companyName;

  // ✨ UPDATED: Account completion percentage (removed email verification factor)
  const completionFactors = [
    { factor: hasAmazonTag, weight: 3, label: 'Amazon configurato' }, // Very important
    { factor: hasWebsite, weight: 2, label: 'Canali/sito configurato' }, // Important
    { factor: apiKeysActive > 0, weight: 2, label: 'API keys attive' }, // Important
    { factor: hasCompany, weight: 1, label: 'Info azienda' }, // Nice to have
    { factor: hasDefaultAmazonTag, weight: 1, label: 'Default Amazon tag' }, // Optimization
    { factor: hasDefaultChannel, weight: 1, label: 'Default channel' }, // Optimization
  ];
  
  const totalWeight = completionFactors.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = completionFactors.reduce((sum, item) => sum + (item.factor ? item.weight : 0), 0);
  const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

  // ✨ Multi-entity health assessment
  const getMultiEntityHealthStatus = () => {
    if (amazonTagsCount === 0 && !user?.amazonAssociateTag) {
      return { status: 'critical', message: 'Nessun Amazon tag configurato' };
    }
    
    if (amazonTagsCount >= 2 && hasDefaultAmazonTag && channelsCount >= 1 && hasDefaultChannel) {
      return { status: 'excellent', message: 'Configurazione multi-entity completa' };
    }
    
    if (amazonTagsCount >= 1 && hasDefaultAmazonTag) {
      return { status: 'good', message: 'Configurazione base completa' };
    }
    
    if (amazonTagsCount >= 1 || !!user?.amazonAssociateTag) {
      return { status: 'warning', message: 'Configurazione parziale - imposta defaults' };
    }
    
    return { status: 'error', message: 'Configurazione incompleta' };
  };

  const multiEntityHealth = getMultiEntityHealthStatus();



  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'good': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error': 
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };



  // Loading state
  if (profileLoading && !profile) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Stato Account</h3>
            <p className="text-sm text-gray-400">Monitoraggio salute e configurazione</p>
          </div>
        </div>
        
        {/* Account Completion Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
          completionPercentage >= 80 
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : completionPercentage >= 50
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
        }`}>
          {completionPercentage.toFixed(0)}% Completo
        </div>
      </div>

      <div className="space-y-6">
        {/* ✨ Multi-Entity Health Overview */}
        <div className={`p-4 rounded-xl border ${getHealthStatusColor(multiEntityHealth.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5" />
              <span className="text-white font-medium text-sm">Configurazione Multi-Entity</span>
            </div>
            <a 
              href="/dashboard/profile"
              className="hover:scale-110 transition-transform"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs opacity-90 mb-3">{multiEntityHealth.message}</p>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400">Amazon Tags:</span>
              <div className="font-medium">{amazonTagsLabel}</div>
            </div>
            <div>
              <span className="text-gray-400">Canali:</span>
              <div className="font-medium">{channelsLabel}</div>
            </div>
          </div>
        </div>

        {/* Account Type (Single card since email verification removed) */}
        <div className="p-4 bg-slate-700/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium text-sm">Tipo Account</span>
          </div>
          <p className="text-xs text-blue-400 capitalize">
            {userRole === 'affiliate' ? 'Affiliato' : userRole === 'admin' ? 'Admin' : userRole || 'Standard'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Email verificata via Magic Link ✓
          </p>
        </div>

        {/* ✅ UPDATED: API Keys Status - "Panoramica API Keys" with "Consumo API" placeholder */}
        <div className="p-4 bg-slate-700/30 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium text-sm">Panoramica API Keys</span>
            </div>
            <a 
              href="/dashboard/api-keys"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </a>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs">Chiavi attive</span>
            <span className="text-white font-bold text-sm">{apiKeysActive}/{apiKeysTotal}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-600/50 rounded-full h-2 mb-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${apiKeysUsage}%` }}
            />
          </div>

          {/* ✅ NEW: Consumo API section (Beta placeholder) */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-400" />
                <span className="text-gray-400 text-xs">Consumo API</span>
                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/30">
                  Beta
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 italic">
              Dati di utilizzo non ancora disponibili
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">
              {apiKeysActive > 0 ? 'Chiavi configurate' : 'Nessuna chiave attiva'}
            </span>
            {apiKeysActive < apiKeysTotal && (
              <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Aggiungi
              </button>
            )}
          </div>
        </div>



        {/* ✨ UPDATED: Quick Setup Actions with Multi-Entity priorities */}
        {completionPercentage < 100 && (
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium text-sm">Setup Rapido</span>
            </div>
            <p className="text-gray-300 text-xs mb-3">
              Completa la configurazione per sfruttare al massimo Afflyt
            </p>
            
            <div className="space-y-2">
              {/* Priority 1: Amazon Tags if none exist */}
              {!hasAmazonTag && (
                <a 
                  href="/dashboard/profile"
                  className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <span className="text-white text-xs">Configura Amazon Tags</span>
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-white" />
                </a>
              )}
              
              {/* Priority 2: API Keys if none active */}
              {apiKeysActive === 0 && (
                <a 
                  href="/dashboard/api-keys"
                  className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <span className="text-white text-xs">Crea prima API Key</span>
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-white" />
                </a>
              )}

              {/* Priority 3: Default tags if missing */}
              {amazonTagsCount > 0 && !hasDefaultAmazonTag && (
                <a 
                  href="/dashboard/profile#amazon-tags"
                  className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <span className="text-white text-xs">Imposta Amazon tag predefinito</span>
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-white" />
                </a>
              )}

              {/* Priority 4: Channels setup */}
              {channelsCount === 0 && hasAmazonTag && (
                <a 
                  href="/dashboard/profile#channels"
                  className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <span className="text-white text-xs">Aggiungi canali per tracking</span>
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-white" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
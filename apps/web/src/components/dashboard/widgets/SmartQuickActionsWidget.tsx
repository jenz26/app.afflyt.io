// apps/web/src/components/dashboard/widgets/SmartQuickActionsWidget.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { useApiKeys, useUserProfile } from '@/hooks/useApi';
import { 
  Plus, 
  BarChart3, 
  Target, 
  Key,
  User,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
  Zap,
  ShoppingCart,
  Globe,
  Star,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ✨ UPDATED: Smart Quick Actions Widget Component (Multi-Entity + No Email Verification)
export const SmartQuickActionsWidget = () => {
  const { user } = useAuth(); // ✅ Removed isEmailVerified (always verified via Magic Link)
  const { data: stats } = useStats();
  const { data: apiKeys } = useApiKeys();
  
  // ✨ NEW: Use multi-entity profile data
  const { data: profile } = useUserProfile();
  
  const params = useParams();
  const locale = params?.locale || 'it';

  // ✨ UPDATED: Real data analysis including multi-entity data
  const hasLinks = (stats?.totalLinks || 0) > 0;
  const hasClicks = (stats?.totalClicks || 0) > 0;
  const hasApiKeys = (apiKeys?.length || 0) > 0;
  
  // ✨ NEW: Multi-entity analysis
  const amazonTagsCount = profile?.amazonTags?.length || 0;
  const channelsCount = profile?.channels?.length || 0;
  const hasDefaultAmazonTag = profile?.amazonTags?.some(tag => tag.isDefault) || false;
  const hasDefaultChannel = profile?.channels?.some(channel => channel.isDefault) || false;
  
  // Legacy fallback
  const hasLegacyAmazonTag = !!user?.amazonAssociateTag;
  const hasLegacyWebsite = !!user?.websiteUrl;
  
  // Combined analysis (NEW + Legacy)
  const hasAnyAmazonConfig = amazonTagsCount > 0 || hasLegacyAmazonTag;
  const hasAnyChannelConfig = channelsCount > 0 || hasLegacyWebsite;
  
  const isNewUser = !hasLinks && !hasClicks;
  const isCompletelyNewUser = isNewUser && !hasAnyAmazonConfig && !hasApiKeys;

  // ✨ COMPLETELY DYNAMIC: Primary CTA based on real multi-entity user state
  const getPrimaryCTA = () => {
    // Priority 1: Complete newcomer - needs Amazon configuration first
    if (isCompletelyNewUser && amazonTagsCount === 0 && !hasLegacyAmazonTag) {
      return {
        title: 'Configura Amazon Tags',
        subtitle: 'Il primo passo per iniziare con affiliate marketing',
        icon: <ShoppingCart className="w-6 h-6" />,
        color: 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
        href: `/${locale}/dashboard/profile`,
        priority: 'critical',
        badge: '1° Passo'
      };
    }
    
    // Priority 2: Has Amazon config but no API keys (needed for automation)
    if (hasAnyAmazonConfig && !hasApiKeys) {
      return {
        title: 'Crea Prima API Key',
        subtitle: 'Abilita automazioni e integrazioni avanzate',
        icon: <Key className="w-6 h-6" />,
        color: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
        href: `/${locale}/dashboard/api-keys`,
        priority: 'high',
        badge: '2° Passo'
      };
    }
    
    // Priority 3: Has basic setup but no links yet
    if (hasAnyAmazonConfig && isNewUser) {
      return {
        title: 'Crea il Primo Link',
        subtitle: 'Inizia a tracciare i tuoi link affiliati',
        icon: <Plus className="w-6 h-6" />,
        color: 'from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700',
        href: `/${locale}/dashboard/create`,
        priority: 'high',
        badge: '3° Passo'
      };
    }
    
    // Priority 4: Has links but no clicks (promotion needed)
    if (hasLinks && !hasClicks) {
      return {
        title: 'Promuovi i Tuoi Link',
        subtitle: 'Inizia a condividere per generare click e conversioni',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
        href: `/${locale}/dashboard/links`,
        priority: 'high',
        badge: 'Azione'
      };
    }
    
    // Priority 5: Has activity but missing defaults (optimization)
    if (hasAnyAmazonConfig && hasLinks && amazonTagsCount > 0 && !hasDefaultAmazonTag) {
      return {
        title: 'Ottimizza Configurazione',
        subtitle: 'Imposta tag predefinito per automazione',
        icon: <Star className="w-6 h-6" />,
        color: 'from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
        href: `/${locale}/dashboard/profile#amazon-tags`,
        priority: 'medium',
        badge: 'Ottimizza'
      };
    }
    
    // Priority 6: Setup channels for better tracking
    if (hasAnyAmazonConfig && hasLinks && channelsCount === 0 && !hasLegacyWebsite) {
      return {
        title: 'Aggiungi Canali',
        subtitle: 'Tracking granulare per fonte di traffico',
        icon: <Globe className="w-6 h-6" />,
        color: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
        href: `/${locale}/dashboard/profile#channels`,
        priority: 'medium',
        badge: 'Espandi'
      };
    }
    
    // Default: Advanced user - create more links
    return {
      title: 'Crea Nuovo Link',
      subtitle: 'Espandi la tua strategia affiliate',
      icon: <Plus className="w-6 h-6" />,
      color: 'from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700',
      href: `/${locale}/dashboard/create`,
      priority: 'normal',
      badge: 'Cresci'
    };
  };

  // ✨ UPDATED: Secondary actions based on real multi-entity state
  const getSecondaryActions = () => {
    const actions = [];
    
    // Analytics (if user has data to analyze)
    if (hasClicks) {
      actions.push({
        title: 'Analytics',
        subtitle: 'Analizza performance dettagliate',
        icon: <BarChart3 className="w-5 h-5" />,
        color: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
        href: `/${locale}/dashboard/analytics`
      });
    }
    
    // Profile management (if missing configuration)
    if (amazonTagsCount === 0 || channelsCount === 0 || !hasDefaultAmazonTag || !hasDefaultChannel) {
      actions.push({
        title: 'Completa Profilo',
        subtitle: 'Configura tags e canali mancanti',
        icon: <User className="w-5 h-5" />,
        color: 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
        href: `/${locale}/dashboard/profile`
      });
    }
    
    // API Keys (if user doesn't have them yet)
    if (!hasApiKeys) {
      actions.push({
        title: 'API Keys',
        subtitle: 'Configura integrazioni e automazioni',
        icon: <Key className="w-5 h-5" />,
        color: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
        href: `/${locale}/dashboard/api-keys`
      });
    }
    
    // Links management (if user has links)
    if (hasLinks) {
      actions.push({
        title: 'Gestisci Link',
        subtitle: 'Visualizza e modifica link esistenti',
        icon: <Target className="w-5 h-5" />,
        color: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
        href: `/${locale}/dashboard/links`
      });
    }
    
    // Settings (always available for advanced users)
    if (hasAnyAmazonConfig && hasApiKeys && hasLinks) {
      actions.push({
        title: 'Impostazioni',
        subtitle: 'Configura preferenze avanzate',
        icon: <Settings className="w-5 h-5" />,
        color: 'from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700',
        href: `/${locale}/dashboard/profile`
      });
    }
    
    // Default action for empty state
    if (actions.length === 0) {
      actions.push({
        title: 'Setup Iniziale',
        subtitle: 'Configura il tuo account',
        icon: <User className="w-5 h-5" />,
        color: 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
        href: `/${locale}/dashboard/profile`
      });
    }
    
    return actions.slice(0, 2); // Max 2 secondary actions for clean UI
  };

  const primaryCTA = getPrimaryCTA();
  const secondaryActions = getSecondaryActions();

  // ✨ NEW: Progress indicator for setup completion
  const getSetupProgress = () => {
    const steps = [
      { name: 'Amazon Tags', completed: hasAnyAmazonConfig, weight: 3 },
      { name: 'API Keys', completed: hasApiKeys, weight: 2 },
      { name: 'Primo Link', completed: hasLinks, weight: 2 },
      { name: 'Primi Click', completed: hasClicks, weight: 1 },
      { name: 'Tag Predefinito', completed: hasDefaultAmazonTag, weight: 1 },
      { name: 'Canali', completed: hasAnyChannelConfig, weight: 1 }
    ];
    
    const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
    const completedWeight = steps.reduce((sum, step) => sum + (step.completed ? step.weight : 0), 0);
    
    return {
      percentage: Math.round((completedWeight / totalWeight) * 100),
      completedSteps: steps.filter(step => step.completed).length,
      totalSteps: steps.length,
      nextStep: steps.find(step => !step.completed)?.name || 'Tutto completato!'
    };
  };

  const setupProgress = getSetupProgress();

  return (
    <div className="space-y-6">
      {/* Primary CTA Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Azioni Rapide</h3>
              <p className="text-sm text-gray-400">La prossima azione più importante per te</p>
            </div>
          </div>
          
          {/* ✨ NEW: Setup Progress Indicator */}
          <div className="text-right">
            <div className="text-sm font-medium text-white">{setupProgress.percentage}% Completo</div>
            <div className="text-xs text-gray-400">{setupProgress.completedSteps}/{setupProgress.totalSteps} step</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${setupProgress.percentage}%` }}
          />
        </div>

        {/* Primary Action */}
        <Link
          href={primaryCTA.href}
          className={`block p-6 bg-gradient-to-r ${primaryCTA.color} text-white rounded-2xl 
                     transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden mb-4`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 
                          group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {primaryCTA.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">{primaryCTA.title}</h3>
                  {primaryCTA.badge && (
                    <span className="px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
                      {primaryCTA.badge}
                    </span>
                  )}
                </div>
                <p className="text-white/80">{primaryCTA.subtitle}</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secondaryActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`p-4 bg-gradient-to-r ${action.color} text-white rounded-xl 
                         transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 
                              group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    {action.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{action.title}</h4>
                    <p className="text-white/70 text-xs">{action.subtitle}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
        
        {/* ✨ NEW: Quick Setup Status */}
        {setupProgress.percentage < 100 && (
          <div className="mt-4 p-3 bg-slate-700/30 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Prossimo: {setupProgress.nextStep}</span>
            </div>
            <p className="text-gray-400 text-xs">
              Completa il setup per sbloccare tutte le funzionalità di Afflyt
            </p>
          </div>
        )}
      </div>

      {/* AI Insights Preview (Future Feature) */}
      <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 
                      border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl 
                            flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                🤖 AI Insights 
                <span className="text-xs font-normal text-purple-300 ml-2">(Coming Soon)</span>
              </h3>
              <p className="text-gray-300 text-sm">Suggerimenti intelligenti basati sui tuoi dati</p>
            </div>
          </div>
        </div>
        
        {/* Example AI Insights (clearly marked as examples) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium text-sm">Esempio: Performance Insight</span>
            </div>
            <p className="text-gray-300 text-sm">
              "I tuoi link performano meglio tra le <strong>17:00-19:00</strong>. 
              Programma qui i prossimi post."
            </p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="font-medium text-sm">Esempio: Ottimizzazione</span>
            </div>
            <p className="text-gray-300 text-sm">
              "Link tech hanno CTR del <strong>5%</strong> sopra media. 
              Replica questa strategia."
            </p>
          </div>
        </div>
        
        {/* Coming Soon Badge */}
        <div className="mt-4 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              AI Insights sarà disponibile nella prossima versione - Gli esempi sopra mostrano il tipo di suggerimenti che riceverai automaticamente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
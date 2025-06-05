// apps/web/src/components/dashboard/widgets/SmartQuickActionsWidget.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { useApiKeys } from '@/hooks/useApi';
import { 
  Plus, 
  BarChart3, 
  Target, 
  Key,
  User,
  ExternalLink,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Smart Quick Actions Widget Component  
export const SmartQuickActionsWidget = () => {
  const { user, isEmailVerified } = useAuth();
  const { data: stats } = useStats();
  const { data: apiKeys } = useApiKeys();
  const params = useParams();
  const locale = params?.locale || 'it';

  // Real data analysis for smart suggestions
  const hasLinks = (stats?.totalLinks || 0) > 0;
  const hasClicks = (stats?.totalClicks || 0) > 0;
  const hasApiKeys = (apiKeys?.length || 0) > 0;
  const hasAmazonTag = !!user?.amazonAssociateTag;
  const isNewUser = !hasLinks && !hasClicks;

  // Primary CTA based on real user state
  const getPrimaryCTA = () => {
    if (!isEmailVerified) {
      return {
        title: 'Verifica Email',
        subtitle: 'Attiva il tuo account per iniziare',
        icon: <AlertCircle className="w-6 h-6" />,
        color: 'from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
        href: null, // Email verification is automatic
        priority: 'critical'
      };
    }
    
    if (isNewUser) {
      return {
        title: 'Crea il Primo Link',
        subtitle: 'Inizia a tracciare i tuoi link affiliati',
        icon: <Plus className="w-6 h-6" />,
        color: 'from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700',
        href: `/${locale}/dashboard/create`,
        priority: 'high'
      };
    }
    
    if (hasLinks && !hasClicks) {
      return {
        title: 'Promuovi i Tuoi Link',
        subtitle: 'Inizia a condividere per generare click',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
        href: `/${locale}/dashboard/links`,
        priority: 'high'
      };
    }
    
    return {
      title: 'Crea Nuovo Link',
      subtitle: 'Espandi la tua strategia affiliate',
      icon: <Plus className="w-6 h-6" />,
      color: 'from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700',
      href: `/${locale}/dashboard/create`,
      priority: 'normal'
    };
  };

  // Secondary actions based on real user state
  const getSecondaryActions = () => {
    const actions = [];
    
    // Always show analytics if user has data
    if (hasClicks) {
      actions.push({
        title: 'Analytics',
        subtitle: 'Analizza le performance',
        icon: <BarChart3 className="w-5 h-5" />,
        color: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
        href: `/${locale}/dashboard/analytics`
      });
    }
    
    // Show API Keys if user doesn't have them yet
    if (!hasApiKeys) {
      actions.push({
        title: 'API Keys',
        subtitle: 'Configura integrazioni',
        icon: <Key className="w-5 h-5" />,
        color: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
        href: `/${locale}/dashboard/api-keys`
      });
    }
    
    // Show profile setup if missing Amazon tag
    if (!hasAmazonTag) {
      actions.push({
        title: 'Setup Profilo',
        subtitle: 'Configura Amazon Tag',
        icon: <User className="w-5 h-5" />,
        color: 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
        href: `/${locale}/dashboard/profile`
      });
    }
    
    // Default action for advanced users
    if (actions.length === 0) {
      actions.push({
        title: 'I Miei Link',
        subtitle: 'Gestisci i link esistenti',
        icon: <Target className="w-5 h-5" />,
        color: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
        href: `/${locale}/dashboard/links`
      });
    }
    
    return actions.slice(0, 2); // Max 2 secondary actions
  };

  const primaryCTA = getPrimaryCTA();
  const secondaryActions = getSecondaryActions();

  return (
    <div className="space-y-6">
      {/* Primary CTA Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Azioni Rapide</h3>
            <p className="text-sm text-gray-400">Le azioni più importanti per te ora</p>
          </div>
        </div>

        {/* Primary Action */}
        {primaryCTA.href ? (
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
                  <h3 className="text-xl font-bold mb-1">{primaryCTA.title}</h3>
                  <p className="text-white/80">{primaryCTA.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ) : (
          <div className={`p-6 bg-gradient-to-r ${primaryCTA.color} text-white rounded-2xl 
                          opacity-75 cursor-not-allowed mb-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {primaryCTA.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{primaryCTA.title}</h3>
                  <p className="text-white/80">{primaryCTA.subtitle}</p>
                </div>
              </div>
              <Clock className="w-6 h-6" />
            </div>
          </div>
        )}

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
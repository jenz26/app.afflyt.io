'use client'

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useClientI18n } from '@/lib/i18n/useClientI18n';
import { useStats } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { 
  BarChart3, 
  Users, 
  Zap, 
  MessageSquare,
  Clock,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  Heart,
  Sparkles,
  TrendingUp,
  Plus,
  Link2,
  Play,
  Activity,
  MousePointer,
  Target,
  Globe
} from 'lucide-react';

type ColorType = 'blue' | 'green' | 'purple' | 'orange';
type StatusType = 'coming_soon' | 'testing' | 'roadmap';

// Mock data per demo
const mockStats = {
  totalLinks: 24,
  totalClicks: 1247,
  conversions: 89,
  revenue: 2847
};

const mockRecentLinks = [
  { id: 1, title: "iPhone 15 Pro Review", clicks: 156, created: "2h fa", status: "active" },
  { id: 2, title: "MacBook Air M3", clicks: 89, created: "1d fa", status: "active" },
  { id: 3, title: "AirPods Pro 2", clicks: 67, created: "2d fa", status: "active" }
];

// Animated Background Component
const AnimatedBackground: React.FC = () => {
  const [particles, setParticles] = useState<Array<{left: string, top: string, delay: string, duration: string}>>([]);

  useEffect(() => {
    // Genera le particelle solo lato client
    const newParticles = Array.from({ length: 15 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradienti statici */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      {/* Particelle dinamiche */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-pink-400/30 to-blue-400/30 rounded-full animate-ping"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Hero Section Component - ✅ AGGIORNATO con CTA collegati
const HeroSection: React.FC = () => {
  const { t } = useTranslation('common');
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'it';

  // Helper per creare link con locale
  const createLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${currentLocale}${cleanPath}`;
  };
  
  return (
    <section className="relative z-10 pt-16 pb-12">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <div className="mb-2">{t('hero_line_1')}</div>
              <div className="mb-4">{t('hero_line_2')}</div>
              <div className="text-2xl md:text-3xl text-gray-300 mb-3">{t('hero_line_3')}</div>
              <div className="text-5xl md:text-8xl">
                <span className="bg-clip-text text-transparent animate-gradient-wave" style={{
                  backgroundImage: 'linear-gradient(to right, #f472b6, #a855f7, #3b82f6, #14b8a6)'
                }}>
                  Afflyt
                </span>
              </div>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-medium mt-6">
              {t('hero_tagline')}
            </p>
          </div>
          
          <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('hero_subtitle')}
          </p>

          {/* ✅ CTA AGGIORNATI con logica utente loggato/non loggato */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isLoggedIn ? (
              // Utente loggato - porta alla dashboard/create
              <>
                <Link
                  href={createLink('/dashboard/create')}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  {t('hero_cta_primary')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  href={createLink('/dashboard')}
                  className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white rounded-xl text-lg hover:bg-white/10 transition-all"
                >
                  <BarChart3 className="w-5 h-5" />
                  Vai alla Dashboard
                </Link>
              </>
            ) : (
              // Utente non loggato - porta al signin
              <>
                <Link
                  href={createLink('/auth/signin')}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Zap className="w-5 h-5" />
                  Inizia Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white rounded-xl text-lg hover:bg-white/10 transition-all">
                  <Play className="w-5 h-5" />
                  {t('hero_cta_secondary_improved')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Stats Card Component
const StatsCard: React.FC<{ 
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  color?: ColorType;
  subValue?: string;
}> = ({ icon, value, label, trend, color = "blue", subValue }) => {
  const colorClasses = {
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    orange: "from-orange-500/20 to-red-500/20 border-orange-500/30"
  };

  return (
    <div className={`p-6 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} backdrop-blur-xl border rounded-2xl hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <div className="text-green-400 text-sm font-medium flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1 tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-gray-300 text-sm font-medium">{label}</div>
      {subValue && (
        <div className="text-gray-400 text-xs mt-2 font-medium">{subValue}</div>
      )}
    </div>
  );
};

// Recent Links Component - ✅ AGGIORNATO con link collegati
const RecentLinksCard: React.FC = () => {
  const { t } = useTranslation('common');
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'it';

  // Helper per creare link con locale
  const createLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${currentLocale}${cleanPath}`;
  };
  
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-400" />
          {t('recent_links_title')}
        </h3>
        {/* ✅ AGGIORNATO con link corretto */}
        <Link
          href={isLoggedIn ? createLink('/dashboard/links') : createLink('/auth/signin')}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          {t('recent_links_view_all')}
        </Link>
      </div>
      
      <div className="space-y-4">
        {mockRecentLinks.map((link) => (
          <div key={link.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
            <div className="flex-1">
              <div className="text-white font-medium mb-1">{link.title}</div>
              <div className="text-gray-400 text-sm">{link.clicks} click • {link.created}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <button className="text-gray-400 hover:text-white">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ AGGIUNTO CTA bottom */}
      {!isLoggedIn && (
        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
          <p className="text-gray-300 text-sm mb-3">
            Vuoi vedere i tuoi link reali?
          </p>
          <Link
            href={createLink('/auth/signin')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Crea Account Gratis
          </Link>
        </div>
      )}
    </div>
  );
};

// System Status Component
const SystemStatusCard: React.FC = () => {
  const { t } = useTranslation('common');
  
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-green-400" />
        {t('system_status_title')}
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">{t('system_status_api')}</span>
          </div>
          <span className="text-green-400 text-sm font-medium">{t('system_status_operational')}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">{t('system_status_database')}</span>
          </div>
          <span className="text-green-400 text-sm font-medium">{t('system_status_uptime')}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-gray-300">{t('system_status_ab_testing')}</span>
          </div>
          <span className="text-yellow-400 text-sm font-medium">{t('system_status_beta')}</span>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">{t('system_status_news')}</span>
        </div>
        <p className="text-gray-300 text-sm mb-3">{t('system_status_telegram_update')}</p>
      </div>

      {/* AI Insight Mock */}
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-xs">🧠</span>
          </div>
          <span className="text-purple-300 text-sm font-medium">{t('ai_insight_title')}</span>
        </div>
        <p className="text-gray-300 text-sm">{t('ai_insight_message')}</p>
      </div>
    </div>
  );
};

// Quick Overview Section
const QuickOverviewSection: React.FC = () => {
  const { t } = useTranslation('common');
  
  return (
    <section className="relative z-10 py-16">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('overview_title')}
            </h2>
            <p className="text-xl text-gray-300">
              {t('overview_subtitle')}
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <StatsCard
              icon={<Link2 className="w-6 h-6 text-blue-400" />}
              value={mockStats.totalLinks}
              label={t('stats_links_tracked')}
              trend="+12%"
              color="blue"
              subValue="€728 totali generati • +12% questa settimana"
            />
            <StatsCard
              icon={<MousePointer className="w-6 h-6 text-green-400" />}
              value={mockStats.totalClicks}
              label={t('stats_total_clicks')}
              trend="+23%"
              color="green"
              subValue="CTR medio 3.2% • Picco ore 17-19"
            />
            <StatsCard
              icon={<Target className="w-6 h-6 text-purple-400" />}
              value={mockStats.conversions}
              label={t('stats_conversions')}
              trend="+8%"
              color="purple"
              subValue="Tasso conversione 7.1% • Sopra media settore"
            />
            <StatsCard
              icon={<Heart className="w-6 h-6 text-orange-400" />}
              value={`€${mockStats.revenue}`}
              label={t('stats_revenue')}
              trend="+31%"
              color="orange"
              subValue="€34 per link • +€890 questo mese"
            />
          </div>
          
          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <RecentLinksCard />
            <SystemStatusCard />
          </div>
        </div>
      </div>
    </section>
  );
};

// Upcoming Features Section - ✅ AGGIORNATO con link alle pagine teaser
const UpcomingFeaturesSection: React.FC = () => {
  const { t } = useTranslation('common');
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'it';

  // Helper per creare link con locale
  const createLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${currentLocale}${cleanPath}`;
  };
  
  const statusConfig = {
    coming_soon: { 
      color: "bg-green-500/20 text-green-300 border-green-500/30", 
      text: t('status_coming_soon')
    },
    testing: { 
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", 
      text: t('status_testing')
    },
    roadmap: { 
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30", 
      text: t('status_roadmap')
    }
  };

  // ✅ AGGIORNATO con link alle pagine teaser
  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-white" />,
      title: t('feature_telegram_title'),
      description: t('feature_telegram_desc'),
      status: 'coming_soon' as StatusType,
      href: '/dashboard/telegram'
    },
    {
      icon: <Target className="w-6 h-6 text-white" />,
      title: t('feature_ab_test_title'),
      description: t('feature_ab_test_desc'),
      status: 'testing' as StatusType,
      href: '/dashboard/ab-testing'
    },
    {
      icon: <Globe className="w-6 h-6 text-white" />,
      title: t('feature_cross_platform_title'),
      description: t('feature_cross_platform_desc'),
      status: 'roadmap' as StatusType,
      href: '/dashboard/automations'
    }
  ];

  return (
    <section className="relative z-10 py-16">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('upcoming_title')} {t('upcoming_emoji')}
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {t('upcoming_subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              // ✅ AGGIORNATO: ogni card è ora un link cliccabile
              <Link
                key={index}
                href={isLoggedIn ? createLink(feature.href) : createLink('/auth/signin')}
                className="group p-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all hover:scale-105 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    {feature.icon}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusConfig[feature.status as keyof typeof statusConfig].color}`}>
                    {statusConfig[feature.status as keyof typeof statusConfig].text}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4">{feature.description}</p>
                
                {/* ✅ AGGIUNTO: indicatore che è cliccabile */}
                <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 transition-colors">
                  <span className="text-sm font-medium">
                    {isLoggedIn ? 'Scopri di più' : 'Accedi per dettagli'}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* ✅ AGGIUNTO: CTA bottom per non loggati */}
          {!isLoggedIn && (
            <div className="mt-12 text-center">
              <div className="p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl max-w-2xl mx-auto">
                <h3 className="text-white text-xl font-semibold mb-3">
                  Vuoi essere il primo a provare queste funzionalità?
                </h3>
                <p className="text-gray-300 mb-6">
                  Crea un account gratuito e ti avviseremo non appena saranno disponibili.
                </p>
                <Link
                  href={createLink('/auth/signin')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all hover:scale-105"
                >
                  <Zap className="w-5 h-5" />
                  Registrati Gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// ✅ AGGIORNATO: Main component con useAuth hook
export default function AppHomePage() {
  const { t } = useTranslation('common');
  const pathname = usePathname();
  const { data: stats, isLoading } = useStats();
  const { isLoggedIn } = useAuth();
  
  useClientI18n();

  const currentLocale = pathname.split('/')[1] || 'it';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <div className="relative overflow-hidden">
        <AnimatedBackground />
        
        <HeroSection />
        <QuickOverviewSection />
        <UpcomingFeaturesSection />
        
        {/* ✅ AGGIUNTO: CTA finale bottom */}
        <section className="relative z-10 py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                {isLoggedIn ? 'Pronto a creare il tuo prossimo link?' : 'Pronto a iniziare?'}
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                {isLoggedIn 
                  ? 'Crea nuovi link affiliati e traccia le performance in tempo reale.'
                  : 'Unisciti a migliaia di creators che stanno già guadagnando di più con Afflyt.'
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {isLoggedIn ? (
                  <>
                    <Link
                      href={`/${currentLocale}/dashboard/create`}
                      className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-emerald-500/25 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Crea Nuovo Link
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href={`/${currentLocale}/dashboard/analytics`}
                      className="px-8 py-4 border border-white/20 text-white hover:bg-white/10 font-medium rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                    >
                      <BarChart3 className="w-5 h-5" />
                      Vedi Analytics
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/${currentLocale}/auth/signin`}
                      className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-emerald-500/25 flex items-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      Inizia Gratis Ora
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button className="px-8 py-4 border border-white/20 text-white hover:bg-white/10 font-medium rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Guarda Demo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Footer */}
      <Footer />
      
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes gradient-wave {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 200% 50%; }
          75% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-gradient-wave {
          background-size: 300% 300%;
          animation: gradient-wave 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
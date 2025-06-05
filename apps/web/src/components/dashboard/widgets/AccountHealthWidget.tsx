// apps/web/src/components/dashboard/widgets/AccountHealthWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApiKeys } from '@/hooks/useApi';
import { 
  Shield, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ShoppingCart,
  Database,
  Wifi,
  Settings,
  ChevronRight,
  Plus,
  ExternalLink
} from 'lucide-react';

// Types for system status
interface SystemStatus {
  api: 'operational' | 'degraded' | 'down';
  database: 'operational' | 'degraded' | 'down';
  tracking: 'operational' | 'degraded' | 'down';
}

// Account Health Widget Component
export const AccountHealthWidget = () => {
  const { user, isEmailVerified, userRole } = useAuth();
  const { data: apiKeys, isLoading: apiKeysLoading } = useApiKeys();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch real system status from backend
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setStatusLoading(true);
        // Real API call to health endpoint
        const response = await fetch('/api/health');
        if (response.ok) {
          const healthData = await response.json();
          setSystemStatus({
            api: healthData.status === 'ok' ? 'operational' : 'degraded',
            database: healthData.database?.status === 'connected' ? 'operational' : 'degraded', 
            tracking: healthData.redis?.status === 'connected' ? 'operational' : 'degraded'
          });
        } else {
          // If health endpoint fails, assume degraded
          setSystemStatus({
            api: 'degraded',
            database: 'degraded',
            tracking: 'degraded'
          });
        }
      } catch (error) {
        console.error('Error fetching system status:', error);
        // On error, show unknown status
        setSystemStatus({
          api: 'degraded',
          database: 'degraded', 
          tracking: 'degraded'
        });
      } finally {
        setStatusLoading(false);
      }
    };

    fetchSystemStatus();
    
    // Refresh status every 2 minutes
    const interval = setInterval(fetchSystemStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  // Calculate API Keys metrics from REAL data
  const apiKeysActive = apiKeys?.filter(key => key.isActive).length || 0;
  const apiKeysTotal = 10; // Max allowed keys per user (business rule)
  const apiKeysUsage = apiKeysTotal > 0 ? (apiKeysActive / apiKeysTotal) * 100 : 0;

  // Calculate Amazon integration status from REAL user data
  const hasAmazonTag = !!user?.amazonAssociateTag;
  const hasWebsite = !!user?.websiteUrl;
  const hasCompany = !!user?.companyName;

  // Account completion percentage based on REAL data
  const completionFactors = [
    isEmailVerified,
    hasAmazonTag,
    hasWebsite,
    apiKeysActive > 0,
    hasCompany
  ];
  const completionPercentage = (completionFactors.filter(Boolean).length / completionFactors.length) * 100;

  // System status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'degraded': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'down': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operational': return 'Operativo';
      case 'degraded': return 'Rallentato';
      case 'down': return 'Non disponibile';
      default: return 'Sconosciuto';
    }
  };

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
        {/* Account Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          {/* Email Verification */}
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              {isEmailVerified ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              )}
              <span className="text-white font-medium text-sm">Verifica Email</span>
            </div>
            <p className={`text-xs ${isEmailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
              {isEmailVerified ? 'Verificato' : 'In attesa di verifica'}
            </p>
          </div>

          {/* Account Type */}
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium text-sm">Tipo Account</span>
            </div>
            <p className="text-xs text-blue-400 capitalize">
              {userRole === 'affiliate' ? 'Affiliato' : userRole === 'admin' ? 'Admin' : userRole || 'Standard'}
            </p>
          </div>
        </div>

        {/* API Keys Status */}
        <div className="p-4 bg-slate-700/30 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium text-sm">API Keys</span>
            </div>
            <a 
              href="/dashboard/api-keys"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </a>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs">Utilizzo</span>
            <span className="text-white font-bold text-sm">{apiKeysActive}/{apiKeysTotal}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-600/50 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${apiKeysUsage}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {apiKeysActive > 0 ? 'Chiavi attive' : 'Nessuna chiave attiva'}
            </span>
            {apiKeysActive < apiKeysTotal && (
              <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Aggiungi
              </button>
            )}
          </div>
        </div>

        {/* Amazon Integration */}
        <div className="p-4 bg-slate-700/30 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-orange-400" />
              <span className="text-white font-medium text-sm">Amazon Integration</span>
            </div>
            <a 
              href="/dashboard/profile"
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Associate Tag</span>
              <div className="flex items-center gap-1">
                {hasAmazonTag ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Configurato</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400">Mancante</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Sito Web</span>
              <div className="flex items-center gap-1">
                {hasWebsite ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Collegato</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400">Opzionale</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="p-4 bg-slate-700/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium text-sm">Sistema Afflyt</span>
          </div>
          
          {statusLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 bg-slate-600 rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-slate-600 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : systemStatus ? (
            <div className="space-y-2">
              {Object.entries(systemStatus).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 capitalize">
                    {service === 'api' ? 'API Gateway' : 
                     service === 'database' ? 'Database' : 
                     'Tracking'}
                  </span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span className="text-xs font-medium">{getStatusLabel(status)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-gray-400 text-xs">Impossibile caricare lo stato</span>
            </div>
          )}
          
          {/* Last Update - Real timestamp */}
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Ultimo aggiornamento</span>
              <span className="text-gray-400">
                {statusLoading ? 'Caricamento...' : new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Setup Actions */}
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
              {!hasAmazonTag && (
                <a 
                  href="/dashboard/profile"
                  className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <span className="text-white text-xs">Configura Amazon Tag</span>
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-white" />
                </a>
              )}
              
              {apiKeysActive === 0 && (
                <a 
                  href="/dashboard/api-keys"
                  className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <span className="text-white text-xs">Crea prima API Key</span>
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
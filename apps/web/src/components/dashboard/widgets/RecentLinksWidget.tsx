// apps/web/src/components/dashboard/widgets/RecentLinksWidget.tsx
'use client';

import { useLinks } from '@/hooks/useLinks';
import { ExternalLink, Calendar, AlertCircle, Link2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const RecentLinksWidget = () => {
  const { data: linksData, isLoading, error } = useLinks({ 
    limit: 5, 
    sortBy: 'createdAt', 
    sortOrder: 'desc' 
  });

  const recentLinks = linksData?.links || [];

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          Link Recenti
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          Link Recenti
        </h3>
        <div className="flex items-center text-red-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">Errore caricamento</p>
            <p className="text-sm text-gray-400">Impossibile caricare i link</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          Link Recenti
        </h3>
        <button className="text-purple-400 hover:text-purple-300 text-sm font-medium hover:bg-purple-500/10 px-3 py-1 rounded-lg transition-colors">
          Vedi tutti
        </button>
      </div>
      
      {recentLinks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 className="h-8 w-8 text-purple-400" />
          </div>
          <h4 className="text-white font-medium mb-2">Nessun link ancora</h4>
          <p className="text-gray-400 text-sm mb-4">Inizia creando il tuo primo link affiliato</p>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium">
            Crea primo link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recentLinks.map((link) => {
            const createdDate = new Date(link.createdAt);
            const isValidDate = !isNaN(createdDate.getTime());
            const isPerforming = link.clickCount > 50;
            
            return (
              <div key={link.hash} className="group p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all duration-200 border border-transparent hover:border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-medium truncate">
                        {link.tag || `Link ${link.hash.slice(0, 8)}`}
                      </h4>
                      {isPerforming && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                          <TrendingUp className="w-3 h-3" />
                          Hot
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs truncate mb-2">
                      {link.originalUrl}
                    </p>
                    {isValidDate && (
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {format(createdDate, 'dd MMM yyyy', { locale: it })}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${link.clickCount > 0 ? 'bg-green-400' : 'bg-gray-500'}`} />
                          <span className="text-gray-400">{link.clickCount || 0} click</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="ml-3 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
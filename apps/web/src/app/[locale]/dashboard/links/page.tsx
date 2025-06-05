// apps/web/src/app/[locale]/dashboard/links/page.tsx
'use client';

import { useState } from 'react';
import { useLinks, type AffiliateLink } from '@/hooks/useApi';
import { 
  Link2, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Copy,
  ExternalLink,
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Check,
  Pause,
  Play,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function LinksPage() {
  // API hook
  const { data: linksData, isLoading, error, refetch } = useLinks();
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'clicks' | 'revenue'>('created');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Real data from API - handle both array and object with data property
  const allLinks: AffiliateLink[] = Array.isArray(linksData) 
    ? linksData 
    : (linksData as any)?.data || (linksData as any)?.links || [];

  // Debug: log what we're getting from the API
  console.log('🔍 useLinks hook data:', { linksData, isLoading, error });
  console.log('🔍 linksData structure:', linksData);
  console.log('🔍 linksData keys:', linksData ? Object.keys(linksData) : 'null/undefined');
  console.log('🔍 allLinks type:', typeof allLinks, 'is array:', Array.isArray(allLinks), 'value:', allLinks);

  // Filter and sort links - with safety checks
  const filteredLinks = Array.isArray(allLinks) ? allLinks
    .filter((link: AffiliateLink) => {
      const matchesSearch = !searchTerm || 
        link.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || 
        (filterStatus === 'active' && link.status === 'active') ||
        (filterStatus === 'paused' && link.status === 'paused');
      
      return matchesSearch && matchesFilter;
    })
    .sort((a: AffiliateLink, b: AffiliateLink) => {
      switch (sortBy) {
        case 'clicks':
          return (b.clickCount || 0) - (a.clickCount || 0);
        case 'revenue':
          // Revenue sorting when available in the data
          return 0; // Placeholder for now
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    }) : [];

  // Copy to clipboard
  const copyToClipboard = async (hash: string) => {
    const shortUrl = `${window.location.origin}/r/${hash}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLink(hash);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Invalid URL';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Link2 className="h-6 w-6 text-blue-400" />
            </div>
            I Miei Link
          </h1>
          <p className="text-gray-400">
            Gestisci e monitora tutti i tuoi link affiliati
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Aggiorna
          </button>
          <a
            href="/dashboard/create"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuovo Link
          </a>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per tag o URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">Tutti i link</option>
              <option value="active">Attivi</option>
              <option value="paused">In pausa</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="created">Data creazione</option>
              <option value="clicks">Click</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{Array.isArray(allLinks) ? allLinks.length : 0}</div>
          <div className="text-gray-400 text-sm">Link Totali</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">
            {Array.isArray(allLinks) ? allLinks.filter((l: AffiliateLink) => l.status === 'active').length : 0}
          </div>
          <div className="text-gray-400 text-sm">Attivi</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">
            {Array.isArray(allLinks) ? allLinks.reduce((sum: number, link: AffiliateLink) => sum + (link.clickCount || 0), 0).toLocaleString('it-IT') : '0'}
          </div>
          <div className="text-gray-400 text-sm">Click Totali</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-400">€0.00</div>
          <div className="text-gray-400 text-sm">Revenue</div>
        </div>
      </div>

      {/* Links List */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        {filteredLinks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link2 className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-white font-medium mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Nessun link trovato' : 'Nessun link creato'}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia creando il tuo primo link affiliato'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <a
                href="/dashboard/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Crea primo link
              </a>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLinks.map((link: AffiliateLink) => (
              <div key={link.hash} className="p-6 hover:bg-white/5 transition-colors group">
                <div className="flex items-center justify-between">
                  {/* Link Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        link.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                      }`} />
                      <h3 className="text-white font-medium truncate">
                        {link.tag || getDomain(link.originalUrl)}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        link.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {link.status === 'active' ? 'Attivo' : 'Pausa'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>🔗 {window.location.origin}/r/{link.hash}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(link.createdAt), 'dd/MM/yyyy', { locale: it })}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500 truncate">
                      {link.originalUrl}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <div className="text-white font-bold">{(link.clickCount || 0).toLocaleString('it-IT')}</div>
                      <div className="text-gray-400 text-xs">Click</div>
                    </div>
                    <div>
                      <div className="text-green-400 font-bold">€0.00</div>
                      <div className="text-gray-400 text-xs">Revenue</div>
                    </div>
                    <div>
                      <div className="text-purple-400 font-bold">0.0%</div>
                      <div className="text-gray-400 text-xs">Conv.</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(link.hash)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Copia link"
                    >
                      {copiedLink === link.hash ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Statistiche"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(link.originalUrl, '_blank')}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Apri URL originale"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Altre opzioni"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
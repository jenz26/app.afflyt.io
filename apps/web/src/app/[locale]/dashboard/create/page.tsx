// apps/web/src/app/[locale]/dashboard/create/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useLinks } from '@/hooks/useApi';
import { 
  Link, 
  Globe, 
  Tag, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Sparkles,
  TrendingUp,
  Target,
  Clock
} from 'lucide-react';

export default function CreateLinkPage() {
  // Form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [tag, setTag] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Validation state
  const [urlError, setUrlError] = useState<string | null>(null);

  // API hook
  const { createLink } = useLinks(false);

  // URL validation function
  const validateUrl = useCallback((url: string): string | null => {
    if (!url) return 'URL è richiesto';
    
    try {
      const urlObj = new URL(url);
      
      // Check if it's a valid HTTP/HTTPS URL
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'URL deve iniziare con http:// o https://';
      }

      // Check for Amazon URLs (common for affiliate marketing)
      const isAmazon = urlObj.hostname.includes('amazon.');
      if (isAmazon && !urlObj.searchParams.has('tag')) {
        return 'URL Amazon deve includere il parametro "tag" per l\'affiliate tracking';
      }

      return null;
    } catch (e) {
      return 'URL non valido';
    }
  }, []);

  // Handle URL input change with validation
  const handleUrlChange = (value: string) => {
    setOriginalUrl(value);
    setError(null);
    
    if (value) {
      const error = validateUrl(value);
      setUrlError(error);
    } else {
      setUrlError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate URL
    const validationError = validateUrl(originalUrl);
    if (validationError) {
      setUrlError(validationError);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const linkData = {
        originalUrl,
        tag: tag.trim() || undefined,
        metadata: {
          createdVia: 'dashboard',
          userAgent: navigator.userAgent
        }
      };

      const result = await createLink(linkData);
      setCreatedLink(result);
      
      // Reset form
      setOriginalUrl('');
      setTag('');
      setUrlError(null);
      
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione del link');
    } finally {
      setIsCreating(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get domain from URL for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'URL non valido';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-pink-500/30">
              <Link className="h-6 w-6 text-pink-400" />
            </div>
            Crea Nuovo Link
          </h1>
          <p className="text-gray-400">
            Trasforma qualsiasi URL in un link affiliato trackabile e ottimizzato
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">2.4s</div>
            <div className="text-xs text-gray-400">Tempo medio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">98%</div>
            <div className="text-xs text-gray-400">Uptime</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Form - 2/3 width */}
        <div className="xl:col-span-2 space-y-6">
          {/* Create Link Form */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <Globe className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Dettagli Link</h2>
                <p className="text-gray-400 text-sm">Inserisci l'URL che vuoi tracciare</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <label htmlFor="url" className="block text-sm font-medium text-white">
                  URL Originale <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="url"
                    type="url"
                    value={originalUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://amazon.it/dp/B08N5WRWNW?tag=youraffid-21"
                    className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-400 
                              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                              transition-all duration-200 ${
                                urlError ? 'border-red-500/50' : 'border-white/10'
                              }`}
                    disabled={isCreating}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {urlError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {urlError}
                  </div>
                )}
                {originalUrl && !urlError && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Check className="h-4 w-4" />
                    Dominio: {getDomain(originalUrl)}
                  </div>
                )}
              </div>

              {/* Tag Input */}
              <div className="space-y-2">
                <label htmlFor="tag" className="block text-sm font-medium text-white">
                  Tag (Opzionale)
                </label>
                <div className="relative">
                  <input
                    id="tag"
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="es. iphone-15-review, tech-gadgets"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                             focus:border-purple-500/50 transition-all duration-200"
                    disabled={isCreating}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-gray-500 text-xs">
                  Usa i tag per organizzare e filtrare i tuoi link
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Errore</span>
                  </div>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCreating || !!urlError || !originalUrl}
                className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 
                         hover:from-pink-700 hover:to-purple-700 disabled:from-gray-600 
                         disabled:to-gray-700 disabled:cursor-not-allowed text-white 
                         rounded-xl font-medium transition-all duration-200 flex items-center 
                         justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creazione in corso...
                  </>
                ) : (
                  <>
                    <Link className="h-5 w-5" />
                    Crea Link Affiliato
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Success Result */}
          {createdLink && (
            <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-400">Link Creato con Successo!</h3>
                  <p className="text-green-300 text-sm">Il tuo link affiliato è pronto per essere condiviso</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Short URL Display */}
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm font-medium">Link Affiliato</span>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/r/${createdLink.hash}`)}
                      className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 
                               rounded-lg text-white text-sm transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-400" />
                          Copiato!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copia
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-blue-400 font-mono text-lg break-all">
                    {`${window.location.origin}/r/${createdLink.hash}`}
                  </div>
                </div>

                {/* Original URL Display */}
                <div className="p-4 bg-slate-800/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm font-medium">URL Originale</span>
                    <a
                      href={createdLink.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Apri
                    </a>
                  </div>
                  <div className="text-gray-300 text-sm break-all">
                    {createdLink.originalUrl}
                  </div>
                </div>

                {/* Link Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-800/30 rounded-xl">
                    <div className="text-xl font-bold text-white">0</div>
                    <div className="text-xs text-gray-400">Click</div>
                  </div>
                  <div className="text-center p-3 bg-slate-800/30 rounded-xl">
                    <div className="text-xl font-bold text-white">0</div>
                    <div className="text-xs text-gray-400">Conversioni</div>
                  </div>
                  <div className="text-center p-3 bg-slate-800/30 rounded-xl">
                    <div className="text-xl font-bold text-white">€0.00</div>
                    <div className="text-xs text-gray-400">Revenue</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="xl:col-span-1 space-y-6">
          {/* Quick Tips */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-yellow-500/30">
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Suggerimenti</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="font-medium text-sm">URL Amazon</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Assicurati che l'URL Amazon includa il tuo tag affiliate per il tracking
                </p>
              </div>
              
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium text-sm">Tag Strategici</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Usa tag descrittivi per segmentare e analizzare le performance
                </p>
              </div>
              
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-sm">Timing</span>
                </div>
                <p className="text-gray-300 text-xs">
                  I link sono attivi immediatamente e iniziano a tracciare i click
                </p>
              </div>
            </div>
          </div>

          {/* Supported Platforms */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Piattaforme Supportate</h3>
            
            <div className="space-y-3">
              {[
                { name: 'Amazon', icon: '🛒', color: 'bg-orange-500/20 text-orange-400', status: 'Ottimizzato' },
                { name: 'eBay', icon: '🏪', color: 'bg-blue-500/20 text-blue-400', status: 'Supportato' },
                { name: 'AliExpress', icon: '📦', color: 'bg-red-500/20 text-red-400', status: 'Supportato' },
                { name: 'Etsy', icon: '🎨', color: 'bg-green-500/20 text-green-400', status: 'Supportato' },
                { name: 'Altri E-commerce', icon: '🌐', color: 'bg-gray-500/20 text-gray-400', status: 'Generale' }
              ].map((platform, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center text-sm`}>
                      {platform.icon}
                    </div>
                    <span className="text-white font-medium text-sm">{platform.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{platform.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Attività Recente</h3>
            
            <div className="space-y-3">
              {[
                { action: 'Link creato', item: 'iPhone 15 Pro Max', time: '2 min fa', color: 'text-green-400' },
                { action: 'Click registrato', item: 'MacBook Air M2', time: '5 min fa', color: 'text-blue-400' },
                { action: 'Link creato', item: 'AirPods Pro 2', time: '1 ora fa', color: 'text-green-400' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/20 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${activity.color.replace('text-', 'bg-')}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{activity.action}</p>
                    <p className="text-gray-400 text-xs truncate">{activity.item}</p>
                  </div>
                  <span className="text-gray-500 text-xs">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
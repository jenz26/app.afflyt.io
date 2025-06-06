// apps/web/src/app/[locale]/dashboard/create/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLinks, useAmazonTags, useChannels } from '@/hooks/useApi';
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
  Clock,
  ChevronDown,
  Store,
  Tv,
  Monitor,
  FileText,
  Youtube,
  Instagram,
  MessageCircle,
  Gamepad2,
  Package,
  ShoppingCart,
  Building2
} from 'lucide-react';

// Helper function to get channel icon
const getChannelIcon = (type: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    website: <Globe className="w-4 h-4" />,
    blog: <FileText className="w-4 h-4" />,
    youtube: <Youtube className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    telegram: <MessageCircle className="w-4 h-4" />,
    discord: <Gamepad2 className="w-4 h-4" />,
    other: <Package className="w-4 h-4" />
  };
  return iconMap[type] || <Package className="w-4 h-4" />;
};

// Helper function to get Amazon marketplace icon
const getAmazonMarketplaceIcon = (marketplace: string): React.ReactNode => {
  // You could customize this based on marketplace
  return <ShoppingCart className="w-4 h-4" />;
};

// Custom Dropdown Component
interface DropdownOption {
  value: string;
  label: string;
  subtitle?: string;
  isDefault?: boolean;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  gradient?: string;
  borderColor?: string;
  options: DropdownOption[];
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  icon,
  gradient = "from-blue-500/20 to-cyan-500/20",
  borderColor = "blue-500/50",
  options
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-left
                  focus:outline-none focus:ring-2 transition-all duration-200 
                  ${error ? 'border-red-500/50 focus:ring-red-500/50' : `border-white/10 focus:ring-${borderColor} focus:border-${borderColor}`}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/70'}
                  ${isOpen ? `ring-2 ring-${borderColor}` : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectedOption?.icon && (
              <div className="text-gray-400 flex-shrink-0">
                {selectedOption.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {selectedOption ? (
                <>
                  <div className="text-white font-medium truncate flex items-center gap-2">
                    {selectedOption.label}
                    {selectedOption.isDefault && (
                      <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-md flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  {selectedOption.subtitle && (
                    <div className="text-gray-400 text-sm truncate">
                      {selectedOption.subtitle}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {icon}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-gray-400 text-sm">
              Nessuna opzione disponibile
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors duration-200 
                          border-b border-white/5 last:border-b-0 first:rounded-t-xl last:rounded-b-xl
                          ${value === option.value ? `bg-gradient-to-r ${gradient} border-${borderColor}` : ''}`}
              >
                <div className="flex items-center gap-3">
                  {option.icon && (
                    <div className="text-gray-400 flex-shrink-0">
                      {option.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">
                        {option.label}
                      </span>
                      {option.isDefault && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-md flex-shrink-0">
                          Default
                        </span>
                      )}
                    </div>
                    {option.subtitle && (
                      <div className="text-gray-400 text-sm truncate mt-0.5">
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default function CreateLinkPage() {
  // Form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [tag, setTag] = useState('');
  const [selectedAmazonTagId, setSelectedAmazonTagId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Validation state
  const [urlError, setUrlError] = useState<string | null>(null);
  const [amazonTagError, setAmazonTagError] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);

  // API hooks
  const { createLink } = useLinks(false);
  const { data: amazonTags, isLoading: isLoadingTags } = useAmazonTags();
  const { data: channels, isLoading: isLoadingChannels } = useChannels();

  // Set default selections when data is loaded
  useEffect(() => {
    if (amazonTags && amazonTags.length > 0 && !selectedAmazonTagId) {
      const defaultTag = amazonTags.find(tag => tag.isDefault) || amazonTags[0];
      setSelectedAmazonTagId(defaultTag.id);
    }
  }, [amazonTags, selectedAmazonTagId]);

  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannelId) {
      const defaultChannel = channels.find(channel => channel.isDefault) || channels[0];
      setSelectedChannelId(defaultChannel.id);
    }
  }, [channels, selectedChannelId]);

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

  // Validate Amazon Tag selection
  const validateAmazonTag = useCallback((tagId: string): string | null => {
    if (!tagId) return 'Seleziona un Amazon Tag';
    if (!amazonTags?.find(tag => tag.id === tagId)) {
      return 'Amazon Tag non valido';
    }
    return null;
  }, [amazonTags]);

  // Validate Channel selection
  const validateChannel = useCallback((channelId: string): string | null => {
    if (!channelId) return 'Seleziona un Canale';
    if (!channels?.find(channel => channel.id === channelId)) {
      return 'Canale non valido';
    }
    return null;
  }, [channels]);

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

  // Handle Amazon Tag selection change
  const handleAmazonTagChange = (tagId: string) => {
    setSelectedAmazonTagId(tagId);
    const error = validateAmazonTag(tagId);
    setAmazonTagError(error);
  };

  // Handle Channel selection change
  const handleChannelChange = (channelId: string) => {
    setSelectedChannelId(channelId);
    const error = validateChannel(channelId);
    setChannelError(error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const urlValidationError = validateUrl(originalUrl);
    const tagValidationError = validateAmazonTag(selectedAmazonTagId);
    const channelValidationError = validateChannel(selectedChannelId);

    if (urlValidationError) {
      setUrlError(urlValidationError);
      return;
    }

    if (tagValidationError) {
      setAmazonTagError(tagValidationError);
      return;
    }

    if (channelValidationError) {
      setChannelError(channelValidationError);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const linkData = {
        originalUrl,
        tag: tag.trim() || undefined,
        amazonTagId: selectedAmazonTagId,
        channelId: selectedChannelId,
        metadata: {
          createdVia: 'dashboard',
          userAgent: navigator.userAgent
        }
      };

      const result = await createLink(linkData);
      
      // ✅ CRITICAL FIX: Handle standardized API response structure
      // Backend returns: { success: true, data: { link: {...} } }
      // But the hook might already extract the link object for us
      let linkObject: any;
      
      if (result && typeof result === 'object') {
        // Try different possible response structures
        linkObject = (result as any)?.data?.link || 
                     (result as any)?.link || 
                     result;
      } else {
        linkObject = result;
      }
      
      if (!linkObject || !linkObject.hash) {
        console.error('Invalid response from server:', result);
        throw new Error('Invalid response from server');
      }
      
      setCreatedLink(linkObject);
      
      // Reset form
      setOriginalUrl('');
      setTag('');
      setUrlError(null);
      setAmazonTagError(null);
      setChannelError(null);
      
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

  // Get selected Amazon Tag and Channel for display
  const selectedAmazonTag = amazonTags?.find(tag => tag.id === selectedAmazonTagId);
  const selectedChannel = channels?.find(channel => channel.id === selectedChannelId);

  // Check if form is valid
  const isFormValid = originalUrl && 
                     selectedAmazonTagId && 
                     selectedChannelId && 
                     !urlError && 
                     !amazonTagError && 
                     !channelError;

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
                <p className="text-gray-400 text-sm">Inserisci l'URL e seleziona i tuoi tag e canali</p>
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

              {/* Amazon Tag Selection - Custom Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Amazon Tag <span className="text-red-400">*</span>
                </label>
                <CustomDropdown
                  value={selectedAmazonTagId}
                  onChange={handleAmazonTagChange}
                  placeholder={isLoadingTags ? 'Caricamento...' : 'Seleziona Amazon Tag'}
                  disabled={isCreating || isLoadingTags}
                  error={!!amazonTagError}
                  icon={<Store className="h-5 w-5 text-gray-400" />}
                  gradient="from-orange-500/20 to-amber-500/20"
                  borderColor="orange-500/50"
                  options={amazonTags?.map((tag) => ({
                    value: tag.id,
                    label: tag.name,
                    subtitle: `${tag.tag} - ${tag.marketplace}`,
                    isDefault: tag.isDefault,
                    icon: getAmazonMarketplaceIcon(tag.marketplace)
                  })) || []}
                />
                {amazonTagError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {amazonTagError}
                  </div>
                )}
                {selectedAmazonTag && !amazonTagError && (
                  <div className="flex items-center gap-2 text-orange-400 text-sm">
                    <Check className="h-4 w-4" />
                    Tag: {selectedAmazonTag.tag} - Marketplace: {selectedAmazonTag.marketplace}
                  </div>
                )}
              </div>

              {/* Channel Selection - Custom Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Canale <span className="text-red-400">*</span>
                </label>
                <CustomDropdown
                  value={selectedChannelId}
                  onChange={handleChannelChange}
                  placeholder={isLoadingChannels ? 'Caricamento...' : 'Seleziona Canale'}
                  disabled={isCreating || isLoadingChannels}
                  error={!!channelError}
                  icon={<Tv className="h-5 w-5 text-gray-400" />}
                  gradient="from-purple-500/20 to-pink-500/20"
                  borderColor="purple-500/50"
                  options={channels?.map((channel) => ({
                    value: channel.id,
                    label: channel.name,
                    subtitle: channel.type + (channel.url ? ` - ${channel.url}` : ''),
                    isDefault: channel.isDefault,
                    icon: getChannelIcon(channel.type)
                  })) || []}
                />
                {channelError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {channelError}
                  </div>
                )}
                {selectedChannel && !channelError && (
                  <div className="flex items-center gap-2 text-purple-400 text-sm">
                    <Check className="h-4 w-4" />
                    Canale: {selectedChannel.name} ({selectedChannel.type})
                  </div>
                )}
              </div>

              {/* Tag Input */}
              <div className="space-y-2">
                <label htmlFor="tag" className="block text-sm font-medium text-white">
                  Tag Personalizzato (Opzionale)
                </label>
                <div className="relative">
                  <input
                    id="tag"
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="es. iphone-15-review, tech-gadgets"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 
                             focus:border-green-500/50 transition-all duration-200"
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
                disabled={isCreating || !isFormValid}
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

                {/* Link Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-800/30 rounded-xl">
                    <div className="text-gray-400 text-xs font-medium mb-1">Amazon Tag</div>
                    <div className="text-orange-400 text-sm font-medium">
                      {selectedAmazonTag?.name || 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-xl">
                    <div className="text-gray-400 text-xs font-medium mb-1">Canale</div>
                    <div className="text-purple-400 text-sm font-medium">
                      {selectedChannel?.name || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Link Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-800/30 rounded-xl">
                    <div className="text-xl font-bold text-white">{createdLink.clickCount || 0}</div>
                    <div className="text-xs text-gray-400">Click</div>
                  </div>
                  <div className="text-center p-3 bg-slate-800/30 rounded-xl">
                    <div className="text-xl font-bold text-white">{createdLink.conversionCount || 0}</div>
                    <div className="text-xs text-gray-400">Conversioni</div>
                  </div>
                  <div className="text-center p-3 bg-slate-800/30 rounded-xl">
                    <div className="text-xl font-bold text-white">€{(createdLink.totalRevenue || 0).toFixed(2)}</div>
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
                <div className="flex items-center gap-2 text-orange-400 mb-1">
                  <Store className="w-4 h-4" />
                  <span className="font-medium text-sm">Amazon Tag</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Seleziona il tag corretto per il marketplace dell'URL
                </p>
              </div>
              
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Tv className="w-4 h-4" />
                  <span className="font-medium text-sm">Canale</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Organizza i link per canale per analizzare le performance
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
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-sm">Timing</span>
                </div>
                <p className="text-gray-300 text-xs">
                  I link sono attivi immediatamente e iniziano a tracciare i click
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          {(selectedAmazonTag || selectedChannel) && (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Configurazione Selezionata</h3>
              
              <div className="space-y-3">
                {selectedAmazonTag && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-orange-400 mb-1">
                      <Store className="w-4 h-4" />
                      <span className="font-medium text-sm">Amazon Tag</span>
                    </div>
                    <div className="text-white text-sm font-medium">{selectedAmazonTag.name}</div>
                    <div className="text-gray-400 text-xs">
                      {selectedAmazonTag.tag} - {selectedAmazonTag.marketplace}
                    </div>
                  </div>
                )}
                
                {selectedChannel && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <Tv className="w-4 h-4" />
                      <span className="font-medium text-sm">Canale</span>
                    </div>
                    <div className="text-white text-sm font-medium">{selectedChannel.name}</div>
                    <div className="text-gray-400 text-xs">
                      {selectedChannel.type}
                      {selectedChannel.url && ` - ${selectedChannel.url}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Supported Platforms */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Piattaforme Supportate</h3>
            
            <div className="space-y-3">
              {[
                { name: 'Amazon', icon: <ShoppingCart className="w-4 h-4" />, color: 'bg-orange-500/20 text-orange-400', status: 'Ottimizzato' },
                { name: 'eBay', icon: <Store className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400', status: 'Supportato' },
                { name: 'AliExpress', icon: <Package className="w-4 h-4" />, color: 'bg-red-500/20 text-red-400', status: 'Supportato' },
                { name: 'Etsy', icon: <Building2 className="w-4 h-4" />, color: 'bg-green-500/20 text-green-400', status: 'Supportato' },
                { name: 'Altri E-commerce', icon: <Globe className="w-4 h-4" />, color: 'bg-gray-500/20 text-gray-400', status: 'Generale' }
              ].map((platform, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center`}>
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
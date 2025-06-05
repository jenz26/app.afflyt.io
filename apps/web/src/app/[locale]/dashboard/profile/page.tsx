// apps/web/src/app/[locale]/dashboard/profile/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  useUserProfile, 
  useAmazonTags, 
  useChannels,
  AMAZON_MARKETPLACES,
  CHANNEL_TYPES,
  type AmazonTag,
  type Channel,
  type CreateAmazonTagData,
  type CreateChannelData
} from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Mail, 
  Globe, 
  Building, 
  ShoppingCart, 
  Save, 
  Check, 
  AlertCircle, 
  Loader2, 
  Shield,
  Key,
  Settings,
  RefreshCw,
  ExternalLink,
  Info,
  Crown,
  Calendar,
  Plus,
  Star,
  Edit2,
  Trash2,
  MapPin,
  DollarSign,
  TrendingUp,
  Eye,
  EyeOff,
  ChevronDown,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ProfileSettingsPage() {
  // Hooks
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError, 
    updateProfile,
    validateAmazonTag,
    validateWebsiteUrl,
    refetch
  } = useUserProfile();
  
  const {
    data: amazonTags,
    isLoading: tagsLoading,
    error: tagsError,
    createAmazonTag,
    updateAmazonTag,
    deleteAmazonTag,
    refetch: refetchTags
  } = useAmazonTags();

  const {
    data: channels,
    isLoading: channelsLoading,
    error: channelsError,
    createChannel,
    updateChannel,
    deleteChannel,
    refetch: refetchChannels
  } = useChannels();
  
  const { user, userRole, isEmailVerified } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    amazonAssociateTag: '',
    websiteUrl: '',
    companyName: ''
  });

  // UI state
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Dirty tracking
  const [isDirty, setIsDirty] = useState(false);

  // Modal states for Multi-Tags and Multi-Channels
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [editingTag, setEditingTag] = useState<AmazonTag | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  // Form data for new/edit tag
  const [tagForm, setTagForm] = useState<CreateAmazonTagData>({
    tag: '',
    marketplace: 'it',
    name: '',
    isDefault: false
  });

  // Form data for new/edit channel
  const [channelForm, setChannelForm] = useState<CreateChannelData>({
    name: '',
    type: 'website',
    url: '',
    description: '',
    isDefault: false,
    defaultAmazonTagId: ''
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        amazonAssociateTag: profile.amazonAssociateTag || '',
        websiteUrl: profile.websiteUrl || '',
        companyName: profile.companyName || ''
      });
    }
  }, [profile]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setUpdateSuccess(false);
    setUpdateError(null);
    
    // Clear field-specific validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
    
    // Real-time validation for specific fields
    if (field === 'amazonAssociateTag' && value) {
      const error = validateAmazonTag(value);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
      }
    }
    
    if (field === 'websiteUrl' && value) {
      const error = validateWebsiteUrl(value);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
      }
    }
  }, [validationErrors, validateAmazonTag, validateWebsiteUrl]);

  // Validate entire form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // Amazon tag validation
    if (formData.amazonAssociateTag) {
      const amazonError = validateAmazonTag(formData.amazonAssociateTag);
      if (amazonError) errors.amazonAssociateTag = amazonError;
    }

    // Website URL validation
    if (formData.websiteUrl) {
      const urlError = validateWebsiteUrl(formData.websiteUrl);
      if (urlError) errors.websiteUrl = urlError;
    }

    // Email validation (basic)
    if (formData.name && formData.name.length < 2) {
      errors.name = 'Il nome deve essere di almeno 2 caratteri';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateAmazonTag, validateWebsiteUrl]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Prepare update data (only send non-empty fields)
      const updateData: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value.trim()) {
          updateData[key] = value.trim();
        }
      });

      await updateProfile(updateData);
      
      setUpdateSuccess(true);
      setIsDirty(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
      
    } catch (err: any) {
      setUpdateError(err.message || 'Errore durante l\'aggiornamento del profilo');
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset form to original values
  const handleReset = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        amazonAssociateTag: profile.amazonAssociateTag || '',
        websiteUrl: profile.websiteUrl || '',
        companyName: profile.companyName || ''
      });
      setIsDirty(false);
      setValidationErrors({});
      setUpdateError(null);
    }
  };

  // Amazon Tag Modal Handlers
  const handleCreateTag = async () => {
    try {
      await createAmazonTag(tagForm);
      setShowAddTagModal(false);
      setTagForm({ tag: '', marketplace: 'it', name: '', isDefault: false });
    } catch (err: any) {
      console.error('Error creating Amazon tag:', err);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;
    
    try {
      await updateAmazonTag(editingTag.id, {
        tag: tagForm.tag,
        name: tagForm.name,
        isDefault: tagForm.isDefault
      });
      setEditingTag(null);
      setTagForm({ tag: '', marketplace: 'it', name: '', isDefault: false });
    } catch (err: any) {
      console.error('Error updating Amazon tag:', err);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo Amazon tag?')) {
      try {
        await deleteAmazonTag(tagId);
      } catch (err: any) {
        console.error('Error deleting Amazon tag:', err);
      }
    }
  };

  // Channel Modal Handlers
  const handleCreateChannel = async () => {
    try {
      await createChannel(channelForm);
      setShowAddChannelModal(false);
      setChannelForm({ name: '', type: 'website', url: '', description: '', isDefault: false, defaultAmazonTagId: '' });
    } catch (err: any) {
      console.error('Error creating channel:', err);
    }
  };

  const handleUpdateChannel = async () => {
    if (!editingChannel) return;
    
    try {
      await updateChannel(editingChannel.id, {
        name: channelForm.name,
        type: channelForm.type,
        url: channelForm.url,
        description: channelForm.description,
        isDefault: channelForm.isDefault,
        defaultAmazonTagId: channelForm.defaultAmazonTagId
      });
      setEditingChannel(null);
      setChannelForm({ name: '', type: 'website', url: '', description: '', isDefault: false, defaultAmazonTagId: '' });
    } catch (err: any) {
      console.error('Error updating channel:', err);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo canale?')) {
      try {
        await deleteChannel(channelId);
      } catch (err: any) {
        console.error('Error deleting channel:', err);
      }
    }
  };

  // Helper functions
  const getMarketplaceInfo = (code: string) => 
    AMAZON_MARKETPLACES.find(m => m.code === code) || { code, name: code, flag: '🌐' };

  const getChannelTypeInfo = (code: string) => 
    CHANNEL_TYPES.find(t => t.code === code) || { code, name: code, icon: '📦' };

  if (profileLoading && !profile) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="h-96 bg-slate-700 rounded-2xl"></div>
            </div>
            <div className="xl:col-span-1">
              <div className="h-64 bg-slate-700 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Errore caricamento profilo</p>
              <p className="text-sm text-gray-400">{profileError}</p>
            </div>
          </div>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <User className="h-6 w-6 text-indigo-400" />
            </div>
            Impostazioni Profilo
          </h1>
          <p className="text-gray-400">
            Gestisci le tue informazioni personali, Amazon tags e canali
          </p>
        </div>
        
        {/* Account Status */}
        <div className="hidden lg:flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
            isEmailVerified 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {isEmailVerified ? (
              <>
                <Check className="w-4 h-4" />
                Verificato
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Da verificare
              </>
            )}
          </div>
          {userRole === 'admin' && (
            <div className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Crown className="w-4 h-4" />
              Admin
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content - 2/3 width */}
        <div className="xl:col-span-2 space-y-6">
          {/* Profile Information Form */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Informazioni Personali</h2>
                <p className="text-gray-400 text-sm">Aggiorna i tuoi dati di base</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-medium text-white">
                    Nome
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                    placeholder="Mario"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                             focus:border-blue-500/50 transition-all duration-200"
                    disabled={isUpdating}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-medium text-white">
                    Cognome
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                    placeholder="Rossi"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                             focus:border-blue-500/50 transition-all duration-200"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-white">
                  Nome Visualizzato
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Mario Rossi"
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white 
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                           focus:border-blue-500/50 transition-all duration-200 ${
                             validationErrors.name ? 'border-red-500/50' : 'border-white/10'
                           }`}
                  disabled={isUpdating}
                />
                {validationErrors.name && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.name}
                  </div>
                )}
              </div>

              {/* Email Display (Read-only) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile?.email || ''}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-700/30 border border-white/5 rounded-xl text-gray-400 
                             cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
                <p className="text-gray-500 text-xs">
                  L'email non può essere modificata. Contatta il supporto se necessario.
                </p>
              </div>

              {/* Business Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="companyName" className="block text-sm font-medium text-white">
                    Nome Azienda
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleFieldChange('companyName', e.target.value)}
                    placeholder="La Mia Azienda S.r.l."
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 
                             focus:border-green-500/50 transition-all duration-200"
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* ✨ NEW: Amazon Tags Management */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                  <ShoppingCart className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Amazon Tags</h2>
                  <p className="text-gray-400 text-sm">Gestisci i tuoi Amazon Associate Tags per marketplace</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTagModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Tag
              </button>
            </div>

            {tagsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
              </div>
            ) : amazonTags && amazonTags.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {amazonTags.map((tag) => {
                  const marketplace = getMarketplaceInfo(tag.marketplace);
                  return (
                    <div key={tag.id} className="bg-slate-700/30 rounded-xl p-4 border border-white/5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{marketplace.flag}</span>
                          <div>
                            <h3 className="text-white font-medium">{tag.name}</h3>
                            <p className="text-gray-400 text-sm">{marketplace.name}</p>
                          </div>
                          {tag.isDefault && (
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTag(tag);
                              setTagForm({
                                tag: tag.tag,
                                marketplace: tag.marketplace,
                                name: tag.name,
                                isDefault: tag.isDefault
                              });
                            }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Tag:</span>
                          <span className="text-orange-400 font-mono">{tag.tag}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-white font-medium">{tag.linksCreated}</div>
                            <div className="text-gray-400">Links</div>
                          </div>
                          <div className="text-center">
                            <div className="text-white font-medium">{tag.totalClicks}</div>
                            <div className="text-gray-400">Clicks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-400 font-medium">€{tag.totalRevenue.toFixed(2)}</div>
                            <div className="text-gray-400">Revenue</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nessun Amazon tag configurato</p>
                <button
                  onClick={() => setShowAddTagModal(true)}
                  className="mt-2 text-orange-400 hover:text-orange-300 text-sm"
                >
                  Aggiungi il tuo primo tag →
                </button>
              </div>
            )}
          </div>

          {/* ✨ NEW: Channels Management */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                  <Globe className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Canali</h2>
                  <p className="text-gray-400 text-sm">Gestisci i tuoi siti web, social media e altri canali</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddChannelModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Canale
              </button>
            </div>

            {channelsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-green-400" />
              </div>
            ) : channels && channels.length > 0 ? (
              <div className="space-y-4">
                {channels.map((channel) => {
                  const typeInfo = getChannelTypeInfo(channel.type);
                  return (
                    <div key={channel.id} className="bg-slate-700/30 rounded-xl p-4 border border-white/5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{typeInfo.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-medium">{channel.name}</h3>
                              {channel.isDefault && (
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">{typeInfo.name}</p>
                            {channel.url && (
                              <a 
                                href={channel.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-400 text-sm hover:text-green-300 flex items-center gap-1"
                              >
                                {channel.url}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingChannel(channel);
                              setChannelForm({
                                name: channel.name,
                                type: channel.type,
                                url: channel.url || '',
                                description: channel.description || '',
                                isDefault: channel.isDefault,
                                defaultAmazonTagId: channel.defaultAmazonTagId || ''
                              });
                            }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(channel.id)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                      
                      {channel.description && (
                        <p className="text-gray-400 text-sm mb-3">{channel.description}</p>
                      )}
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-white font-medium">{channel.linksCreated}</div>
                          <div className="text-gray-400">Links</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-medium">{channel.totalClicks}</div>
                          <div className="text-gray-400">Clicks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-400 font-medium">€{channel.totalRevenue.toFixed(2)}</div>
                          <div className="text-gray-400">Revenue</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nessun canale configurato</p>
                <button
                  onClick={() => setShowAddChannelModal(true)}
                  className="mt-2 text-green-400 hover:text-green-300 text-sm"
                >
                  Aggiungi il tuo primo canale →
                </button>
              </div>
            )}
          </div>

          {/* Legacy Amazon Integration (Backward Compatibility) */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-yellow-500/30">
                <Info className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Impostazioni Legacy</h3>
                <p className="text-gray-400 text-sm">Campi di compatibilità con la versione precedente</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="amazonTag" className="block text-sm font-medium text-white">
                  Amazon Associate Tag (Legacy)
                </label>
                <input
                  id="amazonTag"
                  type="text"
                  value={formData.amazonAssociateTag}
                  onChange={(e) => handleFieldChange('amazonAssociateTag', e.target.value)}
                  placeholder="miosito-21"
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white 
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 
                           focus:border-orange-500/50 transition-all duration-200 ${
                             validationErrors.amazonAssociateTag ? 'border-red-500/50' : 'border-white/10'
                           }`}
                  disabled={isUpdating}
                />
                {validationErrors.amazonAssociateTag && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.amazonAssociateTag}
                  </div>
                )}
                {formData.amazonAssociateTag && !validationErrors.amazonAssociateTag && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Check className="h-4 w-4" />
                    Tag valido per tracking affiliate
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-white">
                  Sito Web (Legacy)
                </label>
                <div className="relative">
                  <input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                    placeholder="https://www.miosito.it"
                    className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 
                             focus:border-green-500/50 transition-all duration-200 ${
                               validationErrors.websiteUrl ? 'border-red-500/50' : 'border-white/10'
                             }`}
                    disabled={isUpdating}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {validationErrors.websiteUrl && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.websiteUrl}
                  </div>
                )}
                {formData.websiteUrl && !validationErrors.websiteUrl && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Check className="h-4 w-4" />
                    URL valido
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-300 text-sm">
                💡 <strong>Suggerimento:</strong> Usa i nuovi Amazon Tags e Canali per una gestione più avanzata. 
                Questi campi legacy sono mantenuti per compatibilità.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              {isDirty && (
                <span className="text-yellow-400 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Ci sono modifiche non salvate
                </span>
              )}
              {updateSuccess && (
                <span className="text-green-400 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Profilo aggiornato con successo
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isUpdating}
                  className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 
                           disabled:opacity-50 disabled:cursor-not-allowed rounded-lg 
                           transition-colors text-sm font-medium"
                >
                  Annulla
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={isUpdating || !isDirty || Object.keys(validationErrors).length > 0}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                         hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 
                         disabled:to-gray-700 disabled:cursor-not-allowed text-white 
                         rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aggiornamento...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {updateError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Errore aggiornamento</span>
              </div>
              <p className="text-red-300 text-sm mt-1">{updateError}</p>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="xl:col-span-1 space-y-6">
          {/* Account Overview */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                <Shield className="h-4 w-4 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Account Overview</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Status Account</span>
                  <span className={`text-sm font-medium ${
                    isEmailVerified ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {isEmailVerified ? 'Attivo' : 'In verifica'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Ruolo</span>
                  <span className="text-white text-sm font-medium capitalize">
                    {userRole === 'affiliate' ? 'Affiliato' : userRole === 'admin' ? 'Admin' : userRole}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Amazon Tags</span>
                  <span className="text-orange-400 text-sm font-medium">
                    {amazonTags?.length || 0}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Canali</span>
                  <span className="text-green-400 text-sm font-medium">
                    {channels?.length || 0}
                  </span>
                </div>
              </div>

              {profile?.createdAt && (
                <div className="p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Membro dal</span>
                    <span className="text-white text-sm font-medium">
                      {format(new Date(profile.createdAt), 'MMM yyyy', { locale: it })}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Balance</span>
                  <span className="text-green-400 text-sm font-medium">
                    €{(profile?.balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-400" />
              Azioni Rapide
            </h3>
            
            <div className="space-y-3">
              <button className="w-full p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-yellow-400" />
                  <div>
                    <div className="text-white font-medium text-sm">Gestisci API Keys</div>
                    <div className="text-gray-400 text-xs">Crea e gestisci le tue chiavi API</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-white ml-auto" />
                </div>
              </button>

              <button 
                onClick={() => {
                  refetch();
                  refetchTags();
                  refetchChannels();
                }}
                className="w-full p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium text-sm">Aggiorna Dati</div>
                    <div className="text-gray-400 text-xs">Ricarica tutte le informazioni</div>
                  </div>
                </div>
              </button>

              <div className="p-3 bg-slate-700/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium text-sm">Ultimo Accesso</div>
                    <div className="text-gray-400 text-xs">
                      {profile?.lastLoginAt 
                        ? format(new Date(profile.lastLoginAt), 'dd/MM/yyyy HH:mm', { locale: it })
                        : 'Mai'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-blue-400" />
              <h3 className="text-white font-bold text-sm">Sicurezza Account</h3>
            </div>
            <p className="text-blue-300 text-xs mb-3">
              Le tue informazioni sono protette con crittografia end-to-end. 
              Non condividiamo mai i tuoi dati con terze parti.
            </p>
            <button className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
              Scopri di più sulla sicurezza →
            </button>
          </div>
        </div>
      </div>

      {/* ✨ Amazon Tag Modal */}
      {(showAddTagModal || editingTag) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingTag ? 'Modifica Amazon Tag' : 'Nuovo Amazon Tag'}
              </h3>
              <button
                onClick={() => {
                  setShowAddTagModal(false);
                  setEditingTag(null);
                  setTagForm({ tag: '', marketplace: 'it', name: '', isDefault: false });
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nome Tag</label>
                <input
                  type="text"
                  value={tagForm.name}
                  onChange={(e) => setTagForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="es. Main IT Tag"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Amazon Tag</label>
                <input
                  type="text"
                  value={tagForm.tag}
                  onChange={(e) => setTagForm(prev => ({ ...prev, tag: e.target.value }))}
                  placeholder="miosito-21"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Marketplace</label>
                <select
                  value={tagForm.marketplace}
                  onChange={(e) => setTagForm(prev => ({ ...prev, marketplace: e.target.value }))}
                  disabled={!!editingTag}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50"
                >
                  {AMAZON_MARKETPLACES.map(marketplace => (
                    <option key={marketplace.code} value={marketplace.code}>
                      {marketplace.flag} {marketplace.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultTag"
                  checked={tagForm.isDefault}
                  onChange={(e) => setTagForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded border-white/20 bg-slate-700/50 text-orange-500 focus:ring-orange-500/50"
                />
                <label htmlFor="isDefaultTag" className="text-sm text-white">
                  Imposta come predefinito per questo marketplace
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTagModal(false);
                  setEditingTag(null);
                  setTagForm({ tag: '', marketplace: 'it', name: '', isDefault: false });
                }}
                className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={editingTag ? handleUpdateTag : handleCreateTag}
                disabled={!tagForm.name || !tagForm.tag}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all"
              >
                {editingTag ? 'Aggiorna' : 'Crea Tag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ Channel Modal */}
      {(showAddChannelModal || editingChannel) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingChannel ? 'Modifica Canale' : 'Nuovo Canale'}
              </h3>
              <button
                onClick={() => {
                  setShowAddChannelModal(false);
                  setEditingChannel(null);
                  setChannelForm({ name: '', type: 'website', url: '', description: '', isDefault: false, defaultAmazonTagId: '' });
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nome Canale</label>
                <input
                  type="text"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="es. Il Mio Blog Tech"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Tipo</label>
                <select
                  value={channelForm.type}
                  onChange={(e) => setChannelForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  {CHANNEL_TYPES.map(type => (
                    <option key={type.code} value={type.code}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">URL (opzionale)</label>
                <input
                  type="url"
                  value={channelForm.url}
                  onChange={(e) => setChannelForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://www.miosito.it"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Descrizione (opzionale)</label>
                <textarea
                  value={channelForm.description}
                  onChange={(e) => setChannelForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrizione del canale..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Amazon Tag Predefinito</label>
                <select
                  value={channelForm.defaultAmazonTagId}
                  onChange={(e) => setChannelForm(prev => ({ ...prev, defaultAmazonTagId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="">Nessuno</option>
                  {amazonTags?.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {getMarketplaceInfo(tag.marketplace).flag} {tag.name} ({tag.tag})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultChannel"
                  checked={channelForm.isDefault}
                  onChange={(e) => setChannelForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded border-white/20 bg-slate-700/50 text-green-500 focus:ring-green-500/50"
                />
                <label htmlFor="isDefaultChannel" className="text-sm text-white">
                  Imposta come canale predefinito
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddChannelModal(false);
                  setEditingChannel(null);
                  setChannelForm({ name: '', type: 'website', url: '', description: '', isDefault: false, defaultAmazonTagId: '' });
                }}
                className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={editingChannel ? handleUpdateChannel : handleCreateChannel}
                disabled={!channelForm.name}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all"
              >
                {editingChannel ? 'Aggiorna' : 'Crea Canale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
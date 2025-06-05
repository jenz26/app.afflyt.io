// apps/web/src/app/[locale]/dashboard/api-keys/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useApiKeys } from '@/hooks/useApi';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Activity,
  Calendar,
  Settings,
  Zap,
  Clock,
  Users,
  Globe,
  Code,
  ExternalLink,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ApiKeyData {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  keyPreview: string;
  usageCount?: number;
  key?: string; // Full key only available on creation
}

export default function ApiKeysPage() {
  // API hook
  const { data: apiKeys, isLoading, error, createApiKey, updateApiKey, deleteApiKey } = useApiKeys();

  // State management
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyData | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Create new API key
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    
    try {
      const result = await createApiKey(newKeyName.trim());
      setCreatedKey(result);
      setNewKeyName('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create API key:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle API key status
  const handleToggleStatus = async (keyId: string, isActive: boolean) => {
    try {
      await updateApiKey(keyId, { isActive: !isActive });
    } catch (err) {
      console.error('Failed to toggle API key status:', err);
    }
  };

  // Start editing key name
  const startEditing = (keyId: string, currentName: string) => {
    setEditingKeyId(keyId);
    setEditingName(currentName);
  };

  // Save edited name
  const saveEdit = async (keyId: string) => {
    if (!editingName.trim()) return;
    
    try {
      await updateApiKey(keyId, { name: editingName.trim() });
      setEditingKeyId(null);
      setEditingName('');
    } catch (err) {
      console.error('Failed to update API key:', err);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingKeyId(null);
    setEditingName('');
  };

  // Delete API key
  const handleDelete = async (keyId: string) => {
    try {
      await deleteApiKey(keyId);
      setDeletingKeyId(null);
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ora';
    if (diffInMinutes < 60) return `${diffInMinutes}m fa`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h fa`;
    return format(date, 'dd MMM yyyy', { locale: it });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Key className="h-6 w-6 text-blue-400" />
            </div>
            API Keys Management
          </h1>
          <p className="text-gray-400">
            Gestisci le tue chiavi API per accedere ai servizi Afflyt.io
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{apiKeys?.length || 0}/10</div>
            <div className="text-xs text-gray-400">Keys attive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {apiKeys?.filter(key => key.isActive).length || 0}
            </div>
            <div className="text-xs text-gray-400">Abilitate</div>
          </div>
        </div>
      </div>

      {/* Create New Key Success Display */}
      {createdKey && (
        <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-400">API Key Creata con Successo!</h3>
              <p className="text-green-300 text-sm">Salva questa chiave in un luogo sicuro. Non sarà più visualizzata.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">API Key: {createdKey.name}</span>
              <button
                onClick={() => copyToClipboard(createdKey.key || '', 'new-key')}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 
                         rounded-lg text-white text-sm transition-colors"
              >
                {copiedKeyId === 'new-key' ? (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    Copiata!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copia
                  </>
                )}
              </button>
            </div>
            <div className="text-green-400 font-mono text-sm break-all bg-slate-900/50 p-3 rounded-lg">
              {createdKey.key}
            </div>
          </div>

          <button
            onClick={() => setCreatedKey(null)}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 
                     rounded-lg text-white text-sm font-medium transition-colors"
          >
            Ho salvato la chiave
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main API Keys List - 3/4 width */}
        <div className="xl:col-span-3 space-y-6">
          {/* Create New Key Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <Plus className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Nuova API Key</h3>
              </div>
              
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  disabled={apiKeys && apiKeys.length >= 10}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 
                           hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 
                           disabled:to-gray-700 disabled:cursor-not-allowed text-white 
                           rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crea Nuova Key
                </button>
              )}
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label htmlFor="keyName" className="block text-sm font-medium text-white mb-2">
                    Nome API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="es. Mobile App, Website Integration, Analytics Bot"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                             focus:border-purple-500/50 transition-all duration-200"
                    disabled={isCreating}
                    maxLength={50}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Scegli un nome descrittivo per identificare l'uso di questa chiave
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isCreating || !newKeyName.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 
                             hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 
                             disabled:to-gray-700 disabled:cursor-not-allowed text-white 
                             rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creazione...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        Crea API Key
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewKeyName('');
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 
                             rounded-lg text-white font-medium transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </form>
            )}

            {apiKeys && apiKeys.length >= 10 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Limite Raggiunto</span>
                </div>
                <p className="text-yellow-300 text-xs mt-1">
                  Hai raggiunto il limite massimo di 10 API keys. Elimina una chiave esistente per crearne una nuova.
                </p>
              </div>
            )}
          </div>

          {/* API Keys List */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                <Key className="h-4 w-4 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Le Tue API Keys</h3>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 bg-slate-700/30 rounded-xl animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-600 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-600 rounded w-2/3"></div>
                      </div>
                      <div className="h-8 bg-slate-600 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Errore caricamento</span>
                </div>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            ) : !apiKeys || apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-600/20 to-gray-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-500/30">
                  <Key className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Nessuna API Key</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Non hai ancora creato nessuna API key. Creane una per iniziare ad usare i nostri servizi.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 
                           hover:from-purple-700 hover:to-pink-700 text-white rounded-lg 
                           font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Crea Prima API Key
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      apiKey.isActive 
                        ? 'bg-slate-700/30 border-white/10 hover:border-white/20' 
                        : 'bg-slate-700/10 border-gray-600/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        {/* Name - Editable */}
                        <div className="flex items-center gap-2 mb-2">
                          {editingKeyId === apiKey.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 px-3 py-1 bg-slate-600/50 border border-white/20 rounded-lg text-white text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit(apiKey.id);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => saveEdit(apiKey.id)}
                                className="p-1 text-green-400 hover:text-green-300"
                                title="Salva modifica"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 text-gray-400 hover:text-gray-300"
                                title="Annulla modifica"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-white font-medium text-sm truncate">{apiKey.name}</h4>
                              <button
                                onClick={() => startEditing(apiKey.id, apiKey.name)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                title="Modifica nome"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Key Preview */}
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-gray-300 font-mono text-xs bg-slate-800/50 px-2 py-1 rounded">
                            {apiKey.keyPreview}
                          </code>
                          <button
                            onClick={() => copyToClipboard(apiKey.keyPreview, apiKey.id)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title={copiedKeyId === apiKey.id ? "Copiato!" : "Copia preview chiave"}
                          >
                            {copiedKeyId === apiKey.id ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Creata {getRelativeTime(apiKey.createdAt)}
                          </div>
                          {apiKey.lastUsedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Ultima attività {getRelativeTime(apiKey.lastUsedAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* Status Toggle */}
                        <button
                          onClick={() => handleToggleStatus(apiKey.id, apiKey.isActive)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            apiKey.isActive
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                          }`}
                        >
                          {apiKey.isActive ? (
                            <>
                              <Eye className="h-3 w-3 inline mr-1" />
                              Attiva
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 inline mr-1" />
                              Disattiva
                            </>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeletingKeyId(apiKey.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Elimina API key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1/4 width */}
        <div className="xl:col-span-1 space-y-6">
          {/* API Documentation */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                <Code className="h-4 w-4 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Documentazione API</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium text-sm">Base URL</span>
                </div>
                <code className="text-gray-300 text-xs break-all">
                  https://api.afflyt.io/v1
                </code>
              </div>
              
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium text-sm">Autenticazione</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Aggiungi l'header: <br/>
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </p>
              </div>
              
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="font-medium text-sm">Rate Limits</span>
                </div>
                <p className="text-gray-300 text-xs">
                  1000 richieste/ora per API key
                </p>
              </div>
            </div>
            
            <button className="w-full mt-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                              hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg 
                              font-medium transition-colors flex items-center justify-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Vai alla Docs
            </button>
          </div>

          {/* Security Tips */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                <Shield className="h-4 w-4 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Sicurezza</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-yellow-400 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium text-sm">Non condividere</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Le API keys danno accesso completo al tuo account
                </p>
              </div>
              
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium text-sm">Monitora l'uso</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Controlla regolarmente l'ultima attività
                </p>
              </div>
              
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium text-sm">Disattiva se inutilizzata</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Disabilita keys non più necessarie
                </p>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Statistiche Uso</h3>
            
            <div className="space-y-4">
              <div className="text-center p-3 bg-slate-700/30 rounded-xl">
                <div className="text-2xl font-bold text-white">{apiKeys?.length || 0}</div>
                <div className="text-xs text-gray-400">Keys Totali</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-slate-700/30 rounded-xl">
                  <div className="text-lg font-bold text-green-400">
                    {apiKeys?.filter(key => key.isActive).length || 0}
                  </div>
                  <div className="text-xs text-gray-400">Attive</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-xl">
                  <div className="text-lg font-bold text-gray-400">
                    {apiKeys?.filter(key => !key.isActive).length || 0}
                  </div>
                  <div className="text-xs text-gray-400">Disattive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingKeyId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Conferma Eliminazione</h3>
                <p className="text-gray-400 text-sm">Questa azione non può essere annullata</p>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-6">
              Sei sicuro di voler eliminare questa API key? Tutte le applicazioni che la utilizzano 
              smetteranno di funzionare immediatamente.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deletingKeyId)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg 
                         font-medium transition-colors"
              >
                Elimina Definitivamente
              </button>
              <button
                onClick={() => setDeletingKeyId(null)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 border border-white/20 
                         rounded-lg text-white font-medium transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// apps/web/src/components/support/ContactForm.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Send, CheckCircle, AlertCircle, User, Mail } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactFormProps {
  className?: string;
}

export const ContactForm = ({ className = '' }: ContactFormProps) => {
  // ✅ MIGLIORAMENTO 4: Pre-compilazione per utenti loggati
  const { user, isLoggedIn } = useAuth();
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ✅ Pre-compila i dati se l'utente è loggato
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || user.firstName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
        email: user.email || ''
      }));
    }
  }, [isLoggedIn, user]);

  // ✅ MIGLIORAMENTO 3: useCallback per performance
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // ✅ MIGLIORAMENTO 2: Integrazione con backend API
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id || null,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setIsSubmitted(true);
        
        // Reset form dopo 3 secondi
        setTimeout(() => {
          setIsSubmitted(false);
          // Non resettare nome ed email se l'utente è loggato
          setFormData(prev => ({
            name: isLoggedIn && user ? prev.name : '',
            email: isLoggedIn && user ? prev.email : '',
            subject: '',
            message: ''
          }));
        }, 3000);
      } else {
        throw new Error(result.message || 'Errore durante l\'invio');
      }
      
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'Errore durante l\'invio. Riprova tra qualche minuto.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, user, isLoggedIn]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  }, [submitError]);

  // Success State
  if (isSubmitted) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Messaggio Inviato!</h3>
        <p className="text-gray-400 mb-4">
          Grazie per averci contattato. Risponderemo entro 24 ore all'indirizzo:
        </p>
        <p className="text-green-400 font-medium">{formData.email}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 ${className}`}>
      {/* Error State */}
      {submitError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-400 font-medium mb-1">Errore di invio</h4>
            <p className="text-red-300 text-sm">{submitError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Nome *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={isLoggedIn && !!user?.name}
              className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                isLoggedIn && !!user?.name ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              placeholder="Il tuo nome"
            />
          </div>
          {isLoggedIn && user?.name && (
            <p className="text-xs text-gray-500 mt-1">Campo pre-compilato dal tuo profilo</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoggedIn && !!user?.email}
              className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                isLoggedIn && !!user?.email ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              placeholder="la-tua-email@esempio.com"
            />
          </div>
          {isLoggedIn && user?.email && (
            <p className="text-xs text-gray-500 mt-1">Campo pre-compilato dal tuo profilo</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
          Categoria *
        </label>
        <select
          id="subject"
          name="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          <option value="">Seleziona la categoria</option>
          <option value="technical">🔧 Problema Tecnico</option>
          <option value="billing">💳 Fatturazione</option>
          <option value="feature">💡 Richiesta Funzionalità</option>
          <option value="api">⚡ Supporto API</option>
          <option value="account">👤 Account e Profilo</option>
          <option value="analytics">📊 Analytics e Statistiche</option>
          <option value="other">❓ Altro</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
          Messaggio *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="Descrivi il tuo problema o la tua domanda in dettaglio..."
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">Più dettagli fornisci, meglio possiamo aiutarti</p>
          <p className="text-xs text-gray-500">{formData.message.length}/1000</p>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || !formData.name || !formData.email || !formData.subject || !formData.message}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Invio in corso...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Invia Messaggio
          </>
        )}
      </button>
      
      {/* Privacy Notice */}
      <p className="text-xs text-gray-500 text-center">
        Inviando questo modulo accetti che utilizziamo i tuoi dati per rispondere alla tua richiesta. 
        Non condivideremo mai le tue informazioni con terze parti.
      </p>
    </form>
  );
};
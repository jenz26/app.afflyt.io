// apps/web/src/components/support/ContactForm.tsx
// 🔧 CORRECTED VERSION for v1.8.7 Backend Integration

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

// ✅ CORREZIONE 1: Mapping corretto dei subject per backend v1.8.7
const SUBJECT_MAPPING = {
  'technical': 'technical',
  'billing': 'billing', 
  'feature': 'feature',
  'api': 'technical',        // API → technical (high priority)
  'account': 'account',
  'analytics': 'general',    // Analytics → general
  'other': 'general'         // Other → general
} as const;

const SUBJECT_LABELS = {
  'technical': '🔧 Problema Tecnico',
  'billing': '💳 Fatturazione',
  'feature': '💡 Richiesta Funzionalità', 
  'api': '⚡ Supporto API',
  'account': '👤 Account e Profilo',
  'analytics': '📊 Analytics e Statistiche',
  'other': '❓ Altro'
} as const;

export const ContactForm = ({ className = '' }: ContactFormProps) => {
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
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  // Pre-compila i dati se l'utente è loggato
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || user.firstName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
        email: user.email || ''
      }));
    }
  }, [isLoggedIn, user]);

  // ✅ CORREZIONE 2: URL API corretto e mapping subject
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // ✅ Map frontend subject to backend subject
      const backendSubject = SUBJECT_MAPPING[formData.subject as keyof typeof SUBJECT_MAPPING] || 'general';
      
      // ✅ CORREZIONE 3: URL completo per sviluppo (adatta per produzione)
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/support/ticket'  // Produzione: proxy interno
        : 'http://localhost:3001/api/support/ticket'; // Sviluppo: porta diretta
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: backendSubject,  // ✅ Subject mappato correttamente
          message: formData.message,
          userId: user?.id || undefined,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new Error(`Troppi messaggi inviati. Riprova tra ${errorData.retryAfter || 600} secondi.`);
        }
        
        throw new Error(errorData.error || `Errore ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTicketNumber(result.data.ticketNumber);
        setIsSubmitted(true);
        
        // Reset form dopo 5 secondi (più tempo per leggere il numero ticket)
        setTimeout(() => {
          setIsSubmitted(false);
          setTicketNumber(null);
          // Non resettare nome ed email se l'utente è loggato
          setFormData(prev => ({
            name: isLoggedIn && user ? prev.name : '',
            email: isLoggedIn && user ? prev.email : '',
            subject: '',
            message: ''
          }));
        }, 5000);
      } else {
        throw new Error(result.error || 'Errore durante l\'invio');
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

  // ✅ MIGLIORAMENTO: Success State con numero ticket
  if (isSubmitted) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Messaggio Inviato!</h3>
        <p className="text-gray-400 mb-4">
          Il tuo ticket di supporto è stato creato con successo:
        </p>
        {ticketNumber && (
          <div className="bg-slate-900/50 border border-green-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300 mb-1">Numero Ticket:</p>
            <p className="text-lg font-mono text-green-400 font-bold">{ticketNumber}</p>
            <p className="text-xs text-gray-400 mt-2">
              Salva questo numero per verificare lo stato del ticket
            </p>
          </div>
        )}
        <p className="text-gray-400 mb-2">
          Risponderemo entro 24 ore all'indirizzo:
        </p>
        <p className="text-green-400 font-medium">{formData.email}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 ${className}`}>
      {/* ✅ Error State migliorato con info su rate limiting */}
      {submitError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-400 font-medium mb-1">Errore di invio</h4>
            <p className="text-red-300 text-sm">{submitError}</p>
            {submitError.includes('Troppi messaggi') && (
              <p className="text-red-200 text-xs mt-2">
                Limit: 3 messaggi ogni 10 minuti per prevenire spam
              </p>
            )}
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
          {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {formData.subject && (
          <p className="text-xs text-gray-500 mt-1">
            Priorità: {
              ['technical', 'api'].includes(formData.subject) ? '🔴 Alta' :
              ['billing', 'account'].includes(formData.subject) ? '🟡 Media' : 
              '🟢 Bassa'
            }
          </p>
        )}
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
          maxLength={5000}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">Più dettagli fornisci, meglio possiamo aiutarti</p>
          <p className="text-xs text-gray-500">{formData.message.length}/5000</p>
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
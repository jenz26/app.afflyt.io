// apps/web/src/components/support/TicketLookup.tsx
'use client';

import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';

interface TicketData {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  userId?: string;
}

interface TicketLookupProps {
  className?: string;
}

const STATUS_CONFIG = {
  open: {
    label: 'Aperto',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: '🔵'
  },
  'in-progress': {
    label: 'In Lavorazione',
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: '🟡'
  },
  resolved: {
    label: 'Risolto',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10', 
    borderColor: 'border-green-500/30',
    icon: '🟢'
  },
  closed: {
    label: 'Chiuso',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30', 
    icon: '⚫'
  }
};

const PRIORITY_CONFIG = {
  low: { label: 'Bassa', color: 'text-green-400', icon: '🟢' },
  medium: { label: 'Media', color: 'text-yellow-400', icon: '🟡' },
  high: { label: 'Alta', color: 'text-orange-400', icon: '🟠' },
  urgent: { label: 'Urgente', color: 'text-red-400', icon: '🔴' }
};

const SUBJECT_LABELS = {
  technical: '🔧 Tecnico',
  billing: '💳 Fatturazione', 
  feature: '💡 Funzionalità',
  account: '👤 Account',
  general: '❓ Generale'
};

export const TicketLookup = ({ className = '' }: TicketLookupProps) => {
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketNumber.trim()) {
      setError('Inserisci un numero ticket');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTicket(null);

    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `/api/support/ticket/${ticketNumber.trim()}`
        : `http://localhost:3001/api/support/ticket/${ticketNumber.trim()}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ticket non trovato. Verifica il numero inserito.');
        }
        if (response.status === 429) {
          throw new Error('Troppe richieste. Riprova tra qualche minuto.');
        }
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTicket(result.data);
      } else {
        throw new Error(result.error || 'Errore durante la ricerca');
      }

    } catch (error) {
      console.error('Error looking up ticket:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Errore durante la ricerca. Riprova.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-purple-400" />
        Verifica Stato Ticket
      </h3>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="ticketNumber" className="block text-sm font-medium text-gray-300 mb-2">
            Numero Ticket
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="ticketNumber"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="SUP-2025-123456"
              className="flex-1 px-4 py-3 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !ticketNumber.trim()}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Inserisci il numero ticket che hai ricevuto via email
          </p>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-400 font-medium mb-1">Errore</h4>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Ticket Found */}
      {ticket && (
        <div className="mt-6 space-y-4">
          {/* Status Header */}
          <div className={`${STATUS_CONFIG[ticket.status].bgColor} ${STATUS_CONFIG[ticket.status].borderColor} border rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{STATUS_CONFIG[ticket.status].icon}</div>
                <div>
                  <h4 className="text-white font-medium">Ticket #{ticket.ticketNumber}</h4>
                  <p className={`text-sm ${STATUS_CONFIG[ticket.status].color}`}>
                    Stato: {STATUS_CONFIG[ticket.status].label}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${PRIORITY_CONFIG[ticket.priority].color}`}>
                  {PRIORITY_CONFIG[ticket.priority].icon} Priorità {PRIORITY_CONFIG[ticket.priority].label}
                </p>
                <p className="text-xs text-gray-400">
                  {SUBJECT_LABELS[ticket.subject as keyof typeof SUBJECT_LABELS] || ticket.subject}
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-4 h-4" />
              <span className="text-sm">Da: {ticket.name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Inviato: {formatDate(ticket.submittedAt)}</span>
            </div>

            <div>
              <h5 className="text-white font-medium mb-2">Messaggio:</h5>
              <p className="text-gray-300 text-sm leading-relaxed bg-slate-800/50 p-3 rounded border border-white/5">
                {ticket.message}
              </p>
            </div>
          </div>

          {/* Status Timeline (Future enhancement) */}
          <div className="bg-slate-900/30 border border-white/5 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </h5>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Ticket creato</span>
                <span className="text-gray-500">• {formatDate(ticket.submittedAt)}</span>
              </div>
              {ticket.status !== 'open' && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-300">Preso in carico</span>
                  <span className="text-gray-500">• In lavorazione</span>
                </div>
              )}
              {ticket.status === 'resolved' && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Risolto</span>
                  <span className="text-gray-500">• Completato</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setTicket(null);
                setTicketNumber('');
                setError(null);
              }}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all text-sm"
            >
              Nuova Ricerca
            </button>
            {ticket.status === 'resolved' && (
              <button
                onClick={() => {
                  // Future: Reopen ticket functionality
                  alert('Funzionalità in arrivo: Riaprire ticket risolti');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all text-sm"
              >
                Riapri Ticket
              </button>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      {!ticket && !error && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          <p>Non trovi il numero ticket?</p>
          <p>Controlla la tua email o contattaci direttamente.</p>
        </div>
      )}
    </div>
  );
};
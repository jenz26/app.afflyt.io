// apps/web/src/components/support/MyTickets.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Ticket, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface UserTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  responseCount: number;
}

interface UserTicketsResponse {
  success: boolean;
  data: UserTicket[];
  meta: {
    total: number;
    open: number;
    resolved: number;
  };
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
  low: { label: 'Bassa', color: 'text-green-400' },
  medium: { label: 'Media', color: 'text-yellow-400' },
  high: { label: 'Alta', color: 'text-orange-400' },
  urgent: { label: 'Urgente', color: 'text-red-400' }
};

const SUBJECT_LABELS = {
  technical: '🔧 Tecnico',
  billing: '💳 Fatturazione', 
  feature: '💡 Funzionalità',
  account: '👤 Account',
  general: '❓ Generale'
};

interface MyTicketsProps {
  className?: string;
}

export const MyTickets = ({ className = '' }: MyTicketsProps) => {
  const { user, isLoggedIn } = useAuth();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });

  const loadUserTickets = async () => {
    if (!isLoggedIn || !user?.id) {
      setError('Effettua il login per vedere i tuoi ticket');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `/api/support/user/tickets?userId=${user.id}`
        : `http://localhost:3001/api/support/user/tickets?userId=${user.id}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth header when authentication is implemented
        },
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const result: UserTicketsResponse = await response.json();
      
      if (result.success) {
        setTickets(result.data);
        setStats(result.meta);
      } else {
        throw new Error('Errore durante il caricamento dei ticket');
      }

    } catch (error) {
      console.error('Error loading user tickets:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Errore durante il caricamento dei ticket'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadUserTickets();
    }
  }, [isLoggedIn, user?.id]);

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

  const getResponseTime = (submittedAt: string, firstResponseAt?: string) => {
    if (!firstResponseAt) return null;
    
    const submitted = new Date(submittedAt).getTime();
    const responded = new Date(firstResponseAt).getTime();
    const diffHours = Math.round((responded - submitted) / (1000 * 60 * 60));
    
    return diffHours < 24 ? `${diffHours}h` : `${Math.round(diffHours / 24)}gg`;
  };

  if (!isLoggedIn) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Accedi per vedere i tuoi ticket</h3>
        <p className="text-gray-400">
          Effettua il login per visualizzare lo storico delle tue richieste di supporto
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Ticket className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">I Miei Ticket</h3>
        </div>
        <button
          onClick={loadUserTickets}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Aggiorna"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Totali</div>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.open}</div>
            <div className="text-sm text-gray-400">Aperti</div>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-sm text-gray-400">Risolti</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin mr-3" />
          <span className="text-gray-300">Caricamento ticket...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-400 font-medium mb-1">Errore</h4>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {!loading && !error && (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-500/20 border border-gray-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">Nessun ticket trovato</h4>
              <p className="text-gray-400">Non hai ancora inviato richieste di supporto</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`bg-slate-900/50 border ${STATUS_CONFIG[ticket.status].borderColor} rounded-lg p-4 hover:bg-slate-900/70 transition-colors`}
              >
                {/* Ticket Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{STATUS_CONFIG[ticket.status].icon}</span>
                    <div>
                      <h4 className="text-white font-medium">#{ticket.ticketNumber}</h4>
                      <p className="text-sm text-gray-400">
                        {SUBJECT_LABELS[ticket.subject as keyof typeof SUBJECT_LABELS] || ticket.subject}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${STATUS_CONFIG[ticket.status].color}`}>
                      {STATUS_CONFIG[ticket.status].label}
                    </div>
                    <div className={`text-xs ${PRIORITY_CONFIG[ticket.priority].color}`}>
                      Priorità {PRIORITY_CONFIG[ticket.priority].label}
                    </div>
                  </div>
                </div>

                {/* Ticket Content */}
                <div className="bg-slate-800/50 border border-white/5 rounded p-3 mb-3">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {ticket.message}
                  </p>
                </div>

                {/* Ticket Footer */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(ticket.submittedAt)}
                    </span>
                    {ticket.responseCount > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {ticket.responseCount} risposte
                      </span>
                    )}
                    {ticket.firstResponseAt && (
                      <span className="text-green-400">
                        Risposto in {getResponseTime(ticket.submittedAt, ticket.firstResponseAt)}
                      </span>
                    )}
                  </div>
                  {ticket.resolvedAt && (
                    <span className="text-green-400">
                      Risolto il {formatDate(ticket.resolvedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && !error && tickets.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-sm text-gray-400">
            Hai bisogno di aiuto con un ticket esistente? 
            <button className="text-purple-400 hover:text-purple-300 ml-1">
              Contattaci direttamente
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
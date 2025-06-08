'use client';

import { useEffect } from 'react';
import ErrorButtons from './ErrorButtons';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log dell'errore per debugging (potresti inviarlo a un servizio di monitoring)
    console.error('Preview page error:', error);
  }, [error]);

  // Determina il tipo di errore per mostrare messaggi appropriati
  const getErrorMessage = () => {
    if (error.message.includes('fetch')) {
      return {
        title: 'Problema di connessione',
        description: 'Non riusciamo a caricare i dati del link. Verifica la tua connessione internet.',
        canRetry: true,
      };
    }
    
    if (error.message.includes('timeout')) {
      return {
        title: 'Timeout della richiesta',
        description: 'Il caricamento sta richiedendo troppo tempo. Riprova tra qualche momento.',
        canRetry: true,
      };
    }

    return {
      title: 'Si è verificato un errore',
      description: 'Qualcosa è andato storto durante il caricamento del link.',
      canRetry: true,
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          {/* Icona di errore */}
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600">
            {errorInfo.description}
          </p>
        </div>

        <ErrorButtons canRetry={errorInfo.canRetry} onRetry={reset} />

        {/* Informazioni per il debug (solo in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              Dettagli errore (dev only)
            </summary>
            <pre className="text-xs text-gray-500 bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <p className="text-xs text-gray-500 mt-6">
          Se il problema persiste, contatta il supporto.
        </p>
      </div>
    </div>
  );
}
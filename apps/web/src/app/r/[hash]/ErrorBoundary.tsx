// ===== 🛡️ ERROR BOUNDARY COMPONENT =====
// File: /src/app/r/[hash]/ErrorBoundary.tsx

'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class PreviewErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Preview page error:', error, errorInfo);
    
    // Log per analytics se disponibile
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          reset={() => this.setState({ hasError: false, error: undefined })} 
        />
      );
    }

    return this.props.children;
  }
}

// Fallback UI di default per errori
const DefaultErrorFallback: React.FC<{ error?: Error; reset: () => void }> = ({ error, reset }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            Oops! Qualcosa è andato storto
          </h2>
          
          <p className="text-gray-400 mb-6">
            Si è verificato un errore imprevisto. Puoi provare a ricaricare la pagina.
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left mb-6 p-4 bg-slate-700/50 rounded-lg">
              <summary className="text-red-400 cursor-pointer mb-2">Dettagli errore (dev)</summary>
              <pre className="text-xs text-gray-300 overflow-auto">
                {error.message}
                {error.stack && '\n' + error.stack}
              </pre>
            </details>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
            >
              Ricarica la pagina
            </button>
            
            <button
              onClick={reset}
              className="w-full px-6 py-3 bg-slate-700/50 text-gray-300 font-medium rounded-lg hover:bg-slate-700 transition-all"
            >
              Riprova
            </button>
          </div>
        </div>
        
        {/* Footer Afflyt anche in caso di errore */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-full">
            <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-sm text-gray-400">Powered by</span>
            <span className="text-sm font-semibold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Afflyt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewErrorBoundary;
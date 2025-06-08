'use client';

interface ErrorButtonsProps {
  canRetry: boolean;
  onRetry: () => void;
}

export default function ErrorButtons({ canRetry, onRetry }: ErrorButtonsProps) {
  return (
    <div className="space-y-3">
      {/* Pulsante di retry se l'errore è recuperabile */}
      {canRetry && (
        <button
          onClick={onRetry}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Riprova
        </button>
      )}
      
      {/* Pulsante per tornare indietro */}
      <button
        onClick={() => window.history.back()}
        className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        ← Torna indietro
      </button>
      
      {/* Link per andare alla homepage */}
      <a
        href="/"
        className="w-full inline-block px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
      >
        Vai alla homepage
      </a>
    </div>
  );
}
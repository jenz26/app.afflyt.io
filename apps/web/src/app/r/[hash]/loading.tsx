export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* Placeholder per il logo */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse mx-auto w-32"></div>
        </div>

        {/* Placeholder per il messaggio di disclosure */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-48 mx-auto"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-40 mx-auto"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-full mx-auto"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto mt-1"></div>
        </div>

        {/* Placeholder per il pulsante */}
        <div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse mb-4"></div>

        {/* Placeholder per il link "torna indietro" */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mx-auto"></div>

        {/* Indicatore di caricamento con spinner */}
        <div className="flex items-center justify-center mt-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500">Caricamento...</span>
        </div>
      </div>
    </div>
  );
}
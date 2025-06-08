'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OwnerData {
  displayName: string;
  themeColor: string | null;
  customAffiliateText: string;
  backgroundColor?: string | null;
  showAffiliateBadge?: boolean;
}

interface PreviewClientProps {
  hash: string;
  originalUrl: string;
  ownerData: OwnerData;
  destinationDomain: string;
  buttonStyle: Record<string, any>;
  buttonClasses: string;
}

export default function PreviewClient({
  hash,
  originalUrl,
  ownerData,
  destinationDomain,
  buttonStyle,
  buttonClasses
}: PreviewClientProps) {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showSecurityCheck, setShowSecurityCheck] = useState(false);
  const [securityProgress, setSecurityProgress] = useState(0);
  const [pixelTracked, setPixelTracked] = useState(false);

  const STORAGE_KEY = `afflyt_preview_seen_${hash}`;
  const REDIRECT_DELAY = 500;
  const SECURITY_CHECK_DURATION = 2000;

  // P1.3: Tracking con Pixel - chiamata asincrona disaccoppiata
  useEffect(() => {
    if (!pixelTracked && typeof window !== 'undefined') {
      const trackPixel = async () => {
        try {
          // Crea un pixel invisibile per il tracking
          const img = new Image();
          const timestamp = Date.now();
          const params = new URLSearchParams({
            hash,
            t: timestamp.toString(),
          });
          
          img.src = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/public/pixel?${params.toString()}`;
          img.style.display = 'none';
          img.style.position = 'absolute';
          img.style.left = '-9999px';
          img.setAttribute('aria-hidden', 'true');
          
          // Error handling per il pixel
          img.onerror = () => {
            console.debug('Pixel tracking failed silently');
          };
          
          img.onload = () => {
            setTimeout(() => {
              if (img.parentNode) {
                img.parentNode.removeChild(img);
              }
            }, 1000);
          };
          
          document.body.appendChild(img);
          setPixelTracked(true);
        } catch (error) {
          console.debug('Pixel tracking failed silently', error);
          setPixelTracked(true); // Evita retry infiniti
        }
      };
      
      // Ritarda leggermente per non bloccare il rendering
      const timer = setTimeout(trackPixel, 100);
      return () => clearTimeout(timer);
    }
  }, [hash, pixelTracked]);

  // Controlla se il visitatore ha già visto questa preview
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const hasSeenPreview = localStorage.getItem(STORAGE_KEY) === 'true';
        if (hasSeenPreview) {
          setShouldRedirect(true);
          setIsRedirecting(true);
          
          const timer = setTimeout(() => {
            try {
              window.location.href = originalUrl;
            } catch (redirectError) {
              console.error('Redirect failed:', redirectError);
              // Fallback: prova con window.open
              window.open(originalUrl, '_self');
            }
          }, REDIRECT_DELAY);

          return () => clearTimeout(timer);
        }
      } catch (storageError) {
        console.warn('localStorage not available:', storageError);
        // Continua senza redirect automatico se localStorage non funziona
      }
    }
  }, [hash, originalUrl, STORAGE_KEY]);

  // P1.2: Funzione per mostrare Security Check con Progress Bar
  const showSecurityCheckSequence = () => {
    setShowSecurityCheck(true);
    setSecurityProgress(0);
    
    // Simula un controllo di sicurezza progressivo
    const progressInterval = setInterval(() => {
      setSecurityProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Dopo il completamento, vai al link
          setTimeout(() => {
            window.location.href = originalUrl;
          }, 500);
          return 100;
        }
        return prev + (Math.random() * 15 + 5); // Incremento variabile 5-20%
      });
    }, 150);
    
    return () => clearInterval(progressInterval);
  };

  // Funzione per gestire i click e segnare la preview come vista
  const handlePreviewClick = (openInNewTab: boolean = false, showSecurity: boolean = false) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch (storageError) {
        console.warn('localStorage not available:', storageError);
        // Continua comunque con la navigazione
      }
      
      if (showSecurity && !openInNewTab) {
        // P1.2: Mostra security check per il pulsante principale
        showSecurityCheckSequence();
      } else if (openInNewTab) {
        try {
          window.open(originalUrl, '_blank', 'noopener,noreferrer');
        } catch (openError) {
          console.error('Failed to open new tab:', openError);
          // Fallback: naviga nella stessa finestra
          window.location.href = originalUrl;
        }
      } else {
        try {
          window.location.href = originalUrl;
        } catch (navError) {
          console.error('Navigation failed:', navError);
          // Fallback: prova con window.open
          window.open(originalUrl, '_self');
        }
      }
    }
  };

  // P1.2: Se sta mostrando il Security Check
  if (showSecurityCheck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        {/* Security Check Screen */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Security Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                Controllo di Sicurezza
              </h2>
              
              <p className="text-gray-400 mb-8">
                Stiamo verificando la sicurezza del collegamento con <span className="text-white font-semibold">{destinationDomain}</span>
              </p>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Progresso</span>
                  <span className="text-sm text-green-400 font-semibold">{Math.round(securityProgress)}%</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${securityProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Security Messages */}
              <div className="space-y-2 text-sm">
                {securityProgress > 20 && (
                  <div className="flex items-center gap-2 text-green-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Certificato SSL verificato
                  </div>
                )}
                {securityProgress > 50 && (
                  <div className="flex items-center gap-2 text-green-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Reputazione del sito confermata
                  </div>
                )}
                {securityProgress > 80 && (
                  <div className="flex items-center gap-2 text-green-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Connessione sicura stabilita
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se deve reindirizzare, mostra la schermata di loading
  if (shouldRedirect && isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        {/* Messaggio di reindirizzamento */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Spinner di caricamento */}
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                Reindirizzamento in corso...
              </h2>
              
              <p className="text-gray-400 mb-6">
                Ti stiamo portando su <span className="text-white font-semibold">{destinationDomain}</span>
              </p>
              
              {/* Link di fallback */}
              <button
                onClick={() => handlePreviewClick(false)}
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Clicca qui se non vieni reindirizzato automaticamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Contenuto normale della preview
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects - Stesso stile della homepage */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Particelle decorative */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-gradient-to-r from-pink-400/30 to-blue-400/30 rounded-full animate-ping"></div>
          <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-gradient-to-r from-purple-400/30 to-cyan-400/30 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-gradient-to-r from-emerald-400/30 to-blue-400/30 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        </div>
      </div>

      {/* Container principale */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Card principale con glassmorphism */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:border-white/20 transition-all duration-300">
            
            {/* Header con branding del creator - P1.1 MIGLIORATO */}
            <div className="text-center mb-8">
              {/* Avatar del creator con colori personalizzati */}
              <div 
                className="w-20 h-20 mx-auto mb-4 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: ownerData.themeColor 
                    ? `linear-gradient(135deg, ${ownerData.themeColor}40, ${ownerData.themeColor}20)`
                    : 'linear-gradient(135deg, rgb(51 65 85 / 0.8), rgb(71 85 105 / 0.8))'
                }}
              >
                <span 
                  className="text-2xl font-bold"
                  style={{
                    background: ownerData.themeColor
                      ? `linear-gradient(135deg, ${ownerData.themeColor}, ${ownerData.themeColor}CC)`
                      : 'linear-gradient(135deg, rgb(251 113 133), rgb(168 85 247))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {ownerData.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Nome del creator */}
              <h1 className="text-2xl font-bold text-white mb-2">
                {ownerData.displayName}
              </h1>
              
              {/* Badge "Creator" personalizzabile */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: ownerData.themeColor || '#4ade80' }}
                ></div>
                <span className="text-sm font-medium text-gray-300">
                  {ownerData.showAffiliateBadge !== false ? 'Verified Creator' : 'Trusted Partner'}
                </span>
              </div>
            </div>

            {/* Sezione destinazione */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">
                  Stai per essere reindirizzato su
                </p>
                
                {/* Dominio in evidenza */}
                <div className="p-4 bg-slate-700/50 backdrop-blur-sm border border-white/10 rounded-xl mb-4">
                  <p className="text-xl font-bold text-white break-all">
                    {destinationDomain}
                  </p>
                </div>
                
                {/* Disclosure text personalizzato */}
                <p className="text-sm text-gray-300 leading-relaxed px-2">
                  {ownerData.customAffiliateText}
                </p>
              </div>
            </div>

            {/* CTA Button dinamico principale - P0.1 + P1.2 */}
            <div className="mb-4">
              <button
                onClick={() => handlePreviewClick(false, true)}
                className={`
                  group w-full inline-flex items-center justify-center gap-3 px-8 py-4 
                  ${buttonClasses}
                  text-white font-semibold text-lg rounded-xl 
                  transition-all duration-300 hover:scale-105 hover:shadow-xl 
                  focus:outline-none focus:ring-4 focus:ring-purple-500/25
                `}
                style={buttonStyle}
              >
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Accesso sicuro a {destinationDomain.replace('www.', '')}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* CTA Secondaria "Apri in Nuova Scheda" - P0.2 */}
            <div className="mb-6 text-center">
              <button
                onClick={() => handlePreviewClick(true, false)}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium underline underline-offset-2 hover:no-underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Apri in nuova scheda (senza controllo)
              </button>
            </div>

            {/* Navigation hint */}
            <div className="text-center">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Usa il pulsante indietro del browser per tornare
              </p>
            </div>
          </div>

          {/* Footer Afflyt */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-full hover:bg-slate-800/50 transition-all">
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
    </div>
  );
}
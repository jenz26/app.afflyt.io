'use client';

/**
 * Modern Sign In Page for Afflyt.io with i18n support
 * Magic link authentication form with beautiful design
 * 
 * @version 1.6.0 - UPDATED: Fixed race condition handling
 * @phase Frontend-Backend Integration
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner, ErrorAlert } from '@/components/ui/LoadingError';
import { useClientI18n } from '../../../../lib/i18n/useClientI18n';
import { Mail, Sparkles, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

// Animated Background Component
const AnimatedBackground: React.FC = () => {
  const [particles, setParticles] = useState<Array<{left: string, top: string, delay: string, duration: string}>>([]);

  useEffect(() => {
    // Genera le particelle solo lato client
    const newParticles = Array.from({ length: 15 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradienti statici */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      {/* Particelle dinamiche */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-pink-400/30 to-blue-400/30 rounded-full animate-ping"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default function SignInPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  useClientI18n();
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { 
    sendMagicLink, 
    isLoggedIn, 
    isLoading, 
    isInitializing, // NEW: Check if still initializing
    canRedirect     // NEW: Only redirect when safe
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // FIXED: Only redirect if already logged in AND initialization is complete
  useEffect(() => {
    if (canRedirect && isLoggedIn && !isLoading) {
      const returnUrl = searchParams.get('returnUrl') || `/${locale}/dashboard`;
      router.push(returnUrl);
    }
  }, [canRedirect, isLoggedIn, isLoading, router, searchParams, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError(t('auth.emailRequired', 'Please enter your email address'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError(t('auth.emailInvalid', 'Please enter a valid email address'));
      return;
    }

    setIsSubmitting(true);

    try {
      await sendMagicLink(email.trim());
      setLinkSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('auth.magicLinkFailed', 'Failed to send magic link'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading during initialization or auth operations
  if (isInitializing || (canRedirect && isLoggedIn && !isLoading)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 sm:px-6 lg:px-8">
        <AnimatedBackground />
        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <LoadingSpinner size="large" className="mb-4" />
            <p className="text-gray-300 text-lg">
              {isInitializing 
                ? t('auth.checkingAuth', 'Verificando autenticazione...')
                : t('auth.redirecting', 'Reindirizzamento alla dashboard...')
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - magic link sent
  if (linkSent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 sm:px-6 lg:px-8">
        <AnimatedBackground />
        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl py-12 px-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('auth.checkEmail', 'Check your email')}
              </h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                {t('auth.magicLinkSent', 'We\'ve sent a magic link to')} 
                <br />
                <strong className="text-blue-400">{email}</strong>
                <br />
                <span className="text-sm">{t('auth.clickLink', 'Click the link in your email to sign in to your account.')}</span>
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setLinkSent(false);
                    setEmail('');
                  }}
                  className="w-full flex justify-center py-3 px-4 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
                >
                  {t('auth.useDifferentEmail', 'Use different email')}
                </button>
                <button
                  onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      {t('auth.sending', 'Sending...')}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {t('auth.resendMagicLink', 'Resend magic link')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main sign in form
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col justify-center py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)]">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <div className="mb-6">
              <span className="text-5xl md:text-6xl bg-clip-text text-transparent" style={{
                backgroundImage: 'linear-gradient(to right, #f472b6, #a855f7, #3b82f6, #14b8a6)'
              }}>
                Afflyt
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {t('auth.welcomeToAfflyt', 'Welcome to Afflyt')}
            </h1>
            <p className="text-gray-300 text-lg">
              {t('auth.signInWithMagicLink', 'Sign in to your account with magic link')}
            </p>
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl py-8 px-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  {t('auth.emailAddress', 'Email address')}
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-white/20 bg-slate-700/50 rounded-xl placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={t('auth.enterEmail', 'Enter your email')}
                    disabled={isSubmitting}
                  />
                  <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {formError && (
                <ErrorAlert
                  error={formError}
                  onDismiss={() => setFormError(null)}
                />
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-pink-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      {t('auth.sendingMagicLink', 'Sending magic link...')}
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      {t('auth.sendMagicLink', 'Send magic link')}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-800/50 text-gray-400">
                    {t('auth.newToAfflyt', 'New to Afflyt?')}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Magic Links</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t('auth.magicLinkInfo', 'Magic links work for both sign in and registration. No passwords required.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-wave {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 200% 50%; }
          75% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient-wave {
          background-size: 300% 300%;
          animation: gradient-wave 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
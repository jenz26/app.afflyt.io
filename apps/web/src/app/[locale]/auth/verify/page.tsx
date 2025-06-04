'use client';

/**
 * Modern Verify Magic Link Page for Afflyt.io with i18n support
 * Handles magic link token verification and authentication with beautiful design
 * 
 * @version 1.5.0
 * @phase Frontend-Backend Integration
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner, ErrorCard } from '@/components/ui/LoadingError';
import { useClientI18n } from '../../../../lib/i18n/useClientI18n';
import { CheckCircle2, AlertTriangle, ArrowLeft, Sparkles, Zap } from 'lucide-react';

// Animated Background Component (same as homepage)
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

export default function VerifyPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  useClientI18n();
  const { t } = useTranslation();
  
  const [verificationState, setVerificationState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { verifyMagicLink, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const returnUrl = searchParams.get('returnUrl') || `/${locale}/dashboard`;

    // If already logged in, redirect
    if (isLoggedIn && !authLoading) {
      router.push(returnUrl);
      return;
    }

    // If no token in URL, redirect to sign in
    if (!token) {
      router.push(`/${locale}/auth/signin`);
      return;
    }

    // Verify the magic link token
    const verifyToken = async () => {
      try {
        await verifyMagicLink(token);
        setVerificationState('success');
        
        // Redirect after successful verification
        setTimeout(() => {
          router.push(returnUrl);
        }, 2000);
      } catch (error) {
        setVerificationState('error');
        setErrorMessage(error instanceof Error ? error.message : t('auth.verificationFailed', 'Verification failed'));
      }
    };

    verifyToken();
  }, [verifyMagicLink, router, searchParams, isLoggedIn, authLoading, locale, t]);

  // Loading state
  if (verificationState === 'verifying' || authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <AnimatedBackground />
        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl py-12 px-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6">
                <LoadingSpinner size="large" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('auth.verifyingMagicLink', 'Verifying your magic link')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('auth.pleaseWaitVerification', 'Please wait while we verify your authentication...')}
              </p>
              
              {/* Progress indicator */}
              <div className="mt-8 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (verificationState === 'success') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <AnimatedBackground />
        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl py-12 px-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('auth.welcomeToAfflyt', 'Welcome to Afflyt!')}
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('auth.accountVerified', 'Your account has been verified successfully.')}
              </p>
              
              {/* Success animation */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <span className="text-purple-300 text-sm font-medium">Authentication Complete</span>
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" style={{animationDelay: '0.5s'}} />
              </div>
              
              <p className="text-gray-400 text-sm">
                {t('auth.redirectingToDashboard', 'Redirecting you to your dashboard...')}
              </p>
              
              {/* Progress bar */}
              <div className="mt-6 w-full bg-slate-700/50 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <AnimatedBackground />
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl py-12 px-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('auth.verificationFailed', 'Verification Failed')}
            </h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              {errorMessage || t('auth.verificationFailed', 'Verification failed')}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/${locale}/auth/signin`)}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Zap className="w-5 h-5" />
                Try Again
              </button>
              
              <button
                onClick={() => router.push(`/${locale}/auth/signin`)}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.backToSignIn', 'Back to sign in')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// apps/web/src/app/[locale]/support/page.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { 
  Search, 
  MessageSquare, 
  HelpCircle,
  Book,
  Zap,
  ExternalLink,
  Clock
} from 'lucide-react';

// ✅ MIGLIORAMENTO 3: Componenti estratti per manutenibilità
import { FAQAccordion } from '@/components/support/FAQAccordion';
import { ContactForm } from '@/components/support/ContactForm';
import { FAQ_DATA } from '@/components/support/faqData';

// Quick Support Links Component
const QuickSupportLinks = () => {
  const params = useParams();
  const locale = params?.locale || 'it';

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Altri Canali di Supporto</h3>
      <div className="space-y-3">
        <a
          href="https://t.me/afflyt"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors group"
        >
          <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium group-hover:text-blue-400 transition-colors">
              Community Telegram
            </div>
            <div className="text-gray-400 text-sm">Supporto dalla community</div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
        </a>

        <a
          href="https://docs.afflyt.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors group"
        >
          <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
            <Book className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium group-hover:text-purple-400 transition-colors">
              Documentazione
            </div>
            <div className="text-gray-400 text-sm">Guide e tutorial completi</div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
        </a>

        <a
          href={`/${locale}/feedback`}
          className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors group"
        >
          <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium group-hover:text-green-400 transition-colors">
              Feedback & Suggerimenti
            </div>
            <div className="text-gray-400 text-sm">Aiutaci a migliorare</div>
          </div>
        </a>
      </div>
    </div>
  );
};

// Response Time Info Component
const ResponseTimeInfo = () => {
  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        Tempi di Risposta
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-300">Email Support:</span>
          <span className="text-emerald-400 font-medium">&lt; 24 ore</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Community Telegram:</span>
          <span className="text-emerald-400 font-medium">&lt; 2 ore</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Bug Critici:</span>
          <span className="text-emerald-400 font-medium">&lt; 4 ore</span>
        </div>
      </div>
    </div>
  );
};

// Main Support Page Component
export default function SupportPage() {
  const { t } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20" />
        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                <HelpCircle className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-6">
              Centro Supporto
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Come possiamo aiutarti oggi? Trova risposte immediate o contattaci direttamente
            </p>

            {/* Enhanced Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cerca nelle domande frequenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-3">
                Ricerca per: "<span className="text-purple-400 font-medium">{searchTerm}</span>"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* FAQ Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            <FAQAccordion items={FAQ_DATA} searchTerm={searchTerm} />
          </div>

          {/* Contact Sidebar - 1/3 width */}
          <div className="space-y-8">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-green-400" />
                Contattaci
              </h2>
              <ContactForm />
            </div>

            {/* Quick Support Links */}
            <QuickSupportLinks />

            {/* Response Time Info */}
            <ResponseTimeInfo />
          </div>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="border-t border-white/10 bg-slate-900/50">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Non hai trovato quello che cercavi?
            </h3>
            <p className="text-gray-400 mb-6">
              Il nostro team è sempre disponibile per aiutarti con qualsiasi domanda o problema
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  const contactForm = document.querySelector('#message');
                  contactForm?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all hover:scale-105"
              >
                Scrivi un messaggio
              </button>
              <a
                href="https://t.me/afflyt"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-white/20 text-white font-medium rounded-lg transition-all hover:scale-105"
              >
                Unisciti alla community
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
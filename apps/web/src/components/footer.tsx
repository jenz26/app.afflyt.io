'use client';

import { useTranslation } from 'react-i18next';
import { Globe, Heart, Activity } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  const params = useParams();
  const locale = params?.locale || 'it';

  // Helper per creare link con locale
  const createLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${cleanPath}`;
  };

  return (
    <footer className="bg-slate-900 border-t border-white/10">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href={createLink('/')} className="inline-block">
              <h3 className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4 hover:opacity-80 transition-opacity">
                {t('afflyt')}
              </h3>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              {t('footer_tagline')}
            </p>
            
            {/* ✅ AGGIUNTO: Social Links */}
            <div className="flex items-center gap-3 mb-4">
              <a 
                href="https://x.com/afflyt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors group"
                aria-label="Seguici su X (Twitter)"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              
              <a 
                href="https://www.instagram.com/afflyt.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors group"
                aria-label="Seguici su Instagram"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              
              <a 
                href="https://t.me/afflyt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors group"
                aria-label="Unisciti al nostro canale Telegram"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
            
            <p className="text-gray-500 text-xs">
              {t('footer_copyright_text')}
            </p>
          </div>

          {/* Documentation */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_documentation')}</h4>
            <div className="space-y-2">
              {/* ⚠️ Link esterno - API docs potrebbero essere su dominio separato */}
              <a 
                href="https://docs.afflyt.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('footer_api_docs')}
              </a>
              
              {/* ✅ Link interni con locale */}
              <Link 
                href={createLink('/changelog')} 
                className="block text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('footer_changelog')}
              </Link>
              <Link 
                href={createLink('/roadmap')} 
                className="block text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('footer_roadmap')}
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_support_section')}</h4>
            <div className="space-y-2">
              {/* ✅ Community ora punta al Telegram */}
              <a 
                href="https://t.me/afflyt" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('footer_community')}
              </a>
              
              {/* ✅ Link interni con locale */}
              <Link 
                href={createLink('/support')} 
                className="block text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('footer_help')}
              </Link>
              <Link 
                href={createLink('/feedback')} 
                className="block text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('support')}
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_legal_section')}</h4>
            <div className="space-y-2">
              {/* ✅ Link interni con locale */}
              <Link 
                href={createLink('/privacy')} 
                className="block text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('privacy')}
              </Link>
              <Link 
                href={createLink('/terms')} 
                className="block text-gray-400 hover:text-white text-sm transition-colors"
              >
                {t('terms')}
              </Link>
            </div>
          </div>

          {/* Status & Language */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_language')}</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <select 
                  className="bg-slate-800 text-gray-300 text-sm border border-white/10 rounded px-2 py-1"
                  value={locale}
                  onChange={(e) => {
                    const newLocale = e.target.value;
                    const currentPath = window.location.pathname.replace(`/${locale}`, '');
                    window.location.href = `/${newLocale}${currentPath}`;
                  }}
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400 text-xs">{t('footer_all_systems')}</span>
                </div>
                <p className="text-gray-500 text-xs">{t('footer_uptime')}</p>
                <p className="text-gray-500 text-xs">{t('footer_response_time')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              {t('footer_copyright')}
            </p>
            <div className="flex items-center space-x-1 mt-4 md:mt-0">
              <Heart className="w-4 h-4 text-red-400" />
              <p className="text-gray-500 text-sm">
                {t('footer_tech_stack')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
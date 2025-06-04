'use client';

import { useTranslation } from 'react-i18next';
import { Globe, Heart, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-slate-900 border-t border-white/10">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              {t('afflyt')}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('footer_tagline')}
            </p>
            <p className="text-gray-500 text-xs">
              {t('footer_copyright_text')}
            </p>
          </div>

          {/* Documentation */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_documentation')}</h4>
            <div className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('footer_api_docs')}
              </a>
              <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('footer_changelog')}
              </a>
              <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('footer_roadmap')}
              </a>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_support_section')}</h4>
            <div className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('footer_community')}
              </a>
              <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('footer_help')}
              </a>
              <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('support')}
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_legal_section')}</h4>
            <div className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('privacy')}
              </a>
              <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('terms')}
              </a>
            </div>
          </div>

          {/* Status & Language */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_language')}</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <select className="bg-slate-800 text-gray-300 text-sm border border-white/10 rounded px-2 py-1">
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
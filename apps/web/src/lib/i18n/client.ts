'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'it', // default language
    fallbackLng: 'it',
    defaultNS: 'common',
    
    resources: {
      en: {
        common: require('../../../public/en/common.json')
      },
      it: {
        common: require('../../../public/it/common.json')
      }
    },
    
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
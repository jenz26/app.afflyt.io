'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import i18n from './client';

export const useClientI18n = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Extract locale from pathname (e.g., /it/dashboard -> 'it')
    const locale = pathname.split('/')[1];
    
    // Only change if it's a valid locale and different from current
    if (['en', 'it'].includes(locale) && locale !== i18n.language) {
      i18n.changeLanguage(locale);
    }
  }, [pathname]);

  return i18n;
};
'use client';

import { useClientI18n } from '../../lib/i18n/useClientI18n';

export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  useClientI18n();
  
  return (
    <div>
      {children}
    </div>
  );
}
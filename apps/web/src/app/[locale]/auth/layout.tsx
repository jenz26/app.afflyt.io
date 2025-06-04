'use client';

import { useClientI18n } from '../../../lib/i18n/useClientI18n';
import { Navbar } from '@/components/navbar';

export default function AuthLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  useClientI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      {children}
    </div>
  );
}
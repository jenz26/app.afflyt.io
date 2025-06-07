// apps/web/src/app/[locale]/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    user, 
    isLoading, 
    isInitializing, // NEW: Check if still initializing
    canRedirect,    // NEW: Only redirect when safe
    isLoggedIn 
  } = useAuth();
  const router = useRouter();

  // FIXED: Only redirect when initialization is complete AND user is not logged in
  useEffect(() => {
    if (canRedirect && !isLoading && !isLoggedIn) {
      router.push('/auth/signin');
    }
  }, [canRedirect, isLoading, isLoggedIn, router]);

  // Show loading during initialization or when checking auth
  if (isInitializing || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="text-white text-lg">
            {isInitializing 
              ? 'Verificando sessione...' 
              : 'Caricamento dashboard...'
            }
          </span>
        </div>
      </div>
    );
  }

  // Don't render anything if redirecting (user not authenticated after initialization)
  if (canRedirect && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="text-white text-lg">Reindirizzamento al login...</span>
        </div>
      </div>
    );
  }

  // Only render the dashboard if user is authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar esistente */}
      <Navbar />
      
      <div className="flex">
        {/* Sidebar - LARGHEZZA RIDOTTA */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Main Content - PIÙ SPAZIO */}
        <div className="flex-1 lg:ml-64">
          {/* Mobile header - PIÙ COMPATTO */}
          <div className="lg:hidden flex items-center justify-between p-3 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-16 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </button>
            <h1 className="text-lg font-bold text-white">Dashboard</h1>
            <div className="w-9"></div> {/* Spacer per centrare il titolo */}
          </div>
          
          {/* Page Content - PIÙ SPAZIO PER I WIDGET */}
          <main className="max-w-none">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
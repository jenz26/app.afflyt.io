// apps/web/src/app/[locale]/dashboard/page.tsx
'use client';

import { StaticDashboard } from '@/components/dashboard/StaticDashboard';

// Animated Background Component (più leggero)
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/8 to-purple-500/8 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/8 to-teal-500/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 p-4 lg:p-6">
        {/* Dashboard Full Width */}
        <StaticDashboard />
      </div>
    </div>
  );
}
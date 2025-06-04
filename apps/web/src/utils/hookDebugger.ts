// apps/web/src/utils/hookDebugger.ts

let componentHookCount: Record<string, number> = {};
let currentComponent = '';

export const startHookDebug = (componentName: string) => {
  currentComponent = componentName;
  componentHookCount[componentName] = 0;
  console.log(`🎣 [${componentName}] Hook debug started`);
};

export const trackHook = (hookName: string) => {
  if (currentComponent) {
    componentHookCount[currentComponent]++;
    console.log(`🎣 [${currentComponent}] Hook #${componentHookCount[currentComponent]}: ${hookName}`);
  }
};

export const endHookDebug = () => {
  if (currentComponent) {
    console.log(`🎣 [${currentComponent}] Total hooks called: ${componentHookCount[currentComponent]}`);
    currentComponent = '';
  }
};

// Hook wrapper per debug
export const useDebugHook = <T>(hookFn: () => T, hookName: string): T => {
  trackHook(hookName);
  return hookFn();
};

// Debug per il componente Dashboard
// Da usare temporaneamente in dashboard/page.tsx:

/*
'use client';

import { startHookDebug, endHookDebug, useDebugHook } from '@/utils/hookDebugger';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  // Inizia debug
  startHookDebug('DashboardPage');

  // Debug ogni hook
  const { user, isLoading, token } = useDebugHook(() => useAuth(), 'useAuth');
  const router = useDebugHook(() => useRouter(), 'useRouter');

  useDebugHook(() => useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin');
    }
  }, [isLoading, user, router]), 'useEffect');

  // Fine debug
  endHookDebug();

  // ... resto del componente
}
*/
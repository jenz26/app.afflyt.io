/**
 * useAuth Hook for Afflyt.io
 * Convenient hook that wraps the AuthContext and provides additional utilities
 * 
 * @version 1.6.0 - UPDATED: Support for isInitialized state
 * @phase Frontend-Backend Integration
 */

import { useAuthContext, type User, type AuthContextValue } from '@/contexts/AuthContext';
import { createAuthenticatedApiClient } from '@/lib/api';
import { useCallback } from 'react';

// Extended auth hook with additional utilities
export interface UseAuthReturn extends AuthContextValue {
  // Utility methods
  isLoggedIn: boolean;
  hasRole: (role: string) => boolean;
  canAccess: (permission: string) => boolean;
  getAuthenticatedApiClient: () => ReturnType<typeof createAuthenticatedApiClient> | null;
  
  // User info shortcuts
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  isEmailVerified: boolean;
  
  // Auth state helpers
  requireAuth: () => void;
  redirectToLogin: () => void;

  // NEW: Initialization helpers
  isInitializing: boolean; // True during initial auth check
  canRedirect: boolean;    // True when it's safe to redirect based on auth state
}

export function useAuth(): UseAuthReturn {
  const authContext = useAuthContext();
  
  const {
    user,
    token,
    isLoading,
    isInitialized, // NEW: Use the initialization state
    isAuthenticated,
    error,
    login,
    sendMagicLink,
    verifyMagicLink,
    logout,
    updateProfile,
    refreshUser,
    clearError,
  } = authContext;

  // NEW: Computed states for better UX
  const isInitializing = !isInitialized;
  const canRedirect = isInitialized; // Only redirect when initialization is complete

  // Utility computed values
  const isLoggedIn = isAuthenticated && !!user && !!token;
  const userEmail = user?.email || null;
  const userName = user?.name || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null);
  const userRole = user?.role || null;
  const isEmailVerified = user?.isEmailVerified || false;

  // Role checking utility
  const hasRole = (role: string): boolean => {
    if (!user || !user.role) return false;
    return user.role === role;
  };

  // Permission checking utility (can be extended based on business logic)
  const canAccess = (permission: string): boolean => {
    if (!user) return false;

    // Basic permission logic - can be extended
    switch (permission) {
      case 'dashboard':
        return isLoggedIn && isEmailVerified;
      case 'admin':
        return hasRole('admin');
      case 'api_keys':
        return isLoggedIn && isEmailVerified;
      case 'analytics':
        return isLoggedIn && isEmailVerified;
      case 'bot_config':
        return isLoggedIn && isEmailVerified; // Will be extended in Phase 2
      default:
        return isLoggedIn;
    }
  };

  // Get authenticated API client - MEMOIZED
  const getAuthenticatedApiClient = useCallback(() => {
    if (!token) return null;
    return createAuthenticatedApiClient(token);
  }, [token]);

  // Require authentication - throws error if not authenticated
  const requireAuth = () => {
    if (!isLoggedIn) {
      throw new Error('Authentication required');
    }
  };

  // Redirect to login (client-side navigation)
  const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
  };

  return {
    // Auth context values
    user,
    token,
    isLoading,
    isInitialized,
    isAuthenticated,
    error,
    login,
    sendMagicLink,
    verifyMagicLink,
    logout,
    updateProfile,
    refreshUser,
    clearError,

    // Additional utilities
    isLoggedIn,
    hasRole,
    canAccess,
    getAuthenticatedApiClient,

    // User info shortcuts
    userEmail,
    userName,
    userRole,
    isEmailVerified,

    // Auth helpers
    requireAuth,
    redirectToLogin,

    // NEW: Initialization helpers
    isInitializing,
    canRedirect,
  };
}

// Export types for external use
export type { User } from '@/contexts/AuthContext';
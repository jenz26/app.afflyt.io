'use client';

/**
 * Authentication Context for Afflyt.io
 * Manages user authentication state, JWT tokens, and auth-related operations
 * 
 * @version 1.6.0 - FIXED: Session persistence race condition
 * @phase Frontend-Backend Integration
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, AfflytApiError } from '@/lib/api';

// Types for user and authentication state
export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isEmailVerified?: boolean;
  balance?: number;
  amazonAssociateTag?: string;
  websiteUrl?: string;
  companyName?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean; // NEW: Tracks if auth initialization is complete
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  // Auth actions
  login: (email: string, password?: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Local storage keys
const TOKEN_KEY = 'afflyt_auth_token';
const USER_KEY = 'afflyt_user_data';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: false, // Changed: Start with false for operations
    isInitialized: false, // NEW: Track initialization state
    isAuthenticated: false,
    error: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser);
          
          // Set loading state during token verification
          setState(prev => ({
            ...prev,
            isLoading: true,
          }));

          try {
            // Verify token is still valid by fetching user profile
            const response = await apiClient.get('/api/user/me', { token: storedToken });
            
            // FIXED: Backend returns { user: {...} }, so extract the user object
            const updatedUser = response.user || response;
            
            setState({
              user: updatedUser,
              token: storedToken,
              isLoading: false,
              isInitialized: true, // Initialization complete with valid session
              isAuthenticated: true,
              error: null,
            });

            // Update stored user data if it changed
            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
          } catch (error) {
            // Token is invalid, clear stored data
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            
            setState({
              user: null,
              token: null,
              isLoading: false,
              isInitialized: true, // Initialization complete but no valid session
              isAuthenticated: false,
              error: null,
            });
          }
        } else {
          // No stored session, initialization complete
          setState(prev => ({
            ...prev,
            isInitialized: true,
          }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState({
          user: null,
          token: null,
          isLoading: false,
          isInitialized: true, // Even on error, initialization is complete
          isAuthenticated: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();
  }, []);

  // Set auth data and persist to localStorage
  const setAuthData = (user: User, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    setState({
      user,
      token,
      isLoading: false,
      isInitialized: true,
      isAuthenticated: true,
      error: null,
    });
  };

  // Clear auth data
  const clearAuthData = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    setState({
      user: null,
      token: null,
      isLoading: false,
      isInitialized: true,
      isAuthenticated: false,
      error: null,
    });
  };

  // Login with email/password (if implemented in backend)
  const login = async (email: string, password?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.post('/api/v1/auth/login', {
        email,
        password,
      });

      if (response.user && response.token) {
        setAuthData(response.user, response.token);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof AfflytApiError 
        ? error.message 
        : 'Login failed. Please try again.';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Send magic link for passwordless authentication
  const sendMagicLink = async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await apiClient.post('/api/v1/auth/magic-link', { email });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof AfflytApiError 
        ? error.message 
        : 'Failed to send magic link. Please try again.';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Verify magic link token
  const verifyMagicLink = async (token: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.post('/api/v1/auth/magic-link/verify', {
        token,
      });

      if (response.user && response.token) {
        setAuthData(response.user, response.token);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof AfflytApiError 
        ? error.message 
        : 'Invalid or expired magic link. Please try again.';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    clearAuthData();
    
    // Optional: Call backend logout endpoint if implemented
    if (state.token) {
      apiClient.post('/api/v1/auth/logout', {}, { token: state.token })
        .catch(error => console.warn('Logout API call failed:', error));
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    if (!state.token) {
      throw new Error('Not authenticated');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedUser = await apiClient.put('/api/user/me', data, {
        token: state.token,
      });

      const newUser = { ...state.user, ...updatedUser };
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      setState(prev => ({
        ...prev,
        user: newUser,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof AfflytApiError 
        ? error.message 
        : 'Failed to update profile. Please try again.';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!state.token) {
      return;
    }

    try {
      const user = await apiClient.get('/api/user/me', { token: state.token });
      
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setState(prev => ({
        ...prev,
        user,
      }));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Don't update error state for silent refresh failures
    }
  };

  // Clear error state
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextValue = {
    ...state,
    login,
    sendMagicLink,
    verifyMagicLink,
    logout,
    updateProfile,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
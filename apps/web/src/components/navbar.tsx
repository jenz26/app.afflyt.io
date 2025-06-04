'use client'

/**
 * Modern Navbar for Afflyt.io
 * Integrates with AuthContext, supports i18n, and provides a clean UX
 * 
 * @version 1.5.0
 * @phase Frontend-Backend Integration
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useClientI18n } from '@/lib/i18n/useClientI18n'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { Menu, X, LogOut, Settings, Zap } from 'lucide-react'

interface NavbarProps {
  user?: {
    name?: string | null
    email?: string | null
    id?: string
  } | null
}

export function Navbar({ user: propUser }: NavbarProps) {
  const { user: authUser, logout, isLoggedIn } = useAuth()
  const { t } = useTranslation('common')
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  // Inizializza i18n client-side
  useClientI18n()

  // Usa l'utente dall'auth provider se disponibile, altrimenti quello dalle props
  const user = authUser || propUser

  // Estrai locale corrente dal pathname
  const currentLocale = pathname.split('/')[1] || 'it'
  const otherLocale = currentLocale === 'it' ? 'en' : 'it'

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === `/${currentLocale}` || pathname === `/${currentLocale}/`
    }
    return pathname.includes(path)
  }

  // Helper per creare link con locale
  const createLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `/${currentLocale}${cleanPath}`
  }

  // Helper per switch lingua
  const createLanguageSwitch = () => {
    const currentPath = pathname.replace(`/${currentLocale}`, '') || ''
    return `/${otherLocale}${currentPath}`
  }

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href={createLink('/')} 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-lg group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">
              Afflyt
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <nav className="flex items-center space-x-1">
              {/* Public Navigation */}
              <Link
                href={createLink('/')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/')
                    ? 'text-white bg-slate-800 shadow-lg' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {t('home', 'Home')}
              </Link>
              
              {/* Authenticated Navigation */}
              {isLoggedIn && user && (
                <>
                  <Link
                    href={createLink('/dashboard')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/dashboard') && !isActive('/dashboard/api-keys') && !isActive('/dashboard/create')
                        ? 'text-white bg-slate-800 shadow-lg' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {t('dashboard', 'Dashboard')}
                  </Link>
                  <Link
                    href={createLink('/dashboard/create')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/dashboard/create')
                        ? 'text-white bg-slate-800 shadow-lg' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    Create Link
                  </Link>
                  <Link
                    href={createLink('/dashboard/api-keys')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/dashboard/api-keys')
                        ? 'text-white bg-slate-800 shadow-lg' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    API Keys
                  </Link>
                </>
              )}
              
              <Link
                href={createLink('/support')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/support')
                    ? 'text-white bg-slate-800 shadow-lg' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {t('support', 'Support')}
              </Link>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={() => {
                const currentPath = pathname.replace(`/${currentLocale}`, '') || ''
                const newUrl = `/${otherLocale}${currentPath}`
                window.location.href = newUrl
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors border border-slate-600 rounded-lg hover:border-slate-500 hover:bg-slate-800/50"
            >
              {otherLocale.toUpperCase()}
            </button>

            {/* Beta Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-400">Beta</span>
            </div>
            
            {/* User Section */}
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {/* User Info - Desktop */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="text-white font-medium leading-none">
                        {user.name || user.email?.split('@')[0]}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  
                  {/* User Avatar - Mobile */}
                  <div className="sm:hidden w-8 h-8 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl">
                    <div className="p-4 border-b border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {user.name || user.email?.split('@')[0]}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <Link
                        href={createLink('/dashboard/settings')}
                        className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        {t('settings', 'Settings')}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('logout', 'Sign Out')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={createLink('/auth/signin')}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-slate-300 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700/50 bg-slate-900/98">
            <div className="px-6 py-4 space-y-2">
              <Link
                href={createLink('/')}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/')
                    ? 'text-white bg-slate-800' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('home', 'Home')}
              </Link>
              
              {isLoggedIn && user && (
                <>
                  <Link
                    href={createLink('/dashboard')}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/dashboard') && !isActive('/dashboard/api-keys') && !isActive('/dashboard/create')
                        ? 'text-white bg-slate-800' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('dashboard', 'Dashboard')}
                  </Link>
                  <Link
                    href={createLink('/dashboard/create')}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/dashboard/create')
                        ? 'text-white bg-slate-800' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Create Link
                  </Link>
                  <Link
                    href={createLink('/dashboard/api-keys')}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/dashboard/api-keys')
                        ? 'text-white bg-slate-800' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    API Keys
                  </Link>
                </>
              )}
              
              <Link
                href={createLink('/support')}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/support')
                    ? 'text-white bg-slate-800' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('support', 'Support')}
              </Link>

              {/* Mobile User Actions */}
              {isLoggedIn && user && (
                <div className="border-t border-slate-700/50 pt-4 mt-4">
                  <Link
                    href={createLink('/dashboard/settings')}
                    className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    {t('settings', 'Settings')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout', 'Sign Out')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsUserMenuOpen(false)
            setIsMobileMenuOpen(false)
          }}
        />
      )}
    </nav>
  )
}
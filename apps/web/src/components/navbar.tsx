'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Menu, X, User, Settings, LogOut } from 'lucide-react';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    id: string;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const { t } = useTranslation('common');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              {t('afflyt')}
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              {t('home')}
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              {t('dashboard')}
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              {t('support')}
            </a>
          </div>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block">{user.name}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-lg">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <a href="#" className="flex items-center px-3 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">
                      <Settings className="w-4 h-4 mr-2" />
                      {t('settings')}
                    </a>
                    <a href="#" className="flex items-center px-3 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('logout')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all">
              Login
            </button>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="space-y-2">
              <a href="#" className="block text-gray-300 hover:text-white py-2">
                {t('home')}
              </a>
              <a href="#" className="block text-gray-300 hover:text-white py-2">
                {t('dashboard')}
              </a>
              <a href="#" className="block text-gray-300 hover:text-white py-2">
                {t('support')}
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
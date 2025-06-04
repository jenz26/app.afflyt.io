// apps/web/src/components/dashboard/Sidebar.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart3,
  Link2,
  Settings,
  User,
  X,
  Home,
  Target,
  Zap,
  MessageSquare,
  ChevronDown,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Navigation items
const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-4 h-4" />,
    active: true
  },
  {
    label: 'I miei Link',
    href: '/dashboard/links',
    icon: <Link2 className="w-4 h-4" />,
    active: false
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    active: false
  },
  {
    label: 'A/B Testing',
    href: '/dashboard/ab-testing',
    icon: <Target className="w-4 h-4" />,
    badge: 'Beta',
    active: false
  },
  {
    label: 'Automazioni',
    href: '/dashboard/automations',
    icon: <Zap className="w-4 h-4" />,
    badge: 'Nuovo',
    active: false
  },
  {
    label: 'Telegram Bot',
    href: '/dashboard/telegram',
    icon: <MessageSquare className="w-4 h-4" />,
    badge: 'Soon',
    active: false
  }
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - RIDOTTA LARGHEZZA */}
      <div className={`
        fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-slate-800/90 backdrop-blur-xl border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-end p-4 border-b border-white/10">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Navigation - PIÙ COMPATTA */}
        <nav className="p-3 space-y-1">
          {navigationItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`
                flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group text-sm
                ${item.active 
                  ? 'bg-blue-600/20 border border-blue-500/30 text-white' 
                  : 'hover:bg-white/5 text-gray-300 hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`
                  px-2 py-0.5 text-xs rounded-full font-medium
                  ${item.badge === 'Beta' ? 'bg-yellow-500/20 text-yellow-300' : 
                    item.badge === 'Nuovo' ? 'bg-green-500/20 text-green-300' :
                    'bg-blue-500/20 text-blue-300'}
                `}>
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* User Profile - COMPATTO */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div 
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{user?.name || 'Utente'}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
            <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-white transition-all ${userMenuOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {userMenuOpen && (
            <div className="mt-1 space-y-0.5 animate-in slide-in-from-bottom-2 duration-200">
              <button className="w-full flex items-center gap-2 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm">
                <Settings className="w-3 h-3" />
                <span>Impostazioni</span>
              </button>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-2 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
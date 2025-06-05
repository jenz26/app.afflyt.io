// apps/web/src/components/dashboard/Sidebar.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
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
  Plus,
  Key,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Navigation items organized by groups
const navigationItems = [
  // Main Dashboard
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-4 h-4" />,
    group: 'main'
  },
  
  // Links Management
  {
    label: 'Crea Link',
    href: '/dashboard/create',
    icon: <Plus className="w-4 h-4" />,
    group: 'links'
  },
  {
    label: 'I miei Link',
    href: '/dashboard/links',
    icon: <Link2 className="w-4 h-4" />,
    group: 'links'
  },
  
  // Analytics & Testing
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    group: 'analytics'
  },
  {
    label: 'A/B Testing',
    href: '/dashboard/ab-testing',
    icon: <Target className="w-4 h-4" />,
    badge: 'Beta',
    group: 'analytics'
  },
  
  // Automation (Future Phase 2)
  {
    label: 'Automazioni',
    href: '/dashboard/automations',
    icon: <Zap className="w-4 h-4" />,
    badge: 'Nuovo',
    group: 'automation'
  },
  {
    label: 'Telegram Bot',
    href: '/dashboard/telegram',
    icon: <MessageSquare className="w-4 h-4" />,
    badge: 'Soon',
    group: 'automation'
  },
  
  // Account Settings
  {
    label: 'API Keys',
    href: '/dashboard/api-keys',
    icon: <Key className="w-4 h-4" />,
    group: 'account'
  },
  {
    label: 'Profilo',
    href: '/dashboard/profile',
    icon: <User className="w-4 h-4" />,
    group: 'account'
  }
];

// Group labels for better organization
const groupLabels = {
  main: '',
  links: 'Gestione Link',
  analytics: 'Analytics',
  automation: 'Automazione',
  account: 'Account'
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  
  // Get current locale from URL params
  const locale = params?.locale || 'it';

  // Function to check if item is active
  const isActiveLink = (href: string) => {
    const localizedHref = `/${locale}${href}`;
    if (href === '/dashboard') {
      return pathname === localizedHref || pathname === `/${locale}/dashboard`;
    }
    return pathname.startsWith(localizedHref);
  };

  // Function to create localized href
  const createLocalizedHref = (href: string) => `/${locale}${href}`;

  // Group navigation items
  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  // Handle logout with locale redirect
  const handleLogout = async () => {
    await logout();
    // Redirect to localized signin page
    window.location.href = `/${locale}/auth/signin`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-slate-800/90 backdrop-blur-xl border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        flex flex-col
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

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {Object.entries(groupedItems).map(([groupKey, items]) => (
            <div key={groupKey}>
              {/* Group Label */}
              {groupLabels[groupKey as keyof typeof groupLabels] && (
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {groupLabels[groupKey as keyof typeof groupLabels]}
                  </h3>
                </div>
              )}
              
              {/* Group Items */}
              <div className="space-y-1">
                {items.map((item, index) => {
                  const isActive = isActiveLink(item.href);
                  const localizedHref = createLocalizedHref(item.href);
                  
                  return (
                    <Link
                      key={`${groupKey}-${index}`}
                      href={localizedHref}
                      className={`
                        flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group text-sm
                        ${isActive
                          ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white shadow-lg' 
                          : 'hover:bg-white/5 text-gray-300 hover:text-white'
                        }
                      `}
                      onClick={() => {
                        // Close mobile sidebar when link is clicked
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${isActive ? 'text-purple-400' : ''}`}>
                          {item.icon}
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      
                      {item.badge && (
                        <span className={`
                          px-2 py-0.5 text-xs rounded-full font-medium
                          ${item.badge === 'Beta' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 
                            item.badge === 'Nuovo' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            item.badge === 'Soon' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-purple-500/20 text-purple-300 border border-purple-500/30'}
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Section - Fixed at bottom */}
        <div className="p-3 border-t border-white/10 bg-slate-800/50">
          <div 
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.name || 'Utente'
                }
              </p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
            <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-white transition-all ${userMenuOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div className="mt-2 space-y-1 animate-in slide-in-from-bottom-2 duration-200">
              <Link
                href={createLocalizedHref('/dashboard/profile')}
                className="w-full flex items-center gap-2 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (window.innerWidth < 1024) onClose();
                }}
              >
                <User className="w-3 h-3" />
                <span>Profilo</span>
              </Link>
              
              <Link
                href={createLocalizedHref('/dashboard/api-keys')}
                className="w-full flex items-center gap-2 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (window.innerWidth < 1024) onClose();
                }}
              >
                <Key className="w-3 h-3" />
                <span>API Keys</span>
              </Link>
              
              <button className="w-full flex items-center gap-2 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm">
                <Settings className="w-3 h-3" />
                <span>Impostazioni</span>
              </button>
              
              <div className="border-t border-white/10 my-1"></div>
              
              <button 
                onClick={handleLogout}
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
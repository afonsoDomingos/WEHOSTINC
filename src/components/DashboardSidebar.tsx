'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Globe, Mail, Database, Settings as SettingsIcon, 
  LifeBuoy, Sparkles, Link2, FileText, Star, ChevronDown, ChevronRight, Package
} from 'lucide-react';

interface DashboardSidebarProps {
  currentPath?: string;
}

export default function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const pathname = usePathname();
  const isSystemsRoute = pathname.startsWith('/systems') || pathname === '/dashboard/systems' || pathname === '/dashboard/submit-system';
  
  // Aberto por padrão para o usuário encontrar rapidamente "Meus Sistemas" e "Alugar Sistemas"
  const [systemsMenuOpen, setSystemsMenuOpen] = useState(true);

  useEffect(() => {
    if (isSystemsRoute) {
      setSystemsMenuOpen(true);
    }
  }, [pathname, isSystemsRoute]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/sites', label: 'Meus Domínios & Sites', icon: Globe },
    { href: '/dashboard/orders', label: 'Meus Pedidos', icon: FileText },
    { href: '/dashboard/site-quote', label: 'Solicitar Site', icon: Sparkles },
    { href: '/dashboard/domains', label: 'Comprar Domínio', icon: Link2 },
    { href: '/dashboard/email', label: 'Email', icon: Mail },
    { href: '/dashboard/billing', label: 'Faturamento', icon: Database },
    { href: '/dashboard/tickets', label: 'Suporte', icon: LifeBuoy },
    { href: '/dashboard/settings', label: 'Configurações', icon: SettingsIcon },
  ];

  const systemsSubItems = [
    { href: '/dashboard/systems', label: 'Meus Sistemas (Interno)', icon: Package },
    { href: '/systems', label: 'Alugar Sistemas (Catálogo)', icon: Star },
    { href: '/dashboard/submit-system', label: 'Submeter Sistema', icon: Sparkles },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <nav className="space-y-1.5 sm:space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isSiteQuote = item.href === '/dashboard/site-quote' || item.href === '/site-quote';
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition ${
                isActive 
                  ? 'bg-primary-50 text-primary-700 font-bold' 
                  : isSiteQuote
                    ? 'bg-amber-50 text-amber-900 border border-amber-200/80 font-bold hover:bg-amber-100'
                    : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'text-primary-600' : isSiteQuote ? 'text-amber-600' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Sistemas Submenu */}
        <div className="space-y-1 pt-1">
          <button
            type="button"
            onClick={() => setSystemsMenuOpen(!systemsMenuOpen)}
            className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition ${
              isSystemsRoute
                ? 'bg-primary-50 text-primary-700 font-bold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Star className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isSystemsRoute ? 'text-primary-600' : 'text-gray-500'}`} />
              <span>Sistemas</span>
            </div>
            {systemsMenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {systemsMenuOpen && (
            <div className="ml-3 sm:ml-4 pl-2 border-l-2 border-primary-100 space-y-1 my-1">
              {systemsSubItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 sm:space-x-3 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition ${
                      isActive 
                        ? 'bg-primary-600 text-white font-bold shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

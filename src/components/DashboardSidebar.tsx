'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Globe, Mail, Database, Settings as SettingsIcon, 
  LifeBuoy, Sparkles, Link2, FileText, Star, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';

interface DashboardSidebarProps {
  currentPath?: string;
}

export default function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Limpar localStorage antigo para garantir estado limpo
  useEffect(() => {
    localStorage.removeItem('dashboardSidebarCollapsed');
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/sites', label: 'Meus Domínios & Sites', icon: Globe },
    { href: '/dashboard/orders', label: 'Meus Pedidos', icon: FileText },
    { href: '/dashboard/systems', label: 'Sistemas', icon: Star },
    { href: '/dashboard/submit-system', label: 'Submeter Sistema', icon: Sparkles },
    { href: '/dashboard/site-quote', label: 'Solicitar Site', icon: Sparkles },
    { href: '/dashboard/domains', label: 'Comprar Domínio', icon: Link2 },
    { href: '/dashboard/email', label: 'Email', icon: Mail },
    { href: '/dashboard/billing', label: 'Faturamento', icon: Database },
    { href: '/dashboard/tickets', label: 'Suporte', icon: LifeBuoy },
    { href: '/dashboard/settings', label: 'Configurações', icon: SettingsIcon },
  ];

  return (
    <div className={`bg-white rounded-xl shadow-sm transition-all duration-300 sticky top-24 ${isCollapsed ? 'p-3' : 'p-4 sm:p-6'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-center mb-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-gray-600"
        title={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

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
                  ? 'bg-primary-50 text-primary-700' 
                  : isSiteQuote
                    ? 'bg-amber-50 text-amber-900 border border-amber-200/80 font-bold hover:bg-amber-100'
                    : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'text-primary-600' : isSiteQuote ? 'text-amber-600' : 'text-gray-500'}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Globe, Mail, Database, Settings as SettingsIcon, 
  LifeBuoy, Sparkles, Link2, FileText, Star, Package, BookOpen, Activity, Bell, Users
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DashboardSidebarProps {
  currentPath?: string;
}

export default function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: t('dash.nav_dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/sites', label: t('dash.nav_sites'), icon: Globe },
    { href: '/dashboard/systems', label: t('dash.nav_systems'), icon: Package },
    { href: '/dashboard/orders', label: t('dash.nav_orders'), icon: FileText },
    { href: '/dashboard/site-quote', label: t('dash.nav_quote'), icon: Sparkles },
    { href: '/dashboard/academy', label: t('dash.nav_academy'), icon: BookOpen },
    { href: '/dashboard/domains', label: t('dash.nav_domains'), icon: Link2 },
    { href: '/dashboard/email', label: t('dash.nav_email'), icon: Mail },
    { href: '/dashboard/notifications', label: t('dash.nav_notifications'), icon: Bell },
    { href: '/dashboard/affiliates', label: t('dash.nav_affiliates'), icon: Users },
    { href: '/dashboard/billing', label: t('dash.nav_billing'), icon: Database },
    { href: '/dashboard/tickets', label: t('dash.nav_tickets'), icon: LifeBuoy },
    { href: '/dashboard/uptime', label: t('dash.nav_uptime'), icon: Activity },
    { href: '/dashboard/settings', label: t('dash.nav_settings'), icon: SettingsIcon },
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
                  ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600' 
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
      </nav>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Globe, Mail, Database, Settings as SettingsIcon, 
  LifeBuoy, Link2, FileText, Star, Package, BookOpen, Activity, Bell, Users,
  LayoutTemplate, Sparkles, Layers
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { auth, User } from '@/lib/auth';

interface DashboardSidebarProps {
  currentPath?: string;
}

export default function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(auth.getCurrentUser());
  }, []);

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'enterprise':
        return { name: 'Plano Empresarial', icon: '🏢', bg: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'pro':
        return { name: 'Plano Profissional', icon: '🚀', bg: 'bg-purple-50 text-purple-900 border-purple-200' };
      case 'basic':
        return { name: 'Plano Básico', icon: '⭐', bg: 'bg-blue-50 text-blue-900 border-blue-200' };
      default:
        return { name: 'Sem Plano Ativo', icon: '⚪', bg: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return { text: 'Ativo', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
      case 'suspended':
        return { text: 'Suspenso', color: 'text-rose-700 bg-rose-100 border-rose-300' };
      case 'pending':
        return { text: 'Pendente', color: 'text-amber-700 bg-amber-100 border-amber-300' };
      default:
        return { text: 'Ativo', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    }
  };

  const planInfo = getPlanBadge(user?.plan);
  const statusInfo = getStatusBadge(user?.status);

  const navItems = [
    { href: '/dashboard', label: t('dash.nav_dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/builder', label: 'Construtor IA', icon: LayoutTemplate, isAi: true },
    { href: '/dashboard/visual-builder', label: 'Editor Visual Pro', icon: Layers, isAi: true },
    { href: '/dashboard/sites', label: t('dash.nav_sites'), icon: Globe },
    { href: '/dashboard/systems', label: t('dash.nav_systems'), icon: Package },
    { href: '/dashboard/orders', label: t('dash.nav_orders'), icon: FileText },
    { href: '/dashboard/billing', label: t('dash.nav_billing'), icon: Database },
    { href: '/dashboard/site-quote', label: t('dash.nav_quote'), icon: Sparkles },
    { href: '/dashboard/academy', label: t('dash.nav_academy'), icon: BookOpen },
    { href: '/dashboard/domains', label: t('dash.nav_domains'), icon: Link2 },
    { href: '/dashboard/email', label: t('dash.nav_email'), icon: Mail },
    { href: '/dashboard/notifications', label: t('dash.nav_notifications'), icon: Bell },
    { href: '/dashboard/affiliates', label: t('dash.nav_affiliates'), icon: Users },
    { href: '/dashboard/tickets', label: t('dash.nav_tickets'), icon: LifeBuoy },
    { href: '/dashboard/uptime', label: t('dash.nav_uptime'), icon: Activity },
    { href: '/dashboard/settings', label: t('dash.nav_settings'), icon: SettingsIcon },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      {/* Card do Plano Atual do Cliente */}
      {user && (
        <div className={`mb-4 p-3.5 rounded-xl border shadow-2xs ${planInfo.bg}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Plano Atual</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{planInfo.icon}</span>
            <span className="text-sm font-extrabold text-gray-900">{planInfo.name}</span>
          </div>
          {user.dueDate && (
            <p className="text-[11px] text-gray-600 mt-1">
              Vencimento: <strong className="text-gray-900 font-bold">Dia {user.dueDate}</strong> de cada mês
            </p>
          )}
          <Link
            href="/dashboard/billing"
            className="mt-2.5 flex items-center justify-between text-xs font-bold text-primary-700 hover:text-primary-800 transition group pt-2 border-t border-gray-200/60"
          >
            <span>📄 Baixar Faturas &amp; Recibos</span>
            <span className="group-hover:translate-x-0.5 transition-transform text-primary-600 font-bold">➔</span>
          </Link>
        </div>
      )}

      <nav className="space-y-1.5 sm:space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isSiteQuote = item.href === '/dashboard/site-quote' || item.href === '/site-quote';
          const isAi = (item as any).isAi;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition ${
                isActive 
                  ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600' 
                  : isAi
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50/80 text-blue-900 border border-blue-200/80 font-bold hover:from-blue-100 hover:to-indigo-100'
                    : isSiteQuote
                      ? 'bg-amber-50 text-amber-900 border border-amber-200/80 font-bold hover:bg-amber-100'
                      : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 truncate">
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'text-primary-600' : isAi ? 'text-blue-600 animate-pulse' : isSiteQuote ? 'text-amber-600' : 'text-gray-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {isAi && (
                <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                  NOVO
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

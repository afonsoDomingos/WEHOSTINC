'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Globe, Mail, Database, Settings as SettingsIcon, 
  LifeBuoy, Link2, FileText, Star, Package, BookOpen, Activity, Bell, Users,
  LayoutTemplate, Sparkles, Layers, Zap, Crown, Building2, Shield, Calendar, ArrowRight
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

  const getPlanConfig = (plan?: string) => {
    switch (plan) {
      case 'enterprise':
        return { 
          name: 'Empresarial', 
          icon: Building2, 
          iconColor: 'text-amber-600', 
          iconBg: 'bg-amber-100',
          border: 'border-amber-200/90',
          bg: 'from-amber-50/60 to-white'
        };
      case 'pro':
        return { 
          name: 'Profissional', 
          icon: Crown, 
          iconColor: 'text-purple-600', 
          iconBg: 'bg-purple-100',
          border: 'border-purple-200/90',
          bg: 'from-purple-50/60 to-white'
        };
      case 'basic':
        return { 
          name: 'Plano Básico', 
          icon: Zap, 
          iconColor: 'text-blue-600', 
          iconBg: 'bg-blue-100',
          border: 'border-blue-200/90',
          bg: 'from-blue-50/60 to-white'
        };
      default:
        return { 
          name: 'Sem Plano', 
          icon: Shield, 
          iconColor: 'text-gray-500', 
          iconBg: 'bg-gray-100',
          border: 'border-gray-200',
          bg: 'from-gray-50/60 to-white'
        };
    }
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'active':
        return { text: 'Ativo', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'suspended':
        return { text: 'Suspenso', badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
      case 'pending':
        return { text: 'Pendente', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
      default:
        return { text: 'Ativo', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    }
  };

  const planInfo = getPlanConfig(user?.plan);
  const statusInfo = getStatusConfig(user?.status);
  const PlanIcon = planInfo.icon;

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
    <div className="bg-white rounded-xl shadow-sm p-3.5 sm:p-5">
      {/* Micro-Card Compacto do Plano Atual */}
      {user && (
        <div className={`mb-3 p-2.5 rounded-xl border bg-gradient-to-b ${planInfo.bg} ${planInfo.border} shadow-2xs`}>
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center space-x-1.5 min-w-0">
              <div className={`p-1 rounded-md shrink-0 ${planInfo.iconBg}`}>
                <PlanIcon className={`h-3.5 w-3.5 ${planInfo.iconColor}`} />
              </div>
              <span className="text-xs font-extrabold text-gray-900 truncate">{planInfo.name}</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${statusInfo.badge}`}>
              <span className={`w-1 h-1 rounded-full ${statusInfo.dot}`}></span>
              {statusInfo.text}
            </span>
          </div>

          <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
            {user.dueDate ? (
              <span className="flex items-center gap-1 text-gray-500 truncate">
                <Calendar className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                <span>Vence dia <strong className="text-gray-800">{user.dueDate}</strong></span>
              </span>
            ) : (
              <span className="text-gray-400">Mensal</span>
            )}
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-1 font-bold text-primary-700 hover:text-primary-800 transition group ml-auto shrink-0"
              title="Baixar faturas e recibos"
            >
              <FileText className="h-2.5 w-2.5 text-primary-600" />
              <span>Faturas</span>
              <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
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

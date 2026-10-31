'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Server, LayoutDashboard, Globe, Mail, 
  Database, Settings as SettingsIcon, LogOut, Menu, X, User, LifeBuoy, Sparkles, Link2, RefreshCw, FileText, Star, Package, BookOpen, Bell, Users, Activity,
  LayoutTemplate, Layers, Zap, Crown, Building2, Shield
} from 'lucide-react';

import BrandLogo from '@/components/BrandLogo';
import LanguageSelector from '@/components/LanguageSelector';
import AdminClientViewBanner from '@/components/AdminClientViewBanner';
import { auth, User as AuthUser } from '@/lib/auth';
import { useLanguage } from '@/context/LanguageContext';

interface DashboardNavProps {
  userName?: string;
  userAvatar?: string;
  onLogout: () => void;
  onRefresh?: () => void;
}

export default function DashboardNav({ userName, userAvatar, onLogout, onRefresh }: DashboardNavProps) {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const pathname = usePathname();
  const actualUser = auth.getActualUser();
  const isActualAdmin = auth.isAdminUser(actualUser);

  useEffect(() => {
    setCurrentUser(auth.getCurrentUser());
  }, []);

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'enterprise':
        return { name: 'Empresarial', icon: Building2, iconColor: 'text-amber-600', bg: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100' };
      case 'pro':
        return { name: 'Profissional', icon: Crown, iconColor: 'text-purple-600', bg: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100' };
      case 'basic':
        return { name: 'Plano Básico', icon: Zap, iconColor: 'text-blue-600', bg: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100' };
      default:
        return { name: 'Sem Plano', icon: Shield, iconColor: 'text-gray-500', bg: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' };
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return { text: 'Ativo', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' };
      case 'suspended':
        return { text: 'Suspenso', color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500' };
      case 'pending':
        return { text: 'Pendente', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' };
      default:
        return { text: 'Ativo', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' };
    }
  };

  const planBadge = getPlanBadge(currentUser?.plan);
  const statusBadge = getStatusBadge(currentUser?.status);
  const NavPlanIcon = planBadge.icon;

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const navItems = [
    { href: '/dashboard', label: t('dash.nav_dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/sites', label: t('dash.nav_sites'), icon: Globe },
    { href: '/dashboard/email', label: t('dash.nav_email'), icon: Mail },
    { href: '/dashboard/domains', label: t('dash.nav_domains'), icon: Link2 },
    { href: '/dashboard/billing', label: t('dash.nav_billing'), icon: Database },
    { href: '/dashboard/orders', label: t('dash.nav_orders'), icon: FileText },
    { href: '/dashboard/builder', label: 'Construtor IA', icon: LayoutTemplate },
    { href: '/dashboard/visual-builder', label: 'Editor Visual Pro', icon: Layers },
    { href: '/dashboard/site-quote', label: t('dash.nav_quote'), icon: Sparkles },
    { href: '/dashboard/systems', label: t('dash.nav_systems'), icon: Package },
    { href: '/dashboard/academy', label: t('dash.nav_academy'), icon: BookOpen },
    { href: '/dashboard/affiliates', label: t('dash.nav_affiliates'), icon: Users },
    { href: '/dashboard/tickets', label: t('dash.nav_tickets'), icon: LifeBuoy },
    { href: '/dashboard/uptime', label: t('dash.nav_uptime'), icon: Activity },
    { href: '/dashboard/notifications', label: t('dash.nav_notifications'), icon: Bell },
    { href: '/dashboard/settings', label: t('dash.nav_settings'), icon: SettingsIcon },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Banner de Modo de Pré-visualização do Administrador */}
      <AdminClientViewBanner />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3.5">
            {/* Logo */}
            <BrandLogo />

            {/* Desktop User Info, Refresh, Notifications & Logout */}
            <div className="hidden md:flex items-center space-x-3.5">
              <LanguageSelector />

              {isActualAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition shadow-sm cursor-pointer"
                  title="Aceder ao Painel Administrativo"
                >
                  <span>{t('dash.admin_panel')}</span>
                </Link>
              )}

              <Link
                href="/dashboard/notifications"
                className="relative flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-lg transition shadow-sm cursor-pointer"
                title={t('dash.nav_notifications')}
              >
                <Bell className="h-3.5 w-3.5 text-purple-600" />
                <span>{t('dash.nav_notifications')}</span>
              </Link>

              <button
                type="button"
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200/80 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
                title="Atualizar dados do servidor"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-primary-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? t('dash.refreshing') : t('dash.refresh')}</span>
              </button>

              {/* Distintivo do Plano do Cliente */}
              {currentUser && (
                <Link
                  href="/dashboard/billing"
                  className={`hidden sm:flex items-center space-x-2 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition shadow-2xs cursor-pointer ${planBadge.bg}`}
                  title="Ver detalhes do plano, faturamento e renovação"
                >
                  <NavPlanIcon className={`h-3.5 w-3.5 ${planBadge.iconColor}`} />
                  <span className="font-extrabold">{planBadge.name}</span>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusBadge.color}`}>
                    <span className={`w-1 h-1 rounded-full ${statusBadge.dot}`}></span>
                    {statusBadge.text}
                  </span>
                </Link>
              )}

              {userName && (
                <div className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt="Avatar" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary-600" />
                  )}
                  <span>{t('dash.greeting')} <strong className="text-gray-900">{userName}</strong></span>
                </div>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center space-x-2 px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('dash.logout')}</span>
              </button>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <div className="flex md:hidden items-center space-x-2">
              <LanguageSelector />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu do painel"}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-800" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-800" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            {userName && (
              <div className="p-3 bg-primary-50/70 border border-primary-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-primary-700 font-medium">{t('dash.connected_user')}</p>
                    <p className="text-sm font-bold text-gray-900">{userName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { closeMobileMenu(); onLogout(); }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer"
                >
                  {t('dash.logout')}
                </button>
              </div>
            )}

            {/* Distintivo do Plano no Mobile */}
            {currentUser && (
              <Link
                href="/dashboard/billing"
                onClick={closeMobileMenu}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition ${planBadge.bg}`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-white/80 border border-gray-200/60 shadow-2xs">
                    <NavPlanIcon className={`h-4 w-4 ${planBadge.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500">Meu Plano</p>
                    <p className="text-xs font-extrabold text-gray-900">{planBadge.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                    <span className={`w-1 h-1 rounded-full ${statusBadge.dot}`}></span>
                    {statusBadge.text}
                  </span>
                  <span className="text-gray-400 text-xs">➔</span>
                </div>
              </Link>
            )}

            <nav className="flex flex-col space-y-1.5">
              <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {t('dash.nav_title')}
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      isActive 
                        ? 'bg-primary-600 text-white font-semibold shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Mobile Horizontal Quick Tab Bar */}
        <div className="lg:hidden bg-gray-50 border-t border-gray-200 overflow-x-auto">
          <div className="flex items-center space-x-1.5 px-4 py-2 w-max min-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition flex-shrink-0 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                  }`}
                >
                  <Icon className={`h-3 w-3 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>
    </>
  );
}

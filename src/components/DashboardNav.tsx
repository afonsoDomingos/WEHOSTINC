'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Server, LayoutDashboard, Globe, Mail, 
  Database, Settings as SettingsIcon, LogOut, Menu, X, User, LifeBuoy, Sparkles
} from 'lucide-react';

interface DashboardNavProps {
  userName?: string;
  onLogout: () => void;
}

export default function DashboardNav({ userName, onLogout }: DashboardNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/sites', label: 'Meus Sites', icon: Globe },
    { href: '/site-quote', label: 'Solicitar Site', icon: Sparkles },
    { href: '/dashboard/email', label: 'Email', icon: Mail },
    { href: '/dashboard/billing', label: 'Faturamento', icon: Database },
    { href: '/dashboard/tickets', label: 'Suporte', icon: LifeBuoy },
    { href: '/dashboard/settings', label: 'Configurações', icon: SettingsIcon },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3.5">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="p-2 bg-primary-50 rounded-xl">
                <Server className="h-6 w-6 text-primary-600" />
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                WEHOSTHERE
              </span>
            </Link>

            {/* Desktop User Info & Logout */}
            <div className="hidden md:flex items-center space-x-5">
              {userName && (
                <div className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
                  <User className="h-4 w-4 text-primary-600" />
                  <span>Olá, <strong className="text-gray-900">{userName}</strong></span>
                </div>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center space-x-2 px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <div className="flex md:hidden items-center space-x-2">
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
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-primary-700 font-medium">Usuário Conectado</p>
                    <p className="text-sm font-bold text-gray-900">{userName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { closeMobileMenu(); onLogout(); }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition"
                >
                  Sair
                </button>
              </div>
            )}

            <nav className="flex flex-col space-y-1.5">
              <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Navegação do Painel
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
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
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>
    </>
  );
}

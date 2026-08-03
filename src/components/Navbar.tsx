'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { auth, User } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setUser(auth.getCurrentUser());
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      auth.logout();
      setUser(null);
      closeMobileMenu();
      router.push('/');
    }, 400);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      {isLoggingOut && <PageLoader text="A encerrar a sua sessão com segurança..." />}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2.5 sm:py-3 md:py-4">
          
          {/* Logo */}
          <BrandLogo onClick={closeMobileMenu} />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              href="/#planos" 
              className="text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 transition"
            >
              {t('nav.plans')}
            </Link>
            <Link 
              href="/#criacao-sites" 
              className="text-xs sm:text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-primary-200/60 transition"
            >
              {t('nav.sites')}
            </Link>
            <Link 
              href="/systems" 
              className="text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 transition"
            >
              {t('nav.systems')}
            </Link>
            <Link 
              href="/#recursos" 
              className="text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 transition"
            >
              {t('nav.resources')}
            </Link>
            <Link 
              href="/#contacto" 
              className="text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 transition"
            >
              {t('nav.contact')}
            </Link>
          </nav>

          {/* Desktop CTA Action Buttons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
            <LanguageSelector />

            {user ? (
              <>
                <div className="flex items-center space-x-2 lg:space-x-3">
                  {user.avatar && (
                    <div className="relative group cursor-pointer">
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-primary-200 hover:border-primary-400 transition"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  <Link
                    href={user.role === 'admin' || user.email.toLowerCase() === 'admin@wehosthere.com' ? '/admin' : '/dashboard'}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition flex items-center space-x-1.5 sm:space-x-2"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{user.role === 'admin' || user.email.toLowerCase() === 'admin@wehosthere.com' ? t('nav.admin') : t('nav.dashboard')}</span>
                    <span className="sm:hidden">Painel</span>
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 sm:p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-gray-200"
                  title="Sair da Conta"
                >
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-primary-600 transition"
                >
                  {t('nav.login')}
                </Link>
                <Link 
                  href="/register" 
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-primary-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-sm hover:shadow transition"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-1 sm:space-x-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-lg px-3 sm:px-4 pt-2 sm:pt-3 pb-4 sm:pb-6 space-y-3 sm:space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1.5 sm:space-y-2">
            <Link
              href="#planos"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Planos de Hospedagem
            </Link>
            <Link
              href="/#criacao-sites"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold text-primary-700 bg-primary-50/80 border border-primary-100 flex items-center justify-between transition"
            >
              <span>Criação de Sites</span>
              <span className="text-[10px] sm:text-xs bg-primary-600 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">a partir 12.000 MT</span>
            </Link>
            <Link
              href="/systems"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Sistemas Prontos
            </Link>
            <Link
              href="#recursos"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Recursos
            </Link>
            <Link
              href="#contacto"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Contacto
            </Link>
          </nav>

          <div className="pt-2 sm:pt-2.5 border-t border-gray-100 flex flex-col space-y-2 sm:space-y-2.5">
            {user ? (
              <>
                {user.avatar ? (
                  <div className="flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Sessão iniciada como:</p>
                      <p className="text-xs sm:text-sm text-gray-900 font-bold truncate">{user.name}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 rounded-xl border border-gray-200 text-[10px] sm:text-xs text-gray-600 font-medium truncate">
                    Sessão iniciada como: <strong className="text-gray-900 font-bold block">{user.email}</strong>
                  </div>
                )}
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md transition flex items-center justify-center space-x-1.5 sm:space-x-2"
                >
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Meu Painel</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Sair da Conta</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md transition"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

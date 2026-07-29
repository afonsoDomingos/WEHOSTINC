'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Server, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3.5 md:py-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group" onClick={closeMobileMenu}>
            <div className="p-2 bg-primary-50 rounded-xl group-hover:bg-primary-100 transition">
              <Server className="h-6 w-6 text-primary-600" />
            </div>
            <span className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
              WEHOSTHERE
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="#planos" 
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition"
            >
              Planos
            </Link>
            <Link 
              href="#criacao-sites" 
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200/60 transition"
            >
              Criação de Sites (a partir de 12.000 MT)
            </Link>
            <Link 
              href="#recursos" 
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition"
            >
              Recursos
            </Link>
            <Link 
              href="#contacto" 
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition"
            >
              Contacto
            </Link>
          </nav>

          {/* Desktop CTA Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary-600 transition"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-sm hover:shadow transition"
            >
              Criar Conta
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
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

      {/* Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2">
            <Link
              href="#planos"
              onClick={closeMobileMenu}
              className="px-4 py-3 rounded-xl text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Planos de Hospedagem
            </Link>
            <Link
              href="#criacao-sites"
              onClick={closeMobileMenu}
              className="px-4 py-3 rounded-xl text-base font-semibold text-primary-700 bg-primary-50/80 border border-primary-100 flex items-center justify-between transition"
            >
              <span>Criação de Sites</span>
              <span className="text-xs bg-primary-600 text-white px-2.5 py-1 rounded-full">a partir 12.000 MT</span>
            </Link>
            <Link
              href="#recursos"
              onClick={closeMobileMenu}
              className="px-4 py-3 rounded-xl text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Recursos
            </Link>
            <Link
              href="#contacto"
              onClick={closeMobileMenu}
              className="px-4 py-3 rounded-xl text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Contacto
            </Link>
          </nav>

          <div className="pt-2 border-t border-gray-100 flex flex-col space-y-2.5">
            <Link
              href="/login"
              onClick={closeMobileMenu}
              className="w-full text-center py-3 px-4 rounded-xl text-base font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 transition"
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={closeMobileMenu}
              className="w-full text-center py-3 px-4 rounded-xl text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md transition"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

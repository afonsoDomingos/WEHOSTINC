'use client';

import { Home, AlertCircle, Globe, ArrowRight, Zap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="text-center max-w-lg mx-auto relative z-10 w-full">
        {/* Animated icon */}
        <div className="mb-6 sm:mb-8 flex justify-center animate-bounce">
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full"></div>
            <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-6 sm:p-8 border border-white/30">
              <Globe className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-3 sm:mb-4 drop-shadow-2xl animate-fade-in">
          404
        </h1>
        
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
          Página Não Encontrada
        </h2>
        
        <p className="text-white/90 text-base sm:text-lg mb-6 sm:mb-10 leading-relaxed max-w-md mx-auto px-2">
          A página que você está procurando não existe ou foi movida. 
          Explore nossos serviços de hospedagem e domínios em Moçambique.
        </p>

        {/* Action Cards */}
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => window.location.href = '/'}
            className="group relative overflow-hidden bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/30 text-white font-bold px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
              <Home className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
              <span className="text-sm sm:text-base">Voltar para a Página Inicial</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <button
            onClick={() => window.location.href = '/dominios'}
            className="group relative overflow-hidden bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/30 text-white font-bold px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
              <Globe className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
              <span className="text-sm sm:text-base">Buscar Domínios</span>
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs sm:text-sm px-2">
          <a href="/hospedagem" className="text-white/80 hover:text-white hover:underline transition">
            Hospedagem
          </a>
          <span className="text-white/40">•</span>
          <a href="/email-profissional" className="text-white/80 hover:text-white hover:underline transition">
            Email Profissional
          </a>
          <span className="text-white/40">•</span>
          <a href="/loja-online" className="text-white/80 hover:text-white hover:underline transition">
            Loja Online
          </a>
          <span className="text-white/40">•</span>
          <a href="/inteligencia-artificial" className="text-white/80 hover:text-white hover:underline transition">
            Inteligência Artificial
          </a>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/20">
          <p className="text-xs sm:text-sm text-white/60">
            WEHOSTHERE - Hospedagem de Sites & Email Profissional em Moçambique
          </p>
        </div>
      </div>
    </div>
  );
}
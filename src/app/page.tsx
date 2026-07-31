'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { Server, Mail, Shield, Zap, Globe, Users, Search, Sparkles, CheckCircle, Facebook, Phone } from "lucide-react";
import { websiteTypes } from '@/lib/data';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

import Navbar from '@/components/Navbar';

import DomainSearch from '@/components/DomainSearch';

export default function Home() {
  const [isAnnual, setIsAnnual] = useState(false);

  // Ticker animado pelos tipos de sites e seus preços
  const tickerTypes = websiteTypes.filter(t => t.basePrice < 100000);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIndex(prev => (prev + 1) % tickerTypes.length);
        setTickerVisible(true);
      }, 350);
    }, 2500);
    return () => clearInterval(interval);
  }, [tickerTypes.length]);

  // Refs de animação de scroll do Hero (callback refs)
  const badgeRef = useScrollAnimation<HTMLDivElement>();
  const titleRef = useScrollAnimation<HTMLHeadingElement>();
  const subtitleRef = useScrollAnimation<HTMLParagraphElement>();
  const searchRef = useScrollAnimation<HTMLDivElement>();
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar Responsivo */}
      <Navbar />

      {/* Hero + Banner unificados — fundo estático, sem layout shift ao pesquisar */}
      <section id="infraestrutura" className="relative min-h-[700px] px-4 bg-slate-950 text-white overflow-hidden shadow-2xl w-full flex items-start justify-center pb-0">
        {/* Imagem de Fundo estática — não se move com o conteúdo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
          style={{ backgroundImage: "url('/servidores-banner.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/70 to-slate-950" />

        {/* Conteúdo que cresce para baixo — o fundo não mexe */}
        <div className="relative z-10 w-full max-w-7xl mx-auto text-center pt-24 pb-10">

          {/* Badge — entra vindo de cima */}
          <div
            ref={badgeRef}
            className="anim-fade-down inline-flex items-center space-x-2 bg-primary-600/30 border border-primary-400/50 text-primary-200 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-6 backdrop-blur-md shadow-lg"
          >
            <Sparkles className="h-4 w-4 text-primary-300" />
            <span>Infraestrutura Datacenter de Última Geração</span>
          </div>

          {/* Título principal — efeito typewriter + shimmer, com delay */}
          <h1
            ref={titleRef}
            className="anim-typewriter anim-delay-200 text-4xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight drop-shadow-lg"
          >
            Domínio, Hospedagem, Email{' '}
            <span className="hero-title-shimmer">e Site</span>
          </h1>

          {/* Subtítulo — sobe do baixo */}
          <p
            ref={subtitleRef}
            className="anim-fade-up anim-delay-300 text-base sm:text-xl text-slate-200 mb-8 max-w-2xl mx-auto font-semibold drop-shadow"
          >
            Tudo o que a sua empresa precisa para ter uma presença online de alta performance em Moçambique com servidores ultrarrápidos e seguros.
          </p>

          {/* Domain Search — entra com zoom ligeiro */}
          <div ref={searchRef} className="anim-zoom-in anim-delay-400">
            <DomainSearch />
          </div>
        </div>
      </section>

      {/* Features - 1 Única Linha no Mobile */}
      <section id="recursos" className="py-8 sm:py-14 px-3 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-3xl font-extrabold text-center text-gray-900 mb-6 sm:mb-10">
            Por que escolher a WEHOSTHERE?
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            <div className="text-center p-2.5 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
              <div className="flex justify-center mb-1.5">
                <Zap className="h-6 w-6 sm:h-10 sm:w-10 text-primary-600" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold text-gray-900 mb-0.5">Ultra Rápido</h3>
              <p className="text-[10px] sm:text-sm text-gray-500 leading-tight">Servidores de máxima performance</p>
            </div>

            <div className="text-center p-2.5 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
              <div className="flex justify-center mb-1.5">
                <Shield className="h-6 w-6 sm:h-10 sm:w-10 text-primary-600" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold text-gray-900 mb-0.5">100% Seguro</h3>
              <p className="text-[10px] sm:text-sm text-gray-500 leading-tight">Backup diário &amp; proteção total</p>
            </div>

            <div className="text-center p-2.5 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
              <div className="flex justify-center mb-1.5">
                <Users className="h-6 w-6 sm:h-10 sm:w-10 text-primary-600" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold text-gray-900 mb-0.5">Suporte 24/7</h3>
              <p className="text-[10px] sm:text-sm text-gray-500 leading-tight">Equipa técnica sempre disponível</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 px-4 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Planos de Hospedagem
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto mb-6">
              Escolha o plano ideal para o seu projeto com pagamento mensal ou anual com desconto.
            </p>

            {/* Mensal / Anual Toggle Switch */}
            <div className="inline-flex items-center bg-gray-200 p-1.5 rounded-full border border-gray-300 shadow-inner">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition cursor-pointer ${
                  !isAnnual ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cobrança Mensal
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  isAnnual ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Cobrança Anual</span>
                <span className="bg-amber-400 text-gray-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  2 Meses Grátis
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Basic Plan */}
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-between border border-gray-100">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Básico</h3>
                <p className="text-gray-600 mb-4">Ideal para iniciantes</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {isAnnual ? '5.500 MT' : '550 MT'}
                  </span>
                  <span className="text-gray-600 text-sm font-medium">
                    {isAnnual ? ' /ano' : ' /mês'}
                  </span>
                  {isAnnual && (
                    <div className="text-xs font-semibold text-emerald-600 mt-1">
                      Equivale a 100 MT/mês (Economize 240 MT)
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-700">
                    <Server className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                    1 Site
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Mail className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                    5 Contas de Email
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Globe className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                    10 GB Armazenamento
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Zap className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                    Tráfego Ilimitado
                  </li>
                </ul>
              </div>
              <Link
                href={`/checkout?plan=basic&billingCycle=${isAnnual ? 'annual' : 'monthly'}`}
                className="block w-full py-3 text-center border-2 border-primary-600 text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition"
              >
                Assinar Agora
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-primary-600 rounded-xl shadow-xl p-8 text-white flex flex-col justify-between relative transform lg:-translate-y-2 border border-primary-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-gray-900 text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider shadow">
                MAIS POPULAR
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 pt-2">Profissional</h3>
                <p className="text-blue-100 mb-4">Para negócios em crescimento</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {isAnnual ? '25.000 MT' : '2.500 MT'}
                  </span>
                  <span className="text-blue-100 text-sm font-medium">
                    {isAnnual ? ' /ano' : ' /mês'}
                  </span>
                  {isAnnual && (
                    <div className="text-xs font-semibold text-amber-300 mt-1">
                      Equivale a 250 MT/mês (Economize 600 MT)
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-white">
                    <Server className="h-5 w-5 text-blue-200 mr-2 flex-shrink-0" />
                    5 Sites
                  </li>
                  <li className="flex items-center text-white">
                    <Mail className="h-5 w-5 text-blue-200 mr-2 flex-shrink-0" />
                    20 Contas de Email
                  </li>
                  <li className="flex items-center text-white">
                    <Globe className="h-5 w-5 text-blue-200 mr-2 flex-shrink-0" />
                    50 GB Armazenamento
                  </li>
                  <li className="flex items-center text-white">
                    <Zap className="h-5 w-5 text-blue-200 mr-2 flex-shrink-0" />
                    Tráfego Ilimitado
                  </li>
                  <li className="flex items-center text-white">
                    <Shield className="h-5 w-5 text-blue-200 mr-2 flex-shrink-0" />
                    SSL Grátis
                  </li>
                </ul>
              </div>
              <Link
                href={`/checkout?plan=pro&billingCycle=${isAnnual ? 'annual' : 'monthly'}`}
                className="block w-full py-3.5 text-center bg-white text-primary-700 rounded-xl hover:bg-gray-100 transition font-bold shadow-md"
              >
                Assinar Agora
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-between border border-gray-100">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Empresarial</h3>
                <p className="text-gray-600 mb-4">Para grandes operações</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {isAnnual ? '62.000 MT' : '6.200 MT'}
                  </span>
                  <span className="text-gray-600 text-sm font-medium">
                    {isAnnual ? ' /ano' : ' /mês'}
                  </span>
                  {isAnnual && (
                    <div className="text-xs font-semibold text-emerald-600 mt-1">
                      Equivale a 516 MT/mês (Economize 1.240 MT)
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-700">
                    <Server className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                    Sites Ilimitados
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Mail className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                    Email Ilimitado
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Globe className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                    200 GB Armazenamento
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Zap className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                    Tráfego Ilimitado
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Shield className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                    SSL + CDN Grátis
                  </li>
                </ul>
              </div>
              <Link
                href={`/checkout?plan=enterprise&billingCycle=${isAnnual ? 'annual' : 'monthly'}`}
                className="block w-full py-3 text-center border-2 border-primary-600 text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition"
              >
                Assinar Agora
              </Link>
            </div>
          </div>

          {/* Website Creation Service Banner (25.000 MT - Light Theme & Compact) */}
          <div id="criacao-sites" className="mt-10 bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-gray-200 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="inline-flex items-center space-x-1.5 bg-primary-50 text-primary-800 border border-primary-200 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                  <span>Serviço Premium de Desenvolvimento</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                  Criação de Sites Profissionais
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed max-w-2xl">
                  Desenvolvemos a presença online completa da sua empresa em Moçambique com design exclusivo, moderno, rápido e otimizado para o Google.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>Design Responsivo (Mobile & Desktop)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>Domínio .co.mz + 1 Ano Hospedagem Grátis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>Integração WhatsApp & Redes Sociais</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>E-mails Corporativos Ilimitados</span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-72 bg-gradient-to-b from-gray-50 to-primary-50/40 rounded-2xl p-5 border border-gray-200 text-center flex flex-col justify-between shrink-0 shadow-sm overflow-hidden">
                <div>
                  <span className="text-[11px] uppercase font-bold text-gray-500 tracking-wider block mb-2">Investimento Único</span>

                  {/* Ticker animado */}
                  <div className="min-h-[80px] flex flex-col items-center justify-center">
                    <div
                      style={{
                        opacity: tickerVisible ? 1 : 0,
                        transform: tickerVisible ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.35s ease, transform 0.35s ease'
                      }}
                    >
                      <div className="flex items-center justify-center space-x-1.5 mb-1">
                        <span className="text-lg">{tickerTypes[tickerIndex]?.emoji}</span>
                        <span className="text-[11px] font-bold text-gray-500 truncate max-w-[160px]">
                          {tickerTypes[tickerIndex]?.name}
                        </span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-primary-700">
                        {tickerTypes[tickerIndex]?.basePrice.toLocaleString('pt-MZ')} MT
                      </div>
                    </div>
                  </div>

                  {/* Dots indicadores */}
                  <div className="flex justify-center gap-1 mt-2 mb-3">
                    {tickerTypes.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setTickerVisible(false); setTimeout(() => { setTickerIndex(i); setTickerVisible(true); }, 300); }}
                        className={`rounded-full transition-all duration-300 cursor-pointer ${i === tickerIndex ? 'w-4 h-1.5 bg-primary-600' : 'w-1.5 h-1.5 bg-gray-300'}`}
                      />
                    ))}
                  </div>

                  <p className="text-[10px] text-gray-400 mb-4 font-medium">Preço varia consoante o tipo de site • Pagamento parcelado</p>
                </div>

                <Link
                  href="/site-quote"
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition duration-200 block text-center"
                >
                  Ver Todos os Tipos de Site →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer com Fundo do Datacenter em Alta Tecnologia */}
      <footer id="contacto" className="relative bg-slate-950 text-white py-16 px-4 overflow-hidden border-t border-slate-800">
        {/* Imagem de Fundo Datacenter 100% Visível em Cores Reais */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-65"
          style={{ backgroundImage: "url('/footer-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/75 to-slate-950/80" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Server className="h-8 w-8 text-primary-400" />
                <span className="text-2xl font-bold tracking-tight">WEHOSTHERE</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Sua solução completa em hospedagem de sites, e-mail corporativo e servidores em Moçambique.
              </p>
              
              {/* Link Oficial do Facebook */}
              <a
                href="https://www.facebook.com/profile.php?id=61592497206566&locale=pt_BR"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md group"
              >
                <Facebook className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" />
                <span>Página Oficial Facebook</span>
              </a>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Produtos</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="hover:text-primary-300 transition cursor-pointer">Hospedagem de Sites</li>
                <li className="hover:text-primary-300 transition cursor-pointer">Email Corporativo</li>
                <li className="hover:text-primary-300 transition cursor-pointer">Servidores VPS</li>
                <li className="hover:text-primary-300 transition cursor-pointer">Registo de Domínios</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Suporte & Contacto</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="hover:text-primary-300 transition flex items-center space-x-1.5 font-bold text-slate-200">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>+258 84 438 4702</span>
                </li>
                <li className="hover:text-primary-300 transition cursor-pointer">Central de Ajuda</li>
                <li className="hover:text-primary-300 transition cursor-pointer">Tutoriais & Documentação</li>
                <li className="hover:text-primary-300 transition cursor-pointer">Status do Sistema</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Legal & Garantias</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="hover:text-primary-300 transition cursor-pointer">Termos de Serviço</li>
                <li className="hover:text-primary-300 transition cursor-pointer">Política de Privacidade</li>
                <li className="hover:text-primary-300 transition cursor-pointer">SLA 99.9% Uptime</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/80 mt-12 pt-8 text-center text-slate-400 text-xs font-medium">
            <p>&copy; {new Date().getFullYear()} WEHOSTHERE. Todos os direitos reservados. Moçambique.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

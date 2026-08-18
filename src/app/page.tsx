'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { Server, Mail, Shield, Zap, Globe, Users, Search, Sparkles, CheckCircle, Facebook, Phone, Linkedin, Star, ArrowRight, Play, Calendar, Eye } from "lucide-react";
import { websiteTypes } from '@/lib/data';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

import Navbar from '@/components/Navbar';

import DomainSearch from '@/components/DomainSearch';
import VirtualAssistant from '@/components/VirtualAssistant';
import InteractiveSteps from '@/components/InteractiveSteps';
import PartnersSection from '@/components/PartnersSection';
import NewsletterForm from '@/components/NewsletterForm';
import NewsletterPopup from '@/components/NewsletterPopup';

export default function Home() {
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // Buscar posts do blog
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setBlogLoading(true);
        console.log('[Home] Buscando posts do blog...');
        const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
        const response = await fetch(`/api/blog/posts?status=published&limit=3${categoryParam}`);
        const data = await response.json();
        
        console.log('[Home] Resposta da API:', data);
        
        if (data.success) {
          console.log('[Home] Posts encontrados:', data.posts.length);
          setBlogPosts(data.posts);
        } else {
          console.error('[Home] Erro na API:', data.error);
        }
      } catch (error) {
        console.error('[Home] Erro ao buscar posts do blog:', error);
      } finally {
        setBlogLoading(false);
      }
    };

    fetchBlogPosts();
  }, [selectedCategory]);

  // Refs de animação de scroll do Hero (callback refs)
  const badgeRef = useScrollAnimation<HTMLDivElement>();
  const titleRef = useScrollAnimation<HTMLHeadingElement>();
  const subtitleRef = useScrollAnimation<HTMLParagraphElement>();
  const searchRef = useScrollAnimation<HTMLDivElement>();

  // Refs para scroll reveal das outras seções
  const featuresRef = useScrollAnimation<HTMLDivElement>();
  const pricingRef = useScrollAnimation<HTMLDivElement>();
  const siteCreationRef = useScrollAnimation<HTMLDivElement>();
  const systemsRentRef = useScrollAnimation<HTMLDivElement>();
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar Responsivo */}
      <Navbar />

      {/* Hero + Banner unificados — fundo estático, sem layout shift ao pesquisar */}
      <section id="infraestrutura" className="relative min-h-[600px] sm:min-h-[700px] px-4 bg-slate-950 text-white overflow-hidden shadow-2xl w-full flex items-start justify-center pb-0">
        {/* Imagem de Fundo estática — não se move com o conteúdo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
          style={{ backgroundImage: "url('/servidores-banner.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/70 to-slate-950" />

        {/* Conteúdo que cresce para baixo — o fundo não mexe */}
        <div className="relative z-10 w-full max-w-7xl mx-auto text-center pt-16 sm:pt-24 pb-8 sm:pb-10">

          {/* Badge — entra vindo de cima */}
          <div
            ref={badgeRef}
            className="anim-fade-down inline-flex items-center space-x-2 bg-primary-600/30 border border-primary-400/50 text-primary-200 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs sm:text-sm font-bold mb-4 sm:mb-6 backdrop-blur-md shadow-lg"
          >
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary-300" />
            <span className="hidden sm:inline">Infraestrutura Datacenter de Última Geração</span>
            <span className="sm:hidden">Datacenter de Alta Performance</span>
          </div>

          {/* Título principal — efeito typewriter + shimmer, com delay */}
          <h1
            ref={titleRef}
            className="anim-typewriter anim-delay-200 text-2xl sm:text-4xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight leading-tight drop-shadow-lg"
          >
            Domínio, Hospedagem, Email{' '}
            <span className="hero-title-shimmer">e Site</span>
          </h1>

          {/* Subtítulo — sobe do baixo */}
          <p
            ref={subtitleRef}
            className="anim-fade-up anim-delay-300 text-sm sm:text-base lg:text-xl text-slate-200 mb-6 sm:mb-8 max-w-2xl mx-auto font-semibold drop-shadow px-2"
          >
            Tudo o que a sua empresa precisa para ter uma presença online de alta performance em Moçambique com servidores ultrarrápidos e seguros.
          </p>

          {/* Domain Search — entra com zoom ligeiro */}
          <div ref={searchRef} className="anim-zoom-in anim-delay-400 px-2">
            <DomainSearch />
          </div>
        </div>
      </section>

      {/* Features - Mobile First */}
      <section id="recursos" ref={featuresRef} className="anim-fade-up py-6 sm:py-14 px-3 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-center text-gray-900 mb-4 sm:mb-10">
            Por que escolher a WEHOSTHERE?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            <div className="text-center p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100 hover:shadow-lg hover:scale-105 hover:bg-gradient-to-br hover:from-primary-50 hover:to-blue-50 transition-all duration-300 cursor-pointer group">
              <div className="flex justify-center mb-2">
                <Zap className="h-6 w-6 sm:h-10 sm:w-10 text-primary-600 group-hover:scale-110 group-hover:text-primary-700 transition-transform duration-300" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">Ultra Rápido</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Servidores de máxima performance</p>
            </div>

            <div className="text-center p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100 hover:shadow-lg hover:scale-105 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 transition-all duration-300 cursor-pointer group">
              <div className="flex justify-center mb-2">
                <Shield className="h-6 w-6 sm:h-10 sm:w-10 text-primary-600 group-hover:scale-110 group-hover:text-emerald-600 transition-transform duration-300" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">100% Seguro</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Backup diário &amp; proteção total</p>
            </div>

            <div className="text-center p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100 hover:shadow-lg hover:scale-105 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer group">
              <div className="flex justify-center mb-2">
                <Users className="h-6 w-6 sm:h-10 sm:w-10 text-primary-600 group-hover:scale-110 group-hover:text-purple-600 transition-transform duration-300" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">Suporte 24/7</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Equipa técnica sempre disponível</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" ref={pricingRef} className="anim-fade-up py-12 sm:py-20 px-3 sm:px-4 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Planos de Hospedagem
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto mb-4 sm:mb-6 px-2">
              Escolha o plano ideal para o seu projeto com pagamento mensal ou anual com desconto.
            </p>

            {/* Seleção de Duração / Período da Hospedagem */}
            <div className="inline-flex flex-wrap items-center justify-center bg-gray-200 p-1.5 rounded-2xl border border-gray-300 shadow-inner gap-1 max-w-full">
              <button
                type="button"
                onClick={() => setDurationMonths(1)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs sm:text-sm font-bold transition cursor-pointer hover:scale-105 active:scale-95 ${
                  durationMonths === 1 ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                1 Mês
              </button>
              <button
                type="button"
                onClick={() => setDurationMonths(3)}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs sm:text-sm font-bold transition flex items-center space-x-0.5 sm:space-x-1 cursor-pointer hover:scale-105 active:scale-95 ${
                  durationMonths === 3 ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>3 Meses</span>
                <span className="bg-blue-200 text-blue-900 text-[8px] sm:text-[10px] font-extrabold px-1 sm:px-1.5 py-0.2 rounded-full hidden sm:inline">
                  -5% OFF
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDurationMonths(6)}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs sm:text-sm font-bold transition flex items-center space-x-0.5 sm:space-x-1 cursor-pointer hover:scale-105 active:scale-95 ${
                  durationMonths === 6 ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>6 Meses</span>
                <span className="bg-purple-200 text-purple-900 text-[8px] sm:text-[10px] font-extrabold px-1 sm:px-1.5 py-0.2 rounded-full hidden sm:inline">
                  -10% OFF
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDurationMonths(12)}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs sm:text-sm font-bold transition flex items-center space-x-0.5 sm:space-x-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
                  durationMonths === 12 ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>1 Ano</span>
                <span className="bg-amber-400 text-gray-900 text-[8px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline">
                  2 Meses Grátis
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8 items-stretch">
            {/* Basic Plan */}
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8 flex flex-col justify-between border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Básico</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">Ideal para iniciantes</p>
                <div className="mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-4xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {durationMonths === 12
                      ? '5.500 MT'
                      : durationMonths === 6
                      ? '2.970 MT'
                      : durationMonths === 3
                      ? '1.568 MT'
                      : '550 MT'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {durationMonths === 12 ? ' /ano' : ` /${durationMonths}M`}
                  </span>
                  {durationMonths > 1 && (
                    <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 mt-1">
                      {durationMonths === 12
                        ? 'Economize 1.100 MT (2 meses grátis)'
                        : durationMonths === 6
                        ? 'Economize 330 MT (10% Desconto)'
                        : 'Economize 82 MT (5% Desconto)'}
                    </div>
                  )}
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Server className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    1 Site
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    5 Contas de Email
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    10 GB Armazenamento
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    Tráfego Ilimitado
                  </li>
                </ul>
              </div>
              <Link
                href={`/checkout?plan=basic&billingCycle=${durationMonths === 12 ? 'annual' : 'monthly'}`}
                className="block w-full py-2.5 sm:py-3 text-center border-2 border-primary-600 text-primary-600 font-bold rounded-xl hover:bg-primary-50 hover:scale-105 active:scale-95 transition-all duration-300 text-xs sm:text-sm"
              >
                Assinar Agora
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-primary-600 rounded-xl shadow-xl p-5 sm:p-8 text-white flex flex-col justify-between relative transform lg:-translate-y-2 border border-primary-500 hover:shadow-2xl hover:-translate-y-4 transition-all duration-300 group">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-gray-900 text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1 rounded-full uppercase tracking-wider shadow group-hover:scale-110 transition-transform">
                MAIS POPULAR
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 pt-2 group-hover:text-blue-100 transition-colors">Profissional</h3>
                <p className="text-sm sm:text-base text-blue-100 mb-4">Para negócios em crescimento</p>
                <div className="mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-4xl font-bold text-white group-hover:text-blue-100 transition-colors">
                    {durationMonths === 12
                      ? '25.000 MT'
                      : durationMonths === 6
                      ? '13.500 MT'
                      : durationMonths === 3
                      ? '7.125 MT'
                      : '2.500 MT'}
                  </span>
                  <span className="text-xs sm:text-sm text-blue-100 text-sm font-medium">
                    {durationMonths === 12 ? ' /ano' : ` /${durationMonths}M`}
                  </span>
                  {durationMonths > 1 && (
                    <div className="text-[10px] sm:text-xs font-semibold text-amber-300 mt-1">
                      {durationMonths === 12
                        ? 'Economize 5.000 MT (2 meses grátis)'
                        : durationMonths === 6
                        ? 'Economize 1.500 MT (10% Desconto)'
                        : 'Economize 375 MT (5% Desconto)'}
                    </div>
                  )}
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Server className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    5 Sites
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    20 Contas de Email
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    50 GB Armazenamento
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    Tráfego Ilimitado
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    SSL Grátis
                  </li>
                </ul>
              </div>
              <Link
                href={`/checkout?plan=pro&billingCycle=${durationMonths === 12 ? 'annual' : 'monthly'}`}
                className="block w-full py-2.5 sm:py-3.5 text-center bg-white text-primary-700 rounded-xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-300 font-bold shadow-md text-xs sm:text-sm"
              >
                Assinar Agora
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8 flex flex-col justify-between border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Empresarial</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">Para grandes operações</p>
                <div className="mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-4xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {durationMonths === 12
                      ? '62.000 MT'
                      : durationMonths === 6
                      ? '33.480 MT'
                      : durationMonths === 3
                      ? '17.670 MT'
                      : '6.200 MT'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {durationMonths === 12 ? ' /ano' : ` /${durationMonths}M`}
                  </span>
                  {durationMonths > 1 && (
                    <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 mt-1">
                      {durationMonths === 12
                        ? 'Economize 12.400 MT (2 meses grátis)'
                        : durationMonths === 6
                        ? 'Economize 3.720 MT (10% Desconto)'
                        : 'Economize 930 MT (5% Desconto)'}
                    </div>
                  )}
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Server className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    Sites Ilimitados
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    Email Ilimitado
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    200 GB Armazenamento
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    Tráfego Ilimitado
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    SSL + CDN Grátis
                  </li>
                </ul>
              </div>
              <Link
                href={`/checkout?plan=enterprise&billingCycle=${durationMonths === 12 ? 'annual' : 'monthly'}`}
                className="block w-full py-2.5 sm:py-3 text-center border-2 border-primary-600 text-primary-600 font-bold rounded-xl hover:bg-primary-50 hover:scale-105 active:scale-95 transition-all duration-300 text-xs sm:text-sm"
              >
                Assinar Agora
              </Link>
            </div>
          </div>

          {/* Website Creation Service Banner - Mobile First */}
          <div id="criacao-sites" ref={siteCreationRef} className="anim-fade-up mt-6 sm:mt-10 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-200 relative overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
              <div className="flex-1">
                <div className="inline-flex items-center space-x-1 sm:space-x-1.5 bg-primary-50 text-primary-800 border border-primary-200 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 sm:mb-2.5 hover:bg-primary-100 transition-colors cursor-default">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span>Serviço Premium</span>
                </div>
                <h3 className="text-lg sm:text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-primary-600 transition-colors">
                  Criação de Sites Profissionais
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed max-w-2xl">
                  Desenvolvemos a presença online completa da sua empresa em Moçambique com design exclusivo, moderno, rápido e otimizado para o Google.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-700">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 group cursor-default">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-emerald-700 transition-colors">Design Responsivo</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 group cursor-default">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-emerald-700 transition-colors">Domínio + 1 Ano Grátis</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 group cursor-default">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-emerald-700 transition-colors">WhatsApp & Redes</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 group cursor-default">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-emerald-700 transition-colors">Emails Ilimitados</span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-72 bg-gradient-to-b from-gray-50 to-primary-50/40 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-200 text-center flex flex-col justify-between shrink-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div>
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-gray-500 tracking-wider block mb-1.5 sm:mb-2">Investimento Único</span>

                  {/* Ticker animado */}
                  <div className="min-h-[60px] sm:min-h-[80px] flex flex-col items-center justify-center">
                    <div
                      style={{
                        opacity: tickerVisible ? 1 : 0,
                        transform: tickerVisible ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.35s ease, transform 0.35s ease'
                      }}
                    >
                      <div className="flex items-center justify-center space-x-1 sm:space-x-1.5 mb-0.5 sm:mb-1">
                        <span className="text-sm sm:text-lg">{tickerTypes[tickerIndex]?.emoji}</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 truncate max-w-[120px] sm:max-w-[160px]">
                          {tickerTypes[tickerIndex]?.name}
                        </span>
                      </div>
                      <div className="text-xl sm:text-3xl sm:text-4xl font-black text-primary-700">
                        {tickerTypes[tickerIndex]?.basePrice.toLocaleString('pt-MZ')} MT
                      </div>
                    </div>
                  </div>

                  {/* Dots indicadores */}
                  <div className="flex justify-center gap-0.5 sm:gap-1 mt-1.5 sm:mt-2 mb-2 sm:mb-3">
                    {tickerTypes.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setTickerVisible(false); setTimeout(() => { setTickerIndex(i); setTickerVisible(true); }, 300); }}
                        className={`rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${i === tickerIndex ? 'w-3 h-1 sm:w-4 sm:h-1.5 bg-primary-600' : 'w-1.5 h-1 sm:w-1.5 sm:h-1.5 bg-gray-300'}`}
                      />
                    ))}
                  </div>

                  <p className="text-[9px] sm:text-[10px] text-gray-400 mb-2 sm:mb-4 font-medium">Preço varia por tipo • Parcelado</p>
                </div>

                <Link
                  href="/site-quote"
                  className="w-full py-2 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] sm:text-xs sm:text-sm rounded-xl shadow transition duration-200 block text-center hover:scale-105 active:scale-95 transition-transform"
                >
                  Ver Tipos de Site →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Systems for Rent Section - Mobile First */}
      <section id="sistemas-aluguer" ref={systemsRentRef} className="anim-fade-up py-10 sm:py-16 px-3 sm:px-6 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-purple-100 text-purple-800 border border-purple-200 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              <span>Novo Serviço</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2 sm:mb-3">
              Aluguel de Sistemas Profissionais
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-4 sm:mb-6 px-2">
              Alugue sistemas prontos para usar sem precisar desenvolver do zero. ERP, CRM, Gestão de Stocks, e muito mais.
            </p>
          </div>

          {/* Como Funciona */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-200 mb-6 sm:mb-10">
            <InteractiveSteps />
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/systems"
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Ver Sistemas Disponíveis</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3">
              Ciclo mensal ou anual • Suporte incluído
            </p>
          </div>
        </div>
      </section>

      {/* Blog/News Section */}
      <section className="py-10 sm:py-16 px-3 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                ← Voltar ao Início
              </Link>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2 sm:mb-3">
              Notícias e Atualizações
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Fique por dentro das últimas novidades sobre hospedagem, tecnologia e dicas para o seu negócio online.
            </p>
          </div>

          {/* Menu de Categorias */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'news', label: 'Notícias' },
              { id: 'tutorial', label: 'Tutoriais' },
              { id: 'announcement', label: 'Anúncios' },
              { id: 'update', label: 'Atualizações' },
              { id: 'feature', label: 'Funcionalidades' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {blogLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : blogPosts.length > 0 ? (
            <div className="md:hidden">
              {/* Mobile: 3 posts em coluna única com scroll */}
              <div className="max-h-[600px] overflow-y-auto space-y-4">
                {blogPosts.slice(0, 3).map((post) => (
                  <Link 
                    key={post.id} 
                    href={`/blog/${post.slug}`}
                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 block"
                  >
                    {post.coverImage && (
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {post.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 text-sm line-clamp-2">{post.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-3 mb-2">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString('pt-MZ', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span className="font-semibold">{post.views}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Desktop: Grid normal */}
          {blogPosts.length > 0 && (
            <div className="hidden md:grid md:grid-cols-3 gap-6 sm:gap-8">
              {blogPosts.map((post) => (
                <Link 
                  key={post.id} 
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300"
                >
                  {post.coverImage && (
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(post.publishedAt).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <span className="text-blue-600 font-semibold group-hover:underline">
                        Ler mais →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {!blogLoading && blogPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma notícia publicada ainda.</p>
            </div>
          )}

          <div className="text-center mt-8 sm:mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Ver Todas as Notícias</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <PartnersSection />

      {/* Footer com Fundo do Datacenter em Alta Tecnologia - Mobile First */}
      <footer id="contacto" className="relative bg-slate-950 text-white py-10 sm:py-16 px-3 sm:px-4 overflow-hidden border-t border-slate-800">
        {/* Imagem de Fundo Datacenter 100% Visível em Cores Reais */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-65"
          style={{ backgroundImage: "url('/footer-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/75 to-slate-950/80" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4 group cursor-default">
                <Server className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400 group-hover:scale-110 group-hover:text-primary-300 transition-all duration-300" />
                <span className="text-xl sm:text-2xl font-bold tracking-tight group-hover:text-primary-300 transition-colors">WEHOSTHERE</span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                Sua solução completa em hospedagem de sites, e-mail corporativo e servidores em Moçambique.
              </p>
              
              {/* Links das Redes Sociais */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <a
                  href="https://www.facebook.com/profile.php?id=61592497206566&locale=pt_BR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition shadow-md group hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current group-hover:scale-110 transition-transform" />
                  <span>Facebook</span>
                </a>
                <a
                  href="https://www.linkedin.com/company/wehosthere"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition shadow-md group hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current group-hover:scale-110 transition-transform" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-[10px] sm:text-xs">Produtos</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-slate-400 text-[10px] sm:text-sm">
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">Hospedagem de Sites</li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">Email Corporativo</li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">Servidores VPS</li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">Registo de Domínios</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-[10px] sm:text-xs">Suporte & Contacto</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-slate-400 text-[10px] sm:text-sm">
                <li className="transition flex items-center space-x-1.5 font-bold text-slate-200">
                  <a
                    href="https://wa.me/258848335618?text=Olá%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20WEHOSTHERE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 hover:text-emerald-400 transition group"
                  >
                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                    <span>+258 84 833 5618</span>
                  </a>
                </li>
                <li className="transition flex items-center space-x-1.5 font-bold text-slate-200">
                  <a
                    href="https://wa.me/258844384702?text=Olá%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20WEHOSTHERE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 hover:text-emerald-400 transition group"
                  >
                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                    <span>+258 84 438 4702</span>
                  </a>
                </li>
                <li className="hover:text-primary-300 transition">
                  <a href="mailto:info@wehosthere.com" className="flex items-center space-x-1.5 text-primary-300 hover:text-primary-200 font-semibold group">
                    <span>info@wehosthere.com</span>
                  </a>
                </li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">Central de Ajuda</li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">Tutoriais & Documentação</li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">Status do Sistema</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-[10px] sm:text-xs">Newsletter</h4>
              <p className="text-slate-400 text-[10px] sm:text-xs mb-3 sm:mb-4">
                Receba novidades e promoções exclusivas.
              </p>
              <NewsletterForm />
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-[10px] sm:text-xs">Legal & Garantias</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-slate-400 text-[10px] sm:text-sm">
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">
                  <Link href="/terms" className="hover:text-primary-300">Termos de Serviço</Link>
                </li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">
                  <Link href="/privacy" className="hover:text-primary-300">Política de Privacidade</Link>
                </li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 hover:translate-y-[-2px] duration-300">SLA 99.9% Uptime</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/80 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-slate-400 text-[10px] sm:text-xs font-medium">
            <p className="hover:text-slate-300 transition-colors cursor-default">&copy; {new Date().getFullYear()} WEHOSTHERE. Todos os direitos reservados. Moçambique.</p>
          </div>
        </div>
      </footer>

      {/* Virtual Assistant */}
      <VirtualAssistant />

      {/* Newsletter Popup */}
      <NewsletterPopup />
    </div>
  );
}

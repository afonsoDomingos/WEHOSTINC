'use client';

import { useState } from 'react';
import Link from "next/link";
import { Server, Mail, Shield, Zap, Globe, Users, Search, Sparkles, CheckCircle } from "lucide-react";

export default function Home() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Server className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">WEHOSTHERE</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#planos" className="text-gray-700 hover:text-primary-600 transition">
                Planos
              </Link>
              <Link href="#criacao-sites" className="text-primary-600 font-semibold hover:text-primary-700 transition">
                Criação de Sites (25.000 MT)
              </Link>
              <Link href="#recursos" className="text-gray-700 hover:text-primary-600 transition">
                Recursos
              </Link>
              <Link href="#contato" className="text-gray-700 hover:text-primary-600 transition">
                Contato
              </Link>
            </nav>
            <div className="flex space-x-4">
              <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-primary-600 transition">
                Login
              </Link>
              <Link href="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Domínio, Hospedagem e <span className="text-primary-600">Email</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Tudo o que a sua empresa precisa para ter uma presença online de alta performance em Moçambique.
          </p>

          {/* Domain Search Component */}
          <div className="max-w-2xl mx-auto mb-10 bg-white p-3 rounded-2xl shadow-xl border border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const domain = (form.elements.namedItem('domain') as HTMLInputElement).value;
                if (domain) {
                  window.location.href = `/checkout?plan=pro&domain=${encodeURIComponent(domain)}`;
                }
              }}
              className="flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  name="domain"
                  type="text"
                  placeholder="Pesquisar seu domínio (ex: suaempresa.co.mz)"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-900 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow transition text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Pesquisar Domínio</span>
              </button>
            </form>
            <div className="flex justify-center items-center space-x-4 mt-3 text-xs text-gray-500 font-medium">
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">.co.mz (Moçambique)</span>
              <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">.com</span>
              <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">.org.mz</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Link href="#planos" className="px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition text-base shadow-md">
              Ver Planos de Hospedagem
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Por que escolher a WEHOSTHERE?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <Zap className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ultra Rápido</h3>
              <p className="text-gray-600">Servidores otimizados para máxima performance</p>
            </div>
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
              <p className="text-gray-600">Backup diário e proteção avançada</p>
            </div>
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Suporte 24/7</h3>
              <p className="text-gray-600">Equipe especializada sempre disponível</p>
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
                    {isAnnual ? '12.000 MT' : '1.200 MT'}
                  </span>
                  <span className="text-gray-600 text-sm font-medium">
                    {isAnnual ? ' /ano' : ' /mês'}
                  </span>
                  {isAnnual && (
                    <div className="text-xs font-semibold text-emerald-600 mt-1">
                      Equivale a 1.000 MT/mês (Economize 2.400 MT)
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
                    {isAnnual ? '30.000 MT' : '3.000 MT'}
                  </span>
                  <span className="text-blue-100 text-sm font-medium">
                    {isAnnual ? ' /ano' : ' /mês'}
                  </span>
                  {isAnnual && (
                    <div className="text-xs font-semibold text-amber-300 mt-1">
                      Equivale a 2.500 MT/mês (Economize 6.000 MT)
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
                      Equivale a 5.166 MT/mês (Economize 12.400 MT)
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

          {/* Website Creation Service Banner (25.000 MT) */}
          <div id="criacao-sites" className="mt-16 bg-gradient-to-r from-gray-900 via-primary-950 to-gray-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl border border-primary-800/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 bg-primary-600/10 w-96 h-96 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-center relative z-10">
              <div className="lg:col-span-2">
                <div className="inline-flex items-center space-x-2 bg-primary-500/20 text-primary-300 border border-primary-500/30 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span>Serviço Premium de Desenvolvimento</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                  Criação de Sites Profissionais
                </h3>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  Desenvolvemos a presença online completa da sua empresa em Moçambique com design exclusivo, moderno, rápido e otimizado para o Google.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200 mb-8">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Design Responsivo (Mobile & Desktop)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Domínio .co.mz + 1 Ano Hospedagem Grátis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Integração com WhatsApp & Redes Sociais</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>E-mails Corporativos Ilimitados</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-semibold text-primary-300 tracking-wider block mb-1">Taxa Única de Projeto</span>
                  <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                    25.000 MT
                  </div>
                  <p className="text-xs text-gray-300 mb-6">Pagamento parcelado ou via M-Pesa / eMola / Cartão</p>
                </div>

                <Link
                  href="/checkout?plan=website_creation"
                  className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold text-base rounded-xl shadow-lg transition duration-200 block text-center"
                >
                  Solicitar Criação de Site
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Server className="h-8 w-8 text-primary-400" />
                <span className="text-2xl font-bold">WEHOSTHERE</span>
              </div>
              <p className="text-gray-400">
                Sua solução completa em hospedagem de sites e email.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produtos</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Hospedagem de Sites</li>
                <li>Email Corporativo</li>
                <li>VPS</li>
                <li>Dominios</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Central de Ajuda</li>
                <li>Tutoriais</li>
                <li>Status do Sistema</li>
                <li>Contato</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Termos de Serviço</li>
                <li>Política de Privacidade</li>
                <li>SLA</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 WEHOSTHERE. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

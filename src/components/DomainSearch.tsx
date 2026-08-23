'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, XCircle, Globe, ArrowRight, Sparkles, Loader2, Rocket, Flame, WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { DOMAIN_PRICES, checkDomainRealAsync, DomainCheckResult } from '@/lib/domains';
import { hostingPlans } from '@/lib/data';
import { soundEffects } from '@/lib/soundEffects';

// Timeout de conexão lenta em ms
const SLOW_CONNECTION_TIMEOUT = 8000;

export default function DomainSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.co.mz');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<DomainCheckResult | null>(null);
  const [selectedHostingPlan, setSelectedHostingPlan] = useState<'basic' | 'pro' | 'enterprise'>('basic');
  const [hostingCycle, setHostingCycle] = useState<'annual' | 'monthly'>('monthly');

  // Estados de conexão
  const [isOffline, setIsOffline] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const slowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detectar mudanças de estado de rede em tempo real
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setIsSlowConnection(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setIsSlowConnection(false);
      setNetworkError(null);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    // Verificar estado inicial
    if (!navigator.onLine) setIsOffline(true);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const currentHostingPlan = hostingPlans.find(p => p.id === selectedHostingPlan) || hostingPlans[0];
  const hostingPrice = hostingCycle === 'annual' ? currentHostingPlan.priceAnnual : currentHostingPlan.price;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Verificar conexão antes de pesquisar
    if (!navigator.onLine) {
      setIsOffline(true);
      setNetworkError('Sem ligação à internet. Verifique a sua conexão e tente novamente.');
      return;
    }

    setIsOffline(false);
    setIsSlowConnection(false);
    setNetworkError(null);
    setIsSearching(true);
    setResult(null);

    let fullQuery = query.trim();
    if (!fullQuery.includes('.')) {
      fullQuery = fullQuery + selectedTld;
    }

    // Iniciar temporizador de conexão lenta
    slowTimeoutRef.current = setTimeout(() => {
      setIsSlowConnection(true);
    }, SLOW_CONNECTION_TIMEOUT);

    try {
      console.log(`[DomainSearch] Iniciando pesquisa: ${fullQuery}`);
      const searchResult = await checkDomainRealAsync(fullQuery);
      console.log(`[DomainSearch] Resultado:`, searchResult);
      setResult(searchResult);
      setIsSlowConnection(false);
      setNetworkError(null);
    } catch (err: any) {
      console.error('Erro na busca de domínio:', err);
      // Distinguir erro de rede de outros erros
      if (!navigator.onLine) {
        setIsOffline(true);
        setNetworkError('Ligação perdida durante a pesquisa. Verifique o Wi-Fi ou dados móveis.');
      } else if (err?.name === 'AbortError' || err?.message?.includes('timeout')) {
        setNetworkError('A pesquisa demorou demasiado. A sua conexão pode estar lenta.');
      } else {
        setNetworkError('Erro ao verificar o domínio. Tente novamente.');
      }
    } finally {
      if (slowTimeoutRef.current) clearTimeout(slowTimeoutRef.current);
      setIsSlowConnection(false);
      setIsSearching(false);
    }
  };

  const handleRegisterOnly = (domain: string, price: number) => {
    soundEffects.playDomainRegisteredSound();
    router.push(`/checkout?plan=none&domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  const handleRegisterWithHosting = (domain: string, price: number, planId: string = selectedHostingPlan, cycle: string = hostingCycle) => {
    soundEffects.playDomainRegisteredSound();
    router.push(`/checkout?plan=${planId}&billingCycle=${cycle}&domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  const handleRegisterWithWebsite = (domain: string, price: number) => {
    soundEffects.playDomainRegisteredSound();
    router.push(`/site-quote?domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-12">

      {/* Banner de Estado de Rede */}
      {isOffline && (
        <div className="flex items-center space-x-2 sm:space-x-3 bg-red-900/80 backdrop-blur border border-red-500/60 text-red-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg animate-pulse">
          <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 shrink-0" />
          <div className="text-left">
            <p className="text-xs sm:text-sm font-bold">Sem ligação à Internet</p>
            <p className="text-[10px] sm:text-xs text-red-300">{networkError || 'Verifique o Wi-Fi ou dados móveis e tente novamente.'}</p>
          </div>
        </div>
      )}

      {isSlowConnection && !isOffline && (
        <div className="flex items-center space-x-2 sm:space-x-3 bg-amber-900/80 backdrop-blur border border-amber-500/60 text-amber-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 shrink-0" />
          <div className="text-left">
            <p className="text-xs sm:text-sm font-bold">Conexão lenta detectada</p>
            <p className="text-[10px] sm:text-xs text-amber-300">A pesquisa está a demorar mais do esperado. Por favor aguarde...</p>
          </div>
        </div>
      )}

      {networkError && !isOffline && !isSlowConnection && (
        <div className="flex items-center space-x-2 sm:space-x-3 bg-orange-900/80 backdrop-blur border border-orange-500/60 text-orange-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 shrink-0" />
          <div className="text-left">
            <p className="text-xs sm:text-sm font-bold">Erro na pesquisa</p>
            <p className="text-[10px] sm:text-xs text-orange-300">{networkError}</p>
          </div>
        </div>
      )}

      {/* Box de Pesquisa Principal */}
      <div className="bg-white p-2.5 sm:p-3 md:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/80 w-full overflow-hidden">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full">
          
          {/* Input do nome de domínio */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome do seu domínio (ex: suaempresa)"
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-900 text-xs sm:text-sm md:text-base placeholder-gray-400"
              required
            />
          </div>

          {/* Seletor de Extensão TLD + Botão Pesquisar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedTld}
              onChange={(e) => setSelectedTld(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3.5 bg-gray-100 border border-gray-200 rounded-xl sm:rounded-2xl font-bold text-gray-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-center sm:text-left"
            >
              {DOMAIN_PRICES.map((tld) => (
                <option key={tld.extension} value={tld.extension}>
                  {tld.extension} ({tld.price.toLocaleString('pt-MZ')} MT/ano)
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto px-5 sm:px-7 py-2.5 sm:py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition text-xs sm:text-sm md:text-base flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Pesquisar</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tabela/Badges de Preços de Domínio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-gray-100">
          {DOMAIN_PRICES.map((tld) => (
            <button
              key={tld.extension}
              type="button"
              onClick={() => {
                setSelectedTld(tld.extension);
                if (query.trim()) {
                  let cleaned = query.trim();
                  if (cleaned.includes('.')) {
                    cleaned = cleaned.split('.')[0];
                  }
                  setQuery(cleaned + tld.extension);
                }
              }}
              className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                selectedTld === tld.extension
                  ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-500/20'
                  : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="text-[10px] sm:text-xs font-bold text-gray-900">{tld.extension}</span>
              <span className="text-[10px] sm:text-xs font-extrabold text-primary-600 mt-0.5">
                {tld.price.toLocaleString('pt-MZ')} MT<span className="text-[9px] sm:text-[10px] font-normal text-gray-500">/ano</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Card de Resultado da Pesquisa */}
      {result && (
        <div className="mt-4 sm:mt-6 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Cabeçalho do Domínio Consultado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50/40 border border-gray-200">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {result.isAvailable ? (
                <div className="p-2 sm:p-2.5 bg-emerald-500 text-white rounded-lg sm:rounded-xl flex-shrink-0 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              ) : (
                <div className="p-2 sm:p-2.5 bg-red-500 text-white rounded-lg sm:rounded-xl flex-shrink-0 shadow-sm">
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              )}

              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1 sm:gap-1.5">
                  <span className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{result.fullDomain}</span>
                  {result.isAvailable ? (
                    <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm">
                      Disponível!
                    </span>
                  ) : (
                    <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm">
                      Indisponível
                    </span>
                  )}
                  {result.searchCount && result.searchCount > 1 && (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] sm:text-xs font-extrabold px-2 sm:px-3 py-0.5 rounded-full shadow-sm flex items-center space-x-0.5 sm:space-x-1 animate-pulse">
                      <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-white" />
                      <span>Alta Procura ({result.searchCount}x buscas)</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 font-medium">
                  {result.isAvailable 
                    ? 'Este domínio está totalmente livre para registo imediato.' 
                    : 'Este domínio já se encontra registrado. Veja as extensões alternativas abaixo.'}
                </p>
              </div>
            </div>

            {result.isAvailable && (
              <div className="bg-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm flex flex-row sm:flex-col items-center sm:items-end justify-between shrink-0">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">Registo do Domínio</span>
                <span className="text-base sm:text-lg font-black text-primary-600">
                  {result.price.toLocaleString('pt-MZ')} MT <span className="text-[10px] sm:text-xs text-gray-500 font-normal">/ano</span>
                </span>
              </div>
            )}
          </div>

          {/* Banner Alerta de Alta Procura (Urgency Marketing) */}
          {result.isAvailable && result.searchCount && result.searchCount > 1 && (
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3.5 bg-amber-500/10 border-2 border-amber-400/80 rounded-xl sm:rounded-2xl flex items-center space-x-2 sm:space-x-3 text-amber-950 shadow-sm">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg sm:rounded-xl font-bold shrink-0 shadow">
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-100" />
              </div>
              <div className="text-[10px] sm:text-xs leading-relaxed">
                <span className="font-extrabold text-amber-950 block text-xs sm:text-sm">🔥 Alta Procura Detectada!</span>
                <span>
                  Este domínio já foi pesquisado <strong className="font-black text-amber-950 underline">{result.searchCount} vezes</strong> no nosso site. Garanta o seu registo agora antes que outra pessoa o reserve!
                </span>
              </div>
            </div>
          )}

          {/* Opções de Contratação com Preços Transparentes */}
          {result.isAvailable && (
            <div className="mt-4 sm:mt-5">
              <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                Escolha a sua opção de contratação:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5">
                {/* Opção 1: Apenas Domínio */}
                <div className="flex flex-col justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-primary-400 bg-white transition shadow-sm group">
                  <div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-700 mb-1.5 sm:mb-2">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 group-hover:text-primary-600 transition" />
                      <span className="font-bold text-xs sm:text-sm text-gray-900">Apenas Domínio</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4 leading-relaxed">
                      Registo do nome <strong className="text-gray-800">{result.fullDomain}</strong> sem hospedagem associada.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between pt-2 sm:pt-3 border-t border-gray-100 mb-2 sm:mb-3">
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Total:</span>
                      <span className="text-base sm:text-lg font-extrabold text-gray-900">
                        {result.price.toLocaleString('pt-MZ')} MT <span className="text-[10px] sm:text-xs font-normal text-gray-500">/ano</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegisterOnly(result.fullDomain, result.price)}
                      className="w-full py-2 sm:py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md transition flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer hover:scale-[1.01]"
                    >
                      <span>Garanta Agora ({result.price.toLocaleString('pt-MZ')} MT)</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                {/* Opção 2: Domínio + Hospedagem */}
                <div className="flex flex-col justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 transition shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-3 py-0.5 rounded-bl-lg sm:rounded-bl-xl tracking-wider">
                    Recomendado
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-emerald-800 mb-1.5 sm:mb-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                      <span className="font-bold text-xs sm:text-sm text-emerald-950">Domínio + Hospedagem</span>
                    </div>

                    {/* Seletor de Plano de Hospedagem */}
                    <div className="mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
                      <div>
                        <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-900 mb-0.5 sm:mb-1">
                          Plano de Hospedagem:
                        </label>
                        <select
                          value={selectedHostingPlan}
                          onChange={(e) => setSelectedHostingPlan(e.target.value as 'basic' | 'pro' | 'enterprise')}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-emerald-300 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                        >
                          <option value="basic">Básico ({hostingCycle === 'annual' ? '5.500 MT/ano' : '550 MT/mês'})</option>
                          <option value="pro">Profissional ({hostingCycle === 'annual' ? '25.000 MT/ano' : '2.500 MT/mês'})</option>
                          <option value="enterprise">Empresarial ({hostingCycle === 'annual' ? '62.000 MT/ano' : '6.200 MT/mês'})</option>
                        </select>
                      </div>

                      {/* Alternador Mensal / Anual */}
                      <div className="flex bg-emerald-100/70 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-emerald-200 text-[10px] sm:text-xs">
                        <button
                          type="button"
                          onClick={() => setHostingCycle('annual')}
                          className={`flex-1 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-md sm:rounded-lg font-bold transition text-[10px] sm:text-[11px] cursor-pointer ${
                            hostingCycle === 'annual'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-emerald-900 hover:bg-emerald-200/60'
                          }`}
                        >
                          Anual (2 Meses Grátis)
                        </button>
                        <button
                          type="button"
                          onClick={() => setHostingCycle('monthly')}
                          className={`flex-1 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-md sm:rounded-lg font-bold transition text-[10px] sm:text-[11px] cursor-pointer ${
                            hostingCycle === 'monthly'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-emerald-900 hover:bg-emerald-200/60'
                          }`}
                        >
                          Mensal
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3 leading-relaxed">
                      Inclui o domínio e <strong>Hospedagem {currentHostingPlan.name}</strong> ({hostingCycle === 'annual' ? 'Anual' : 'Mensal'}).
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between pt-2 sm:pt-3 border-t border-emerald-200/60 mb-2 sm:mb-3">
                      <span className="text-[10px] sm:text-xs text-emerald-800 font-medium">1º Pagamento:</span>
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-black text-emerald-700">
                          {(result.price + hostingPrice).toLocaleString('pt-MZ')} MT <span className="text-[10px] sm:text-xs font-normal text-gray-600">{hostingCycle === 'annual' ? '/ano' : '/total inicial'}</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-gray-500 block font-normal">
                          {hostingCycle === 'annual'
                            ? `(${result.price.toLocaleString('pt-MZ')} MT Domínio/ano + ${hostingPrice.toLocaleString('pt-MZ')} MT Hospedagem Anual)`
                            : `(${result.price.toLocaleString('pt-MZ')} MT Domínio/ano + ${hostingPrice.toLocaleString('pt-MZ')} MT 1º Mês Hospedagem)`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegisterWithHosting(result.fullDomain, result.price, selectedHostingPlan, hostingCycle)}
                      className="w-full py-2.5 sm:py-3.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] sm:text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer hover:scale-[1.02]"
                    >
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span>Garanta Agora ({(result.price + hostingPrice).toLocaleString('pt-MZ')} MT)</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Opção 3: Domínio + Criação de Site (Investimento Único) */}
                <div className="flex flex-col justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-primary-500 bg-primary-50/30 transition shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-primary-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-3 py-0.5 rounded-bl-lg sm:rounded-bl-xl tracking-wider">
                    Investimento Único
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-primary-900 mb-1.5 sm:mb-2">
                      <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                      <span className="font-bold text-xs sm:text-sm text-primary-950">Domínio + Criação de Site</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                      Desenvolvimento de <strong>Website Profissional Chave na Mão</strong> + Domínio e Configuração.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between pt-2 sm:pt-3 border-t border-primary-200/60 mb-2 sm:mb-3">
                      <span className="text-[10px] sm:text-xs text-primary-800 font-medium">Total:</span>
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-black text-primary-700">
                          {(result.price + 25000).toLocaleString('pt-MZ')} MT
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-gray-500 block font-normal">({result.price.toLocaleString('pt-MZ')} MT Domínio + 25.000 MT Projeto Site)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegisterWithWebsite(result.fullDomain, result.price)}
                      className="w-full py-2 sm:py-3 px-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-extrabold text-[10px] sm:text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md transition flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer hover:scale-[1.01]"
                    >
                      <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300 shrink-0" />
                      <span>Garanta Agora &amp; Escolher Site</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sugestões Inteligentes de Nomes Alternativos (Gerador IA) */}
          {result.smartSuggestions && result.smartSuggestions.length > 0 && (
            <div className="mt-5 sm:mt-7 pt-4 sm:pt-5 border-t border-purple-100 bg-gradient-to-br from-purple-50/60 via-indigo-50/40 to-blue-50/30 p-3.5 sm:p-5 rounded-2xl border border-purple-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-purple-950">
                    Sugestões Inteligentes de Nomes Alternativos
                  </h4>
                </div>
                <span className="text-[10px] bg-purple-200 text-purple-900 font-extrabold px-2.5 py-0.5 rounded-full">
                  100% Disponíveis
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-purple-800 mb-3">
                Variações de nomes comerciais com excelente memorização para <strong>{result.sld}</strong>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                {result.smartSuggestions.map((sug) => (
                  <div
                    key={sug.fullDomain}
                    className="p-3 bg-white rounded-xl border border-purple-200/90 shadow-sm hover:shadow-md hover:border-purple-400 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          {sug.badge}
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          {sug.price.toLocaleString('pt-MZ')} MT
                        </span>
                      </div>
                      <span className="font-extrabold text-gray-900 text-xs sm:text-sm block group-hover:text-purple-700 transition-colors">
                        {sug.fullDomain}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{sug.reason}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRegisterOnly(sug.fullDomain, sug.price)}
                        className="flex-1 py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] sm:text-xs rounded-lg transition shadow-xs flex items-center justify-center space-x-1 cursor-pointer active:scale-95"
                      >
                        <span>Registrar Este</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRegisterWithWebsite(sug.fullDomain, sug.price)}
                        className="py-1.5 px-2 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[10px] rounded-lg transition cursor-pointer"
                        title="Registrar com Criação de Site"
                      >
                        + Site
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternativas de Extensões */}
          {result.alternatives.length > 0 && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-100">
              <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">
                Outras extensões para {result.sld}:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {result.alternatives.map((alt) => (
                  <div 
                    key={alt.extension} 
                    className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border border-gray-200 bg-white hover:border-primary-300 transition flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-gray-900 text-xs sm:text-sm block">{alt.fullDomain}</span>
                      <span className="text-[10px] sm:text-xs text-primary-600 font-extrabold">{alt.price.toLocaleString('pt-MZ')} MT/ano</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRegisterOnly(alt.fullDomain, alt.price)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer"
                    >
                      Registrar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

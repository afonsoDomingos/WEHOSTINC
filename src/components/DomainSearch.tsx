'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, XCircle, Globe, ArrowRight, Sparkles, Loader2, Rocket } from 'lucide-react';
import { DOMAIN_PRICES, checkDomainRealAsync, DomainCheckResult } from '@/lib/domains';
import { hostingPlans } from '@/lib/data';

export default function DomainSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.co.mz');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<DomainCheckResult | null>(null);
  const [selectedHostingPlan, setSelectedHostingPlan] = useState<'basic' | 'pro' | 'enterprise'>('basic');
  const [hostingCycle, setHostingCycle] = useState<'annual' | 'monthly'>('monthly');

  const currentHostingPlan = hostingPlans.find(p => p.id === selectedHostingPlan) || hostingPlans[0];
  const hostingPrice = hostingCycle === 'annual' ? currentHostingPlan.priceAnnual : currentHostingPlan.price;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResult(null);

    let fullQuery = query.trim();
    if (!fullQuery.includes('.')) {
      fullQuery = fullQuery + selectedTld;
    }

    try {
      const searchResult = await checkDomainRealAsync(fullQuery);
      setResult(searchResult);
    } catch (err) {
      console.error('Erro na busca de domínio:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegisterOnly = (domain: string, price: number) => {
    router.push(`/checkout?plan=none&domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  const handleRegisterWithHosting = (domain: string, price: number, planId: string = selectedHostingPlan, cycle: string = hostingCycle) => {
    router.push(`/checkout?plan=${planId}&billingCycle=${cycle}&domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  const handleRegisterWithWebsite = (domain: string, price: number) => {
    router.push(`/site-quote?domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Box de Pesquisa Principal */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl shadow-2xl border border-gray-200/80 w-full overflow-hidden">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
          
          {/* Input do nome de domínio */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome do seu domínio (ex: suaempresa)"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-900 text-sm md:text-base placeholder-gray-400"
              required
            />
          </div>

          {/* Seletor de Extensão TLD + Botão Pesquisar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedTld}
              onChange={(e) => setSelectedTld(e.target.value)}
              className="w-full sm:w-auto px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-center sm:text-left"
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
              className="w-full sm:w-auto px-7 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition text-sm md:text-base flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Pesquisar</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tabela/Badges de Preços de Domínio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-gray-100">
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
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                selectedTld === tld.extension
                  ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-500/20'
                  : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="text-xs font-bold text-gray-900">{tld.extension}</span>
              <span className="text-xs font-extrabold text-primary-600 mt-0.5">
                {tld.price.toLocaleString('pt-MZ')} MT<span className="text-[10px] font-normal text-gray-500">/ano</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Card de Resultado da Pesquisa */}
      {result && (
        <div className="mt-6 bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Cabeçalho do Domínio Consultado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50/40 border border-gray-200">
            <div className="flex items-center space-x-3">
              {result.isAvailable ? (
                <div className="p-2.5 bg-emerald-500 text-white rounded-xl flex-shrink-0 shadow-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              ) : (
                <div className="p-2.5 bg-red-500 text-white rounded-xl flex-shrink-0 shadow-sm">
                  <XCircle className="h-6 w-6" />
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <span className="text-xl sm:text-2xl font-black text-gray-900">{result.fullDomain}</span>
                  {result.isAvailable ? (
                    <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      Disponível!
                    </span>
                  ) : (
                    <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      Indisponível
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  {result.isAvailable 
                    ? 'Este domínio está totalmente livre para registo imediato.' 
                    : 'Este domínio já se encontra registrado. Veja as extensões alternativas abaixo.'}
                </p>
              </div>
            </div>

            {result.isAvailable && (
              <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm flex flex-row sm:flex-col items-center sm:items-end justify-between shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Registo do Domínio</span>
                <span className="text-lg font-black text-primary-600">
                  {result.price.toLocaleString('pt-MZ')} MT <span className="text-xs text-gray-500 font-normal">/ano</span>
                </span>
              </div>
            )}
          </div>

          {/* Opções de Contratação com Preços Transparentes */}
          {result.isAvailable && (
            <div className="mt-5">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Escolha a sua opção de contratação:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Opção 1: Apenas Domínio */}
                <div className="flex flex-col justify-between p-4 rounded-2xl border-2 border-gray-200 hover:border-primary-400 bg-white transition shadow-sm group">
                  <div>
                    <div className="flex items-center space-x-2 text-gray-700 mb-2">
                      <Globe className="h-5 w-5 text-gray-600 group-hover:text-primary-600 transition" />
                      <span className="font-bold text-sm text-gray-900">Apenas Domínio</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      Registo do nome <strong className="text-gray-800">{result.fullDomain}</strong> sem hospedagem associada.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between pt-3 border-t border-gray-100 mb-3">
                      <span className="text-xs text-gray-400 font-medium">Total:</span>
                      <span className="text-lg font-extrabold text-gray-900">
                        {result.price.toLocaleString('pt-MZ')} MT <span className="text-xs font-normal text-gray-500">/ano</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegisterOnly(result.fullDomain, result.price)}
                      className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Apenas Domínio ({result.price.toLocaleString('pt-MZ')} MT)</span>
                    </button>
                  </div>
                </div>

                {/* Opção 2: Domínio + Hospedagem */}
                <div className="flex flex-col justify-between p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 transition shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-xl tracking-wider">
                    Recomendado
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-emerald-800 mb-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <span className="font-bold text-sm text-emerald-950">Domínio + Hospedagem</span>
                    </div>

                    {/* Seletor de Plano de Hospedagem */}
                    <div className="mb-3 space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-900 mb-1">
                          Plano de Hospedagem:
                        </label>
                        <select
                          value={selectedHostingPlan}
                          onChange={(e) => setSelectedHostingPlan(e.target.value as 'basic' | 'pro' | 'enterprise')}
                          className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                        >
                          <option value="basic">Básico ({hostingCycle === 'annual' ? '5.500 MT/ano' : '550 MT/mês'})</option>
                          <option value="pro">Profissional ({hostingCycle === 'annual' ? '25.000 MT/ano' : '2.500 MT/mês'})</option>
                          <option value="enterprise">Empresarial ({hostingCycle === 'annual' ? '62.000 MT/ano' : '6.200 MT/mês'})</option>
                        </select>
                      </div>

                      {/* Alternador Mensal / Anual */}
                      <div className="flex bg-emerald-100/70 p-1 rounded-xl border border-emerald-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setHostingCycle('annual')}
                          className={`flex-1 py-1 px-2 rounded-lg font-bold transition text-[11px] cursor-pointer ${
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
                          className={`flex-1 py-1 px-2 rounded-lg font-bold transition text-[11px] cursor-pointer ${
                            hostingCycle === 'monthly'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-emerald-900 hover:bg-emerald-200/60'
                          }`}
                        >
                          Mensal
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      Inclui o domínio e <strong>Hospedagem {currentHostingPlan.name}</strong> ({hostingCycle === 'annual' ? 'Anual' : 'Mensal'}).
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between pt-3 border-t border-emerald-200/60 mb-3">
                      <span className="text-xs text-emerald-800 font-medium">1º Pagamento:</span>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-700">
                          {(result.price + hostingPrice).toLocaleString('pt-MZ')} MT <span className="text-xs font-normal text-gray-600">{hostingCycle === 'annual' ? '/ano' : '/total inicial'}</span>
                        </span>
                        <span className="text-[10px] text-gray-500 block font-normal">
                          {hostingCycle === 'annual'
                            ? `(${result.price.toLocaleString('pt-MZ')} MT Domínio/ano + ${hostingPrice.toLocaleString('pt-MZ')} MT Hospedagem Anual)`
                            : `(${result.price.toLocaleString('pt-MZ')} MT Domínio/ano + ${hostingPrice.toLocaleString('pt-MZ')} MT 1º Mês Hospedagem)`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegisterWithHosting(result.fullDomain, result.price, selectedHostingPlan, hostingCycle)}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>
                        Domínio + Hospedagem {hostingCycle === 'annual' ? 'Anual' : 'Mensal'} ({(result.price + hostingPrice).toLocaleString('pt-MZ')} MT)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Opção 3: Domínio + Criação de Site (Investimento Único) */}
                <div className="flex flex-col justify-between p-4 rounded-2xl border-2 border-primary-500 bg-primary-50/30 transition shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-xl tracking-wider">
                    Investimento Único
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-primary-900 mb-2">
                      <Rocket className="h-5 w-5 text-amber-500" />
                      <span className="font-bold text-sm text-primary-950">Domínio + Criação de Site</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                      Desenvolvimento de <strong>Website Profissional Chave na Mão</strong> + Domínio e Configuração.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between pt-3 border-t border-primary-200/60 mb-3">
                      <span className="text-xs text-primary-800 font-medium">Total:</span>
                      <div className="text-right">
                        <span className="text-lg font-black text-primary-700">
                          {(result.price + 25000).toLocaleString('pt-MZ')} MT
                        </span>
                        <span className="text-[10px] text-gray-500 block font-normal">({result.price.toLocaleString('pt-MZ')} MT Domínio + 25.000 MT Projeto Site)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegisterWithWebsite(result.fullDomain, result.price)}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Rocket className="h-4 w-4 text-amber-300" />
                      <span>Domínio + Criação de Site ({(result.price + 25000).toLocaleString('pt-MZ')} MT)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alternativas sugeridas */}
          {result.alternatives.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Outras extensões disponíveis para {result.sld}:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {result.alternatives.map((alt) => (
                  <div 
                    key={alt.extension} 
                    className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-primary-300 transition flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">{alt.fullDomain}</span>
                      <span className="text-xs text-primary-600 font-extrabold">{alt.price.toLocaleString('pt-MZ')} MT/ano</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRegisterOnly(alt.fullDomain, alt.price)}
                      className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, XCircle, Globe, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { DOMAIN_PRICES, checkDomainAvailability, DomainCheckResult } from '@/lib/domains';

export default function DomainSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.co.mz');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<DomainCheckResult | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResult(null);

    // Simulação com pequeno atraso para UX realista
    setTimeout(() => {
      let fullQuery = query.trim();
      if (!fullQuery.includes('.')) {
        fullQuery = fullQuery + selectedTld;
      }
      const searchResult = checkDomainAvailability(fullQuery);
      setResult(searchResult);
      setIsSearching(false);
    }, 400);
  };

  const handleRegister = (domain: string, price: number) => {
    router.push(`/checkout?plan=pro&domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Box de Pesquisa Principal */}
      <div className="bg-white p-3 md:p-4 rounded-3xl shadow-2xl border border-gray-200/80">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-2">
          
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

          {/* Seletor de Extensão TLD */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <select
              value={selectedTld}
              onChange={(e) => setSelectedTld(e.target.value)}
              className="w-full md:w-auto px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
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
              className="w-full md:w-auto px-7 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition text-sm md:text-base flex items-center justify-center space-x-2 cursor-pointer flex-shrink-0"
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
        <div className="mt-6 bg-white rounded-3xl p-6 shadow-xl border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Domínio Principal Consultado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50/30 border border-gray-200">
            <div className="flex items-center space-x-3">
              {result.isAvailable ? (
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl flex-shrink-0">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              ) : (
                <div className="p-2.5 bg-red-100 text-red-600 rounded-xl flex-shrink-0">
                  <XCircle className="h-7 w-7" />
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg md:text-xl font-black text-gray-900">{result.fullDomain}</span>
                  {result.isAvailable ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Disponível!
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-300">
                      Indisponível
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {result.isAvailable 
                    ? 'Este domínio está pronto para registro imediato.' 
                    : 'Este domínio já se encontra registrado. Experimente uma das alternativas abaixo.'}
                </p>
              </div>
            </div>

            {result.isAvailable && (
              <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-gray-500 block">Preço de Registro</span>
                  <span className="text-xl font-black text-primary-600">
                    {result.price.toLocaleString('pt-MZ')} MT<span className="text-xs text-gray-500 font-normal">/ano</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRegister(result.fullDomain, result.price)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer"
                >
                  <span>Registrar</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Alternativas sugeridas */}
          {result.alternatives.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Outras extensões disponíveis para {result.sld}:
              </h4>
              <div className="grid sm:grid-cols-3 gap-3">
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
                      onClick={() => handleRegister(alt.fullDomain, alt.price)}
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

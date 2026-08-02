'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Server, ArrowLeft, ArrowRight, CheckCircle2, Clock, Search, SlidersHorizontal, X } from 'lucide-react';
import { websiteTypes, WebsiteType } from '@/lib/data';
import Navbar from '@/components/Navbar';
import PageLoader from '@/components/PageLoader';
import { auth, User } from '@/lib/auth';

const complexityLabels: Record<string, { label: string; color: string; active: string }> = {
  simple: { label: 'Simples', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', active: 'bg-emerald-600 text-white border-emerald-600' },
  medium: { label: 'Intermédio', color: 'text-amber-700 bg-amber-50 border-amber-200', active: 'bg-amber-500 text-white border-amber-500' },
  complex: { label: 'Complexo', color: 'text-orange-700 bg-orange-50 border-orange-200', active: 'bg-orange-500 text-white border-orange-500' },
  enterprise: { label: 'Empresarial', color: 'text-red-700 bg-red-50 border-red-200', active: 'bg-red-600 text-white border-red-600' }
};

const priceRanges = [
  { id: 'all', label: 'Todos os preços', icon: '💰', fn: null },
  { id: 'low', label: 'Até 20.000 MT', icon: '🟢', fn: (p: number) => p < 20000 },
  { id: 'mid', label: '20.000 – 60.000 MT', icon: '🟡', fn: (p: number) => p >= 20000 && p < 60000 },
  { id: 'high', label: '+60.000 MT', icon: '🟠', fn: (p: number) => p >= 60000 && p < 100000 },
  { id: 'orcamento', label: 'Sob orçamento', icon: '🔵', fn: (p: number) => p >= 100000 }
];

function SiteQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainParam = searchParams.get('domain');
  const domainPriceParam = searchParams.get('domainPrice');

  const [selected, setSelected] = useState<WebsiteType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [complexityFilter, setComplexityFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Redirect to dashboard if logged in
      if (currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com') {
        router.push('/admin');
      } else {
        router.push('/dashboard/orders');
      }
    }
  }, [router]);

  const activeFilterCount = (complexityFilter !== 'all' ? 1 : 0) + (priceFilter !== 'all' ? 1 : 0);

  const filtered = websiteTypes.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' ||
      t.name.toLowerCase().includes(q) ||
      t.shortDesc.toLowerCase().includes(q) ||
      t.examples.some(ex => ex.toLowerCase().includes(q));
    const matchesComplexity = complexityFilter === 'all' || t.complexity === complexityFilter;
    const range = priceRanges.find(r => r.id === priceFilter);
    const matchesPrice = priceFilter === 'all' || (range?.fn ? range.fn(t.basePrice) : true);
    return matchesSearch && matchesComplexity && matchesPrice;
  });

  const clearFilters = () => {
    setComplexityFilter('all');
    setPriceFilter('all');
    setSearchQuery('');
  };

  const handleProceed = (type: WebsiteType) => {
    const domainPart = domainParam
      ? `&domain=${encodeURIComponent(domainParam)}&domainPrice=${domainPriceParam || 0}`
      : '';
    router.push(
      `/checkout?plan=website_creation&siteType=${type.id}&siteTypeName=${encodeURIComponent(type.name)}&siteTypePrice=${type.basePrice}${domainPart}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-10 pb-44">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 border border-primary-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Server className="h-3.5 w-3.5" />
              <span>Criação de Sites Profissionais</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              Que tipo de site precisa?
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
              Selecione o tipo de projeto. Veja os preços e o prazo de entrega estimado antes de solicitar o orçamento.
            </p>
            {domainParam && (
              <div className="mt-3 inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Domínio <strong>{domainParam}</strong> será incluído</span>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Pesquisa + Botão Filtros */}
        <div className="flex gap-2 max-w-2xl mx-auto mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar tipo de site, funcionalidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl border-2 font-semibold text-sm transition cursor-pointer shadow-sm ${
              showFilters || activeFilterCount > 0
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <div className="max-w-2xl mx-auto mb-6 bg-white rounded-2xl border border-gray-200 shadow-md p-4 space-y-4">
            {/* Complexidade */}
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Complexidade</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setComplexityFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                    complexityFilter === 'all'
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  Todos
                </button>
                {Object.entries(complexityLabels).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setComplexityFilter(complexityFilter === key ? 'all' : key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                      complexityFilter === key ? val.active : val.color
                    }`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Faixa de Preço */}
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Faixa de Preço</span>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setPriceFilter(priceFilter === range.id ? 'all' : range.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                      priceFilter === range.id
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'
                    }`}
                  >
                    <span>{range.icon}</span>
                    <span>{range.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="pt-1 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contador de resultados */}
        <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between px-1">
          <span className="text-xs text-gray-500 font-medium">
            {filtered.length} tipo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </span>
          {(activeFilterCount > 0 || searchQuery) && (
            <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-800 font-semibold cursor-pointer">
              Limpar tudo
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-600 font-semibold text-lg">Nenhum tipo de site encontrado.</p>
            <p className="text-gray-400 text-sm mt-1">Tente outros termos ou remova os filtros.</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-primary-700 transition"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((type) => {
              const cx = complexityLabels[type.complexity];
              const isSelected = selected?.id === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : type)}
                  className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/60 shadow-lg ring-2 ring-primary-500/20'
                      : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{type.emoji}</span>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 leading-tight">{type.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 leading-tight">{type.shortDesc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0 ml-2 mt-0.5" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {cx && (
                      <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border ${cx.color}`}>
                        {cx.label}
                      </span>
                    )}
                    <span className="inline-flex items-center text-[11px] text-gray-500 font-medium">
                      <Clock className="h-3 w-3 mr-0.5" />
                      {type.deliveryDays} dias
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-gray-100">
                    <span className="text-[11px] text-gray-500">{type.priceNote}</span>
                    <span className="font-black text-base text-gray-900">
                      {type.basePrice >= 100000
                        ? 'Sob orçamento'
                        : `${type.basePrice.toLocaleString('pt-MZ')} MT`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Painel Sticky */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border-2 border-primary-500 shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0">{selected.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-gray-900 text-sm">{selected.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{selected.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selected.examples.slice(0, 3).map((ex) => (
                    <span key={ex} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                      {ex}
                    </span>
                  ))}
                  {selected.examples.length > 3 && (
                    <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                      +{selected.examples.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 w-full sm:w-auto">
              <div className="flex-1 sm:text-right">
                <div className="text-xs text-gray-500">{selected.priceNote}</div>
                <div className="text-xl font-black text-primary-700">
                  {selected.basePrice >= 100000
                    ? 'Sob orçamento'
                    : `${selected.basePrice.toLocaleString('pt-MZ')} MT`}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center sm:justify-end">
                  <Clock className="h-3 w-3 mr-0.5" />
                  {selected.deliveryDays} dias de entrega
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleProceed(selected)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-2xl shadow-lg transition cursor-pointer flex-shrink-0"
              >
                <span>Solicitar Orçamento</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiteQuotePage() {
  return (
    <Suspense fallback={<PageLoader text="A carregar tipos de sites..." />}>
      <SiteQuoteContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Server, ArrowLeft, ArrowRight, CheckCircle2, Clock, Search, SlidersHorizontal, X } from 'lucide-react';
import { websiteTypes, WebsiteType } from '@/lib/data';
import Navbar from '@/components/Navbar';
import PageLoader from '@/components/PageLoader';
import { auth } from '@/lib/auth';

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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <div className="max-w-2xl mx-auto mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-200 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Filtrar por</h3>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Complexidade */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Complexidade</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(complexityLabels).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setComplexityFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      complexityFilter === key
                        ? complexityLabels[key].active
                        : color
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Faixa de Preço */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Faixa de Preço</p>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setPriceFilter(range.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      priceFilter === range.id
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-1">{range.icon}</span>
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grid de Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-600 text-sm mb-4">Tente ajustar os filtros ou a pesquisa</p>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((type) => (
              <div
                key={type.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{type.emoji}</div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    complexityLabels[type.complexity].color
                  }`}>
                    {complexityLabels[type.complexity].label}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {type.name}
                </h3>

                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {type.shortDesc}
                </p>

                <div className="space-y-2 mb-4">
                  {type.examples.slice(0, 3).map((example, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-gray-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{example}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium">Preço estimado</p>
                      <p className="text-xl font-black text-primary-700">
                        {type.basePrice.toLocaleString('pt-MZ')} MT
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-medium">Prazo</p>
                      <p className="text-sm font-bold text-gray-900">{type.deliveryDays} dias</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleProceed(type)}
                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition duration-200 flex items-center justify-center space-x-2 group-hover:scale-[1.02] active:scale-95"
                  >
                    <span>Solicitar Orçamento</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SiteQuotePage() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      // Redirect to dashboard version if logged in
      router.replace('/dashboard/site-quote');
    }
  }, [router]);

  return (
    <Suspense fallback={<PageLoader text="A carregar..." />}>
      <SiteQuoteContent />
    </Suspense>
  );
}

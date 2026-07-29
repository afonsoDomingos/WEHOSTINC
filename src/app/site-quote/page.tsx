'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Server, ArrowLeft, ArrowRight, CheckCircle2, Clock, Search } from 'lucide-react';
import { websiteTypes, WebsiteType } from '@/lib/data';
import Navbar from '@/components/Navbar';

const complexityLabels = {
  simple: { label: 'Simples', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  medium: { label: 'Intermédio', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  complex: { label: 'Complexo', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  enterprise: { label: 'Empresarial', color: 'text-red-700 bg-red-50 border-red-200' }
};

function SiteQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainParam = searchParams.get('domain');
  const domainPriceParam = searchParams.get('domainPrice');

  const [selected, setSelected] = useState<WebsiteType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = websiteTypes.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.shortDesc.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Pesquisa */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar tipo de site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>

        {/* Grid de Tipos */}
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
                  <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border ${cx.color}`}>
                    {cx.label}
                  </span>
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
      </main>

      {/* Painel Sticky do Selecionado */}
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
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    }>
      <SiteQuoteContent />
    </Suspense>
  );
}

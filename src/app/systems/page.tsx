'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Play, Check, Star, ArrowRight, Search, Filter } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageLoader from '@/components/PageLoader';
import InteractiveSteps from '@/components/InteractiveSteps';
import { dataManager, SystemForRent } from '@/lib/data';
import { auth } from '@/lib/auth';

export default function SystemsPage() {
  const router = useRouter();
  const [systems, setSystems] = useState<SystemForRent[]>([]);
  const [filteredSystems, setFilteredSystems] = useState<SystemForRent[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.getCurrentUser() || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    // Carregar sistemas e avaliações
    const loadData = async () => {
      const fetched = await dataManager.fetchSystemsForRentAsync();
      const activeSystems = fetched.filter(s => s.isActive && s.approvalStatus === 'approved');
      setSystems(activeSystems);
      setFilteredSystems(activeSystems);

      // Carregar avaliações
      await dataManager.fetchSystemRatingsAsync();
      const ratingMap: Record<string, number> = {};
      activeSystems.forEach(system => {
        ratingMap[system.id] = dataManager.getAverageRating(system.id);
      });
      setRatings(ratingMap);

      setLoading(false);
    };

    loadData();

    // Verificar se usuário está logado
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Filtrar sistemas
  useEffect(() => {
    let filtered = systems;

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.shortDescription.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    // Filtro de categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    // Filtro de preço
    if (priceRange === 'free') {
      filtered = filtered.filter(s => s.isFree || s.monthlyPrice === 0);
    } else if (priceRange === 'low') {
      filtered = filtered.filter(s => s.monthlyPrice > 0 && s.monthlyPrice < 5000);
    } else if (priceRange === 'medium') {
      filtered = filtered.filter(s => s.monthlyPrice >= 5000 && s.monthlyPrice < 15000);
    } else if (priceRange === 'high') {
      filtered = filtered.filter(s => s.monthlyPrice >= 15000);
    }

    setFilteredSystems(filtered);
  }, [searchQuery, selectedCategory, priceRange, systems]);

  const handleRentSystem = (systemId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/dashboard/systems?rent=${systemId}`);
  };

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'gestao', label: 'Gestão' },
    { value: 'educacao', label: 'Educação' },
    { value: 'saude', label: 'Saúde' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'rh', label: 'Recursos Humanos' },
    { value: 'outros', label: 'Outros' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageLoader text="A carregar sistemas disponíveis..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-indigo-700 text-white py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Sistemas Prontos para Aluguer
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-6 sm:mb-8">
              Soluções digitais completas por assinatura. Escolha, alugue e comece a usar imediatamente.
              Sem desenvolvimento, sem espera.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                href="#sistemas"
                className="inline-flex items-center justify-center space-x-2 bg-white text-primary-600 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-100 transition shadow-lg"
              >
                <span>Ver Sistemas Disponíveis</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-white/20 transition border border-white/30"
              >
                <span>Como Funciona</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Como Funciona */}
      <div id="como-funciona" className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-200">
            <InteractiveSteps />
          </div>
        </div>
      </div>

      {/* Sistemas Disponíveis */}
      <div id="sistemas" className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Sistemas Disponíveis
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Explore nossa catálogo de sistemas prontos para uso imediato
            </p>
          </div>

          {/* Busca e Filtros */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar sistemas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro de Categoria */}
              <div className="flex-1">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Filtro de Preço */}
              <div className="flex-1">
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todos os Preços</option>
                  <option value="free">Gratuitos (Grátis)</option>
                  <option value="low">Até 5.000 MT/mês</option>
                  <option value="medium">5.000 - 15.000 MT/mês</option>
                  <option value="high">Acima de 15.000 MT/mês</option>
                </select>
              </div>
            </div>

            {/* Resultados */}
            <div className="mt-4 text-sm text-gray-600">
              {filteredSystems.length === systems.length ? (
                <span>Mostrando {systems.length} sistema(s)</span>
              ) : (
                <span>Mostrando {filteredSystems.length} de {systems.length} sistema(s)</span>
              )}
            </div>
          </div>

          {filteredSystems.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-sm">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Nenhum sistema encontrado
              </h3>
              <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                Tente ajustar os filtros ou a busca para encontrar o sistema que procura.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredSystems.map((system) => (
                <div key={system.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden border border-gray-100">
                  {/* Imagem */}
                  <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center">
                    {system.image ? (
                      <img
                        src={system.image}
                        alt={system.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-6xl sm:text-7xl">🚀</div>
                    )}
                    {(system.isFree || system.monthlyPrice === 0) && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center space-x-1">
                        <span>GRÁTIS</span>
                      </div>
                    )}
                    {system.demoUrl && (
                      <Link
                        href={system.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-white transition flex items-center space-x-1"
                      >
                        <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Demo</span>
                      </Link>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-5 sm:p-6">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
                          {system.category}
                        </span>
                        {ratings[system.id] > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-semibold text-gray-700">{ratings[system.id]}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {system.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {system.shortDescription}
                      </p>
                    </div>

                    {/* Funcionalidades */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {system.features.slice(0, 4).map((feature, index) => (
                          <span key={index} className="inline-flex items-center text-[10px] sm:text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            <Check className="h-3 w-3 mr-1 text-green-500" />
                            {feature}
                          </span>
                        ))}
                        {system.features.length > 4 && (
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            +{system.features.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preços */}
                    {(system.isFree || system.monthlyPrice === 0) ? (
                      <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs">✓</span>
                          <span className="text-emerald-950 font-bold text-sm sm:text-base">100% Gratuito</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-md">Sem Custos</span>
                      </div>
                    ) : (
                      <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 text-xs sm:text-sm">Mensal</span>
                          <span className="text-lg sm:text-xl font-bold text-gray-900">
                            {system.monthlyPrice.toLocaleString('pt-MZ')} MT
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 text-xs sm:text-sm">Anual</span>
                          <span className="text-lg sm:text-xl font-bold text-primary-600">
                            {system.yearlyPrice.toLocaleString('pt-MZ')} MT
                          </span>
                        </div>
                        {system.setupFee ? (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <span className="text-gray-500 text-[10px] sm:text-xs">
                              Taxa de configuração: {system.setupFee.toLocaleString('pt-MZ')} MT
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Botão */}
                    <button
                      onClick={() => handleRentSystem(system.id)}
                      className={`w-full font-bold py-2.5 sm:py-3 rounded-xl transition flex items-center justify-center space-x-2 ${
                        (system.isFree || system.monthlyPrice === 0)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      <span>{(system.isFree || system.monthlyPrice === 0) ? 'Obter Acesso Grátis' : 'Solicitar Aluguer'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Final */}
      <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Pronto para começar?
          </h2>
          <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
            Entre em contacto conosco para saber mais sobre os sistemas disponíveis ou para solicitar uma solução personalizada.
          </p>
          <Link
            href="#contacto"
            className="inline-flex items-center justify-center space-x-2 bg-white text-primary-600 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-100 transition shadow-lg"
          >
            <span>Contactar-nos</span>
            <ExternalLink className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

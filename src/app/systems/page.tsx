'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Play, Check, Star, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageLoader from '@/components/PageLoader';
import { dataManager, SystemForRent } from '@/lib/data';
import { auth } from '@/lib/auth';

export default function SystemsPage() {
  const router = useRouter();
  const [systems, setSystems] = useState<SystemForRent[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.getCurrentUser() || null);

  useEffect(() => {
    // Carregar sistemas
    const loadSystems = async () => {
      const fetched = await dataManager.fetchSystemsForRentAsync();
      setSystems(fetched.filter(s => s.isActive && s.approvalStatus === 'approved'));
      setLoading(false);
    };

    loadSystems();

    // Verificar se usuário está logado
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleRentSystem = (systemId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/dashboard/systems?rent=${systemId}`);
  };

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
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Como Funciona
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Em apenas 4 passos simples, você terá o sistema pronto para usar
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              { step: '1', title: 'Escolha', desc: 'Selecione o sistema ideal' },
              { step: '2', title: 'Solicite', desc: 'Faça o pedido de aluguer' },
              { step: '3', title: 'Aprovação', desc: 'Após pagamento, aprovamos' },
              { step: '4', title: 'Use', desc: 'Receba credenciais e use' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl sm:text-3xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-sm sm:text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-gray-600 text-[10px] sm:text-xs sm:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sistemas Disponíveis */}
      <div id="sistemas" className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Sistemas Disponíveis
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Explore nossa catálogo de sistemas prontos para uso imediato
            </p>
          </div>

          {systems.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-sm">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Nenhum sistema disponível no momento
              </h3>
              <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                Estamos a preparar novos sistemas. Volte em breve!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {systems.map((system) => (
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
                      <span className="inline-block px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mb-2">
                        {system.category}
                      </span>
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
                      {system.setupFee && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-500 text-[10px] sm:text-xs">
                            Taxa de configuração: {system.setupFee.toLocaleString('pt-MZ')} MT
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botão */}
                    <button
                      onClick={() => handleRentSystem(system.id)}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 sm:py-3 rounded-xl transition flex items-center justify-center space-x-2"
                    >
                      <span>Solicitar Aluguer</span>
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

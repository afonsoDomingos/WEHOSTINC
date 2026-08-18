'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, Globe, Mail, Database, Settings as SettingsIcon, 
  LogOut, FileText, Star, ArrowLeft, Upload, Plus, X, Check
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, SystemForRent } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';

export default function SubmitSystemPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [setupFee, setSetupFee] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [currentFeature, setCurrentFeature] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    // Aguardar NextAuth carregar
    if (status === 'loading') return;
    
    let currentUser: User | null = null;
    
    // Tentar NextAuth primeiro
    if (status === 'authenticated' && session?.user) {
      currentUser = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'none',
        status: (session.user as any)?.status || 'active',
        role: (session.user as any)?.role || 'user',
        avatar: session.user.image || undefined,
        dueDate: (session.user as any)?.dueDate,
        createdAt: (session.user as any)?.createdAt || new Date().toISOString()
      };
    }
    
    // Fallback para sistema customizado (se NextAuth falhar ou não estiver autenticado)
    if (!currentUser) {
      currentUser = auth.getCurrentUser();
    }
    
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com') {
      router.push('/admin');
      return;
    }
    setUser(currentUser);
    setLoading(false);
  }, [router, session, status]);

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  const handleAddFeature = () => {
    if (currentFeature.trim()) {
      setFeatures([...features, currentFeature.trim()]);
      setCurrentFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const systemData: Omit<SystemForRent, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        shortDescription,
        description,
        category,
        demoUrl: demoUrl || undefined,
        features,
        monthlyPrice: isFree ? 0 : (parseFloat(monthlyPrice) || 0),
        yearlyPrice: isFree ? 0 : (parseFloat(yearlyPrice) || 0),
        setupFee: (isFree || !setupFee) ? 0 : parseFloat(setupFee),
        image: imagePreview || '',
        isActive: false,
        isFree: isFree || (parseFloat(monthlyPrice) === 0 && parseFloat(yearlyPrice) === 0),
        approvalStatus: 'pending',
        developerEmail: user.email,
        developerName: user.name
      };

      dataManager.addSystemForRent(systemData);
      router.push('/dashboard/systems?submitted=true');
    } catch (error) {
      console.error('Erro ao submeter sistema:', error);
      alert('Erro ao submeter sistema. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader text="A carregar..." />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="col-span-1 lg:col-span-3 space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6 w-full">
              <Link
                href="/dashboard/systems"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para Sistemas</span>
              </Link>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Submeter Sistema para Aluguer</h1>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">
                Partilhe o seu sistema com a comunidade WeHostHere e ganhe rendimento com cada aluguer.
              </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6 w-full">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Informações Básicas</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Sistema *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ex: Sistema de Gestão de Restaurante"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta *</label>
                    <input
                      type="text"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      required
                      maxLength={150}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Resumo em uma linha (máx. 150 caracteres)"
                    />
                    <p className="text-xs text-gray-500 mt-1">{shortDescription.length}/150</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Completa *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Descreva detalhadamente o sistema, suas funcionalidades e benefícios..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma categoria</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="gestao">Gestão</option>
                      <option value="educacao">Educação</option>
                      <option value="saude">Saúde</option>
                      <option value="restauracao">Restauração</option>
                      <option value="hotelaria">Hotelaria</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                </div>

                {/* Imagem */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Imagem do Sistema</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagem de Capa *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition">
                      <input
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                        id="system-image"
                      />
                      <label htmlFor="system-image" className="cursor-pointer">
                        {imagePreview ? (
                          <div className="space-y-2">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded-lg"
                            />
                            <p className="text-sm text-gray-600">Clique para alterar</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">Clique para fazer upload</span>
                            <span className="text-xs text-gray-400">PNG, JPG até 5MB</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Funcionalidades */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Funcionalidades</h2>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentFeature}
                      onChange={(e) => setCurrentFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Adicionar funcionalidade..."
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          {feature}
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="text-gray-500 hover:text-red-500 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preços */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Preços & Modelo de Licença</h2>
                  </div>

                  {/* Toggle para Sistema Gratuito */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="isFreeToggle"
                      checked={isFree}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsFree(checked);
                        if (checked) {
                          setMonthlyPrice('0');
                          setYearlyPrice('0');
                          setSetupFee('0');
                        }
                      }}
                      className="mt-0.5 h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                    />
                    <div>
                      <label htmlFor="isFreeToggle" className="block text-sm font-bold text-emerald-900 cursor-pointer">
                        Disponibilizar este sistema gratuitamente (100% Grátis)
                      </label>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Marque esta opção para disponibilizar o sistema para a comunidade sem qualquer cobrança.
                      </p>
                    </div>
                  </div>

                  {!isFree ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Preço Mensal (MT) *</label>
                          <input
                            type="number"
                            value={monthlyPrice}
                            onChange={(e) => setMonthlyPrice(e.target.value)}
                            required={!isFree}
                            min="0"
                            step="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Ex: 2500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Preço Anual (MT) *</label>
                          <input
                            type="number"
                            value={yearlyPrice}
                            onChange={(e) => setYearlyPrice(e.target.value)}
                            required={!isFree}
                            min="0"
                            step="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Ex: 25000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Configuração (opcional)</label>
                        <input
                          type="number"
                          value={setupFee}
                          onChange={(e) => setSetupFee(e.target.value)}
                          min="0"
                          step="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-medium text-center">
                      Os valores de mensalidade, anuidade e taxa de instalação foram definidos como 0 MT (Gratuito).
                    </div>
                  )}
                </div>

                {/* Demo */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Demonstração</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link de Demo (opcional)</label>
                    <input
                      type="url"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://exemplo.com/demo"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <span>A submeter...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        <span>Submeter para Aprovação</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    O seu sistema será analisado pela equipa WeHostHere antes de ser publicado.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

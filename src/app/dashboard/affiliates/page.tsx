'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Link2, DollarSign, Users, TrendingUp, Copy, CheckCircle2, 
  Download, Share2, Calendar, Filter, RefreshCw, Wallet,
  ArrowUpRight, Eye, ShoppingCart, Home, BarChart3, Gift, HelpCircle,
  Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowLeft
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AffiliateData {
  _id: string;
  userId: string;
  affiliateCode: string;
  affiliateLink: string;
  status: 'pending' | 'active' | 'suspended';
  totalEarnings: number;
  availableBalance: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  payoutMethod?: string;
  createdAt: string;
}

interface Commission {
  _id: string;
  orderId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  referredCustomerEmail: string;
  referredCustomerName?: string;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
}

interface MarketingMaterial {
  _id: string;
  title: string;
  description: string;
  type: string;
  content: string;
  imageUrl?: string;
  platform?: string;
  category: string;
}

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarnings: number;
  availableBalance: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
}

export default function AffiliatesPage() {
  const { data: session, status } = useSession();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'materials' | 'performance'>('overview');
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'paypal' | 'mpesa'>('bank_transfer');
  const [payoutDetails, setPayoutDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    paypalEmail: '',
    mpesaPhone: '',
  });
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performancePeriod, setPerformancePeriod] = useState('30');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'auth' | 'network' | 'api' | 'unknown'>('unknown');

  const getUserId = () => {
    // Tentar NextAuth primeiro (Google OAuth)
    if (status === 'authenticated' && session?.user) {
      const userId = (session.user as any)?.id;
      const userEmail = session.user.email;
      console.log('getUserId - NextAuth userId:', userId, 'email:', userEmail);
      
      if (userId) return userId;
      if (userEmail) return userEmail;
    }
    
    // Fallback para sistema customizado
    const currentUser = auth.getCurrentUser();
    console.log('getUserId - Custom auth user:', currentUser);
    
    if (currentUser?.id) return currentUser.id;
    if (currentUser?.email) return currentUser.email;
    
    console.log('getUserId - No user found');
    return '';
  };

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setErrorType('unknown');
      const userId = getUserId();
      
      console.log('fetchAffiliateData - userId:', userId);
      
      // Se não tiver userId, não tentar buscar dados - mostrar página de registro
      if (!userId) {
        console.log('fetchAffiliateData - No userId, showing registration page');
        setAffiliate(null);
        setErrorMessage('Não foi possível identificar sua conta. Por favor, faça login novamente.');
        setErrorType('auth');
        setLoading(false);
        return;
      }
      
      // Fetch dashboard data
      const apiUrl = `/api/affiliates/dashboard?userId=${userId}`;
      console.log('fetchAffiliateData - Fetching from:', apiUrl);
      
      const dashboardRes = await fetch(apiUrl);
      
      if (!dashboardRes.ok) {
        console.log('fetchAffiliateData - Dashboard fetch failed:', dashboardRes.status);
        setAffiliate(null);
        if (dashboardRes.status === 404) {
          setErrorMessage('Afiliado não encontrado. Você pode se registrar como afiliado abaixo.');
          setErrorType('api');
        } else if (dashboardRes.status === 401) {
          setErrorMessage('Erro de autenticação. Por favor, faça login novamente.');
          setErrorType('auth');
        } else if (dashboardRes.status >= 500) {
          setErrorMessage('Erro no servidor. Tente novamente em alguns minutos.');
          setErrorType('network');
        } else {
          setErrorMessage('Erro ao carregar dados do afiliado. Tente novamente.');
          setErrorType('api');
        }
        setLoading(false);
        return;
      }
      
      const dashboardData = await dashboardRes.json();
      console.log('fetchAffiliateData - Response:', dashboardData);

      if (dashboardData.success && dashboardData.affiliate) {
        console.log('fetchAffiliateData - Affiliate found:', dashboardData.affiliate);
        setAffiliate(dashboardData.affiliate);
        setCommissions(dashboardData.commissions || []);
        setStats(dashboardData.stats || {});
        
        // Fetch marketing materials (só se tiver affiliate)
        if (dashboardData.affiliate.affiliateCode) {
          try {
            const materialsRes = await fetch(`/api/affiliates/materials?affiliateCode=${dashboardData.affiliate.affiliateCode}`);
            if (materialsRes.ok) {
              const materialsData = await materialsRes.json();
              if (materialsData.success) {
                setMaterials(materialsData.materials || []);
              }
            }
          } catch (e) {
            console.log('fetchAffiliateData - Error fetching materials:', e);
            // Não falhar se materials falhar
          }
        }
        
        // Fetch performance data (só se tiver affiliate)
        try {
          const performanceRes = await fetch(`/api/affiliates/performance?userId=${userId}&period=${performancePeriod}`);
          if (performanceRes.ok) {
            const performanceData = await performanceRes.json();
            if (performanceData.success) {
              setPerformanceData(performanceData);
            }
          }
        } catch (e) {
          console.log('fetchAffiliateData - Error fetching performance:', e);
          // Não falhar se performance falhar
        }
      } else if (dashboardData.error === 'Afiliado não encontrado') {
        // Usuário não é afiliado ainda
        console.log('fetchAffiliateData - Affiliate not found, showing registration page');
        setAffiliate(null);
        setErrorMessage('Você ainda não é um afiliado. Registre-se abaixo para começar a ganhar comissões.');
        setErrorType('api');
      } else {
        console.log('fetchAffiliateData - Error:', dashboardData.error);
        setAffiliate(null);
        setErrorMessage(dashboardData.error || 'Erro ao carregar dados do afiliado.');
        setErrorType('api');
      }
    } catch (error) {
      console.error('fetchAffiliateData - Unexpected error:', error);
      setAffiliate(null);
      setErrorMessage('Erro de conexão. Verifique sua internet e tente novamente.');
      setErrorType('network');
    } finally {
      setLoading(false);
    }
  };

  const shareToSocialMedia = (platform: string) => {
    if (!affiliate) return;
    
    const text = 'Ganhe 30% de comissão com o programa de afiliados da WEHOSTHERE!';
    const url = affiliate.affiliateLink;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayout = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        alert('Erro: Usuário não autenticado');
        return;
      }
      
      const response = await fetch('/api/affiliates/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          payoutMethod,
          payoutDetails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Saque solicitado com sucesso!');
        setShowPayoutModal(false);
        fetchAffiliateData();
      } else {
        alert('Erro ao solicitar saque: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao solicitar saque');
      console.error(error);
    }
  };

  const registerAsAffiliate = async () => {
    try {
      // Aguardar que a sessão esteja carregada
      if (status === 'loading') {
        alert('A carregar sessão, tente novamente...');
        return;
      }

      const userId = getUserId();
      console.log('registerAsAffiliate - userId:', userId);
      
      if (!userId) {
        alert('Erro: Não foi possível identificar sua conta. Por favor, faça login novamente.');
        return;
      }
      
      // Tentar registrar com userId
      const response = await fetch('/api/affiliates/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      console.log('registerAsAffiliate - response:', data);

      if (data.success) {
        if (data.alreadyAffiliate) {
          // Usuário já é afiliado, recarregar a página para mostrar o painel
          window.location.reload();
        } else {
          // Novo afiliado registrado, recarregar para mostrar o painel
          window.location.reload();
        }
      } else {
        alert('Erro ao registrar como afiliado: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao registrar como afiliado');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-MZ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-3xl mx-auto py-8 px-4 sm:py-12 sm:px-6">
          {/* Error Message */}
          {errorMessage && (
            <div className={`mb-6 rounded-2xl p-4 border ${
              errorType === 'auth' ? 'bg-red-50 border-red-200' :
              errorType === 'network' ? 'bg-yellow-50 border-yellow-200' :
              errorType === 'api' ? 'bg-blue-50 border-blue-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start space-x-3">
                {errorType === 'auth' && (
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {errorType === 'network' && (
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {errorType === 'api' && (
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    errorType === 'auth' ? 'text-red-800' :
                    errorType === 'network' ? 'text-yellow-800' :
                    errorType === 'api' ? 'text-blue-800' :
                    'text-gray-800'
                  }`}>
                    {errorType === 'auth' ? 'Erro de Autenticação' :
                     errorType === 'network' ? 'Erro de Conexão' :
                     errorType === 'api' ? 'Informação' :
                     'Aviso'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    errorType === 'auth' ? 'text-red-700' :
                    errorType === 'network' ? 'text-yellow-700' :
                    errorType === 'api' ? 'text-blue-700' :
                    'text-gray-700'
                  }`}>
                    {errorMessage}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setErrorMessage('');
                    setErrorType('unknown');
                  }}
                  className={`flex-shrink-0 p-1 rounded-lg ${
                    errorType === 'auth' ? 'hover:bg-red-100 text-red-600' :
                    errorType === 'network' ? 'hover:bg-yellow-100 text-yellow-600' :
                    errorType === 'api' ? 'hover:bg-blue-100 text-blue-600' :
                    'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g９IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi0yLTJjMCAwIDAtMiAyLTJzMCAyIDIgMnMtMiAyLTIgMmMwIDIgMiA0IDIgNHMyIDIgMiAycy0yIDItMiAyYzAgMCAwIDItMiAyYzAgMiAyIDQgMiA0czItMiAyLTJzLTItMi0yLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl ring-4 ring-white/30">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2 sm:mb-4 tracking-tight">
                  Programa de Afiliados
                </h2>
                <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  Ganhe <span className="font-bold text-emerald-300">30% de comissão</span> em cada venda que você gerar através do seu link de afiliado!
                </p>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { icon: '🚀', title: 'Registre-se gratuitamente', desc: 'Sem taxas nem custos ocultos' },
                  { icon: '🔗', title: 'Compartilhe seu link único', desc: 'Link personalizado para você' },
                  { icon: '💰', title: 'Ganhe 30% de cada venda', desc: 'Comissões generosas e recorrentes' },
                  { icon: '💳', title: 'Saque quando atingir 1.000 MZN', desc: 'Pagamento rápido e seguro' },
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-lg hover:border-primary-300 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-0.5">{benefit.title}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600">{benefit.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <button
                  onClick={registerAsAffiliate}
                  className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 hover:from-primary-700 hover:via-primary-800 hover:to-indigo-800 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl transition-all duration-300 font-bold text-sm sm:text-base md:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transform"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  <span>Tornar-se Afiliado Agora</span>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <p className="mt-2 sm:mt-4 text-[10px] sm:text-xs md:text-sm text-gray-500">
                  Comece a ganhar dinheiro hoje mesmo • Sem compromisso
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Programa de Afiliados</h1>
                  <p className="text-gray-600">
                    Status: <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(affiliate.status)}`}>
                      {affiliate.status === 'active' ? 'Ativo' : affiliate.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchAffiliateData}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center justify-center space-y-1 px-4 py-3 rounded-xl transition font-medium ${
                activeTab === 'overview' 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs md:text-sm">Visão Geral</span>
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex flex-col items-center justify-center space-y-1 px-4 py-3 rounded-xl transition font-medium ${
                activeTab === 'commissions' 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs md:text-sm">Comissões</span>
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex flex-col items-center justify-center space-y-1 px-4 py-3 rounded-xl transition font-medium ${
                activeTab === 'performance' 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs md:text-sm">Performance</span>
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex flex-col items-center justify-center space-y-1 px-4 py-3 rounded-xl transition font-medium ${
                activeTab === 'materials' 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Gift className="h-5 w-5" />
              <span className="text-xs md:text-sm">Materiais</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs md:text-sm font-medium mb-1">Saldo Disponível</p>
                <p className="text-xl md:text-3xl font-bold">
                  {stats?.availableBalance.toLocaleString('pt-MZ')} MZN
                </p>
              </div>
              <Wallet className="h-8 w-8 md:h-10 md:w-10 text-emerald-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-xs md:text-sm font-medium mb-1">Ganhos Totais</p>
                <p className="text-xl md:text-3xl font-bold">
                  {stats?.totalEarnings.toLocaleString('pt-MZ')} MZN
                </p>
              </div>
              <DollarSign className="h-8 w-8 md:h-10 md:w-10 text-primary-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs md:text-sm font-medium mb-1">Total Cliques</p>
                <p className="text-xl md:text-3xl font-bold">
                  {stats?.totalClicks}
                </p>
              </div>
              <Eye className="h-8 w-8 md:h-10 md:w-10 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs md:text-sm font-medium mb-1">Conversões</p>
                <p className="text-xl md:text-3xl font-bold">
                  {stats?.totalConversions}
                </p>
              </div>
              <Users className="h-8 w-8 md:h-10 md:w-10 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Affiliate Link */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Seu Link de Nhonga</h3>
              </div>
              <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3 mb-4">
                <input
                  type="text"
                  value={affiliate.affiliateLink}
                  readOnly
                  className="flex-1 px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(affiliate.affiliateLink)}
                  className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition font-semibold shadow-lg"
                >
                  {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              
              {/* Social Media Share Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-600 w-full md:w-auto">Compartilhar:</span>
                <button
                  onClick={() => shareToSocialMedia('facebook')}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  title="Compartilhar no Facebook"
                >
                  <Facebook className="h-4 w-4" />
                  <span className="text-sm">Facebook</span>
                </button>
                <button
                  onClick={() => shareToSocialMedia('twitter')}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                  title="Compartilhar no Twitter"
                >
                  <Twitter className="h-4 w-4" />
                  <span className="text-sm">Twitter</span>
                </button>
                <button
                  onClick={() => shareToSocialMedia('linkedin')}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
                  title="Compartilhar no LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                  <span className="text-sm">LinkedIn</span>
                </button>
                <button
                  onClick={() => shareToSocialMedia('whatsapp')}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  title="Compartilhar no WhatsApp"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">WhatsApp</span>
                </button>
              </div>
              <p className="text-gray-600 mt-4 flex items-center space-x-2">
                <Share2 className="h-4 w-4 text-primary-600" />
                <span>Compartilhe este link para ganhar 30% de comissão em cada venda!</span>
              </p>
            </div>

            {/* Payout Button */}
            {stats && stats.availableBalance >= 1000 && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">🎉 Você tem saldo disponível para saque!</h3>
                    <p className="text-emerald-100">
                      Saldo: {stats.availableBalance.toLocaleString('pt-MZ')} MZN
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className="flex items-center space-x-2 bg-white text-emerald-600 px-8 py-4 rounded-xl hover:bg-emerald-50 transition font-semibold shadow-lg"
                  >
                    <Wallet className="h-5 w-5" />
                    <span>Solicitar Saque</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Materiais de Marketing</h3>
              </div>
              <span className="text-xs md:text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Use [AFFILIATE_LINK] nos materiais</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {materials.map((material) => (
                <div key={material._id} className="border-2 border-gray-200 rounded-2xl p-4 md:p-5 hover:shadow-xl transition group">
                  {material.imageUrl && (
                    <img
                      src={material.imageUrl}
                      alt={material.title}
                      className="w-full h-32 md:h-40 object-cover rounded-xl mb-4 group-hover:scale-105 transition"
                    />
                  )}
                  <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base">{material.title}</h4>
                  <p className="text-xs md:text-sm text-gray-600 mb-3">{material.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full font-medium">{material.type}</span>
                    {material.platform && (
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full font-medium">{material.platform}</span>
                    )}
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 text-xs text-gray-600 max-h-24 overflow-y-auto mb-4">
                    {material.content.substring(0, 150)}...
                  </div>
                  <button
                    onClick={() => copyToClipboard(material.content)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition font-semibold shadow-md"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copiar Código</span>
                  </button>
                </div>
              ))}
            </div>
            {materials.length === 0 && (
              <div className="text-center py-12">
                <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum material disponível ainda</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Histórico de Comissões</h3>
            </div>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Pedido</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Cliente</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Valor</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Comissão</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Status</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission._id} className="border-b border-gray-100 hover:bg-gradient-to-r from-gray-50 to-white transition">
                      <td className="py-3 md:py-4 px-4 text-sm text-gray-900">#{commission.orderId}</td>
                      <td className="py-3 md:py-4 px-4 text-sm text-gray-600">
                        {commission.referredCustomerName || commission.referredCustomerEmail}
                      </td>
                      <td className="py-3 md:py-4 px-4 text-sm text-gray-900">
                        {commission.orderAmount.toLocaleString('pt-MZ')} MZN
                      </td>
                      <td className="py-3 md:py-4 px-4 text-sm font-semibold text-emerald-600">
                        {commission.commissionAmount.toLocaleString('pt-MZ')} MZN
                      </td>
                      <td className="py-3 md:py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          commission.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          commission.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {commission.status}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-4 text-sm text-gray-600">
                        {new Date(commission.createdAt).toLocaleDateString('pt-MZ')}
                      </td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p>Nenhuma comissão ainda</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Performance</h3>
              </div>
              <select
                value={performancePeriod}
                onChange={(e) => {
                  setPerformancePeriod(e.target.value);
                  fetchAffiliateData();
                }}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>

            {performanceData ? (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 md:p-6 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span className="text-xs md:text-sm font-medium text-blue-800">Total de Cliques</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-blue-900">{performanceData.totalClicks}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 md:p-6 border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <ShoppingCart className="h-5 w-5 text-emerald-600" />
                      <span className="text-xs md:text-sm font-medium text-emerald-800">Conversões</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-emerald-900">{performanceData.totalConversions}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 md:p-6 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="text-xs md:text-sm font-medium text-purple-800">Taxa de Conversão</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-purple-900">{performanceData.conversionRate.toFixed(2)}%</p>
                  </div>
                </div>

                {/* Clicks Chart */}
                <div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Cliques por Dia</h4>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={Object.entries(performanceData.clicksByDay).map(([date, clicks]) => ({ date, clicks }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Commissions Chart */}
                <div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Comissões por Mês (MZN)</h4>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(performanceData.commissionsByMonth).map(([month, amount]) => ({ month, amount }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Carregando dados de performance...</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-primary-600" />
                <span className="text-sm md:text-base">Programa de Afiliados</span>
              </h4>
              <p className="text-gray-600 text-xs md:text-sm">
                Ganhe 30% de comissão em cada venda que você gerar através do seu link de afiliado.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="hover:text-primary-600 cursor-pointer">Termos e Condições</li>
                <li className="hover:text-primary-600 cursor-pointer">Política de Privacidade</li>
                <li className="hover:text-primary-600 cursor-pointer">FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@wehosthere.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+258 84 833 5618</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Moçambique</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Redes Sociais</h4>
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>© 2024 WEHOSTHERE. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Wallet className="h-6 w-6 text-primary-600" />
                <span>Solicitar Saque</span>
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="paypal">PayPal</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>

              {payoutMethod === 'bank_transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Banco</label>
                    <input
                      type="text"
                      value={payoutDetails.bankName}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número da Conta</label>
                    <input
                      type="text"
                      value={payoutDetails.accountNumber}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titular da Conta</label>
                    <input
                      type="text"
                      value={payoutDetails.accountHolder}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, accountHolder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {payoutMethod === 'paypal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email PayPal</label>
                  <input
                    type="email"
                    value={payoutDetails.paypalEmail}
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, paypalEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              {payoutMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone M-Pesa</label>
                  <input
                    type="tel"
                    value={payoutDetails.mpesaPhone}
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, mpesaPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+258 84 123 4567"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePayout}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Solicitar Saque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

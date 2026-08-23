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
  const [authError, setAuthError] = useState(false);

  const getUserId = () => {
    console.log('getUserId - status:', status);
    console.log('getUserId - session:', session);
    
    // Tentar NextAuth primeiro
    if (status === 'authenticated' && session?.user) {
      const userId = (session.user as any)?.id;
      const userEmail = session.user.email;
      console.log('getUserId - NextAuth userId:', userId, 'email:', userEmail);
      return userId || userEmail || '';
    }
    
    // Fallback para sistema customizado
    const currentUser = auth.getCurrentUser();
    console.log('getUserId - Custom auth user:', currentUser);
    return currentUser?.id || currentUser?.email || '';
  };

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      if (!userId) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      setAuthError(false);

      // Fetch dashboard data
      const dashboardRes = await fetch(`/api/affiliates/dashboard?userId=${userId}`);
      const dashboardData = await dashboardRes.json();

      if (dashboardData.success) {
        setAffiliate(dashboardData.affiliate);
        setCommissions(dashboardData.commissions);
        setStats(dashboardData.stats);
      } else if (dashboardData.error === 'Afiliado não encontrado') {
        // Usuário não é afiliado ainda
        setAffiliate(null);
      }

      // Fetch marketing materials
      const materialsRes = await fetch(`/api/affiliates/materials?affiliateCode=${dashboardData.affiliate?.affiliateCode}`);
      const materialsData = await materialsRes.json();

      if (materialsData.success) {
        setMaterials(materialsData.materials);
      }

      // Fetch performance data
      const performanceRes = await fetch(`/api/affiliates/performance?userId=${userId}&period=${performancePeriod}`);
      const performanceData = await performanceRes.json();

      if (performanceData.success) {
        setPerformanceData(performanceData.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de afiliado:', error);
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
        alert('Erro: Usuário não autenticado. Por favor, faça login novamente.');
        return;
      }
      
      const response = await fetch('/api/affiliates/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      console.log('registerAsAffiliate - response:', data);

      if (data.success) {
        if (data.alreadyAffiliate) {
          // Usuário já é afiliado, redirecionar para o painel
          window.location.href = '/dashboard/affiliates';
        } else {
          // Novo afiliado registrado
          fetchAffiliateData();
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
    if (authError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Erro de Autenticação</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Não foi possível identificar sua conta. Por favor, faça login novamente.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-xl transition font-semibold shadow-lg hover:shadow-xl"
              >
                <span>Fazer Login</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Programa de Afiliados</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Ganhe 30% de comissão em cada venda que você gerar através do seu link de afiliado!
            </p>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Como funciona:</h3>
              <ul className="text-left text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>Registre-se gratuitamente</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>Compartilhe seu link único</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>Ganhe 30% de cada venda</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>Saque quando atingir 1.000 MZN</span>
                </li>
              </ul>
            </div>
            <button
              onClick={registerAsAffiliate}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-xl transition font-semibold shadow-lg hover:shadow-xl"
            >
              <Users className="h-5 w-5" />
              <span>Tornar-se Afiliado</span>
            </button>
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

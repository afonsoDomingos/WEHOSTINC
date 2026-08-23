'use client';

import { useState, useEffect } from 'react';
import { 
  Link2, DollarSign, Users, TrendingUp, Copy, CheckCircle2, 
  Download, Share2, Calendar, Filter, RefreshCw, Wallet,
  ArrowUpRight, Eye, ShoppingCart
} from 'lucide-react';

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
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'paypal' | 'mpesa'>('bank_transfer');
  const [payoutDetails, setPayoutDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    paypalEmail: '',
    mpesaPhone: '',
  });

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      // Fetch dashboard data
      const dashboardRes = await fetch(`/api/affiliates/dashboard?userId=${userId}`);
      const dashboardData = await dashboardRes.json();

      if (dashboardData.success) {
        setAffiliate(dashboardData.affiliate);
        setCommissions(dashboardData.commissions);
        setStats(dashboardData.stats);
      }

      // Fetch marketing materials
      const materialsRes = await fetch(`/api/affiliates/materials?affiliateCode=${dashboardData.affiliate?.affiliateCode}`);
      const materialsData = await materialsRes.json();

      if (materialsData.success) {
        setMaterials(materialsData.materials);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de afiliado:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayout = async () => {
    try {
      const userId = localStorage.getItem('userId');
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
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/affiliates/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAffiliateData();
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Programa de Afiliados</h2>
          <p className="text-gray-600 mb-6">
            Ganhe 30% de comissão em cada venda que você gerar através do seu link de afiliado!
          </p>
          <button
            onClick={registerAsAffiliate}
            className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition font-semibold"
          >
            <Users className="h-5 w-5" />
            <span>Tornar-se Afiliado</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programa de Afiliados</h1>
          <p className="text-gray-600 mt-1">
            Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(affiliate.status)}`}>
              {affiliate.status === 'active' ? 'Ativo' : affiliate.status}
            </span>
          </p>
        </div>
        <button
          onClick={fetchAffiliateData}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Saldo Disponível</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.availableBalance.toLocaleString('pt-MZ')} MZN
              </p>
            </div>
            <Wallet className="h-10 w-10 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ganhos Totais</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalEarnings.toLocaleString('pt-MZ')} MZN
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-primary-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cliques Totais</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalClicks}</p>
            </div>
            <Eye className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversões</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalConversions}</p>
            </div>
            <ShoppingCart className="h-10 w-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Affiliate Link */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seu Link de Afiliado</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={affiliate.affiliateLink}
            readOnly
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
          />
          <button
            onClick={() => copyToClipboard(affiliate.affiliateLink)}
            className="flex items-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Compartilhe este link para ganhar 30% de comissão em cada venda!
        </p>
      </div>

      {/* Payout Button */}
      {stats && stats.availableBalance >= 1000 && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Você tem saldo disponível para saque!</h3>
              <p className="text-emerald-100 mt-1">
                Saldo: {stats.availableBalance.toLocaleString('pt-MZ')} MZN
              </p>
            </div>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="flex items-center space-x-2 bg-white text-emerald-600 px-6 py-3 rounded-lg hover:bg-emerald-50 transition font-semibold"
            >
              <Wallet className="h-5 w-5" />
              <span>Solicitar Saque</span>
            </button>
          </div>
        </div>
      )}

      {/* Marketing Materials */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Materiais de Marketing</h3>
          <span className="text-sm text-gray-500">Use [AFFILIATE_LINK] nos materiais</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material) => (
            <div key={material._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              {material.imageUrl && (
                <img
                  src={material.imageUrl}
                  alt={material.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              <h4 className="font-semibold text-gray-900 mb-1">{material.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{material.description}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                <span className="px-2 py-1 bg-gray-100 rounded">{material.type}</span>
                {material.platform && (
                  <span className="px-2 py-1 bg-gray-100 rounded">{material.platform}</span>
                )}
              </div>
              <div className="bg-gray-50 rounded p-2 text-xs text-gray-600 max-h-20 overflow-y-auto">
                {material.content.substring(0, 150)}...
              </div>
              <button
                onClick={() => copyToClipboard(material.content)}
                className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                <Copy className="h-4 w-4" />
                <span>Copiar Código</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Commissions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Comissões</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Pedido</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Valor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Comissão</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">#{commission.orderId}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {commission.referredCustomerName || commission.referredCustomerEmail}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {commission.orderAmount.toLocaleString('pt-MZ')} MZN
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-emerald-600">
                    {commission.commissionAmount.toLocaleString('pt-MZ')} MZN
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(commission.status)}`}>
                      {commission.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(commission.createdAt)}</td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Nenhuma comissão ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Solicitar Saque</h3>
            </div>
            <div className="p-6 space-y-4">
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

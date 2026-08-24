'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, DollarSign, TrendingUp, Plus, Edit, Trash2, 
  CheckCircle2, XCircle, Clock, Filter, RefreshCw,
  Image as ImageIcon, FileText, Video, Mail, Share2, Wallet,
  AlertTriangle, CheckCircle, X, ArrowLeft
} from 'lucide-react';

interface Affiliate {
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
  userName: string;
  userEmail: string;
  totalCommissions: number;
  pendingCommissions: number;
  createdAt: string;
}

interface Commission {
  _id: string;
  affiliateId: string;
  orderId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  referredCustomerEmail: string;
  referredCustomerName?: string;
  createdAt: string;
}

interface MarketingMaterial {
  _id: string;
  title: string;
  description: string;
  type: 'banner' | 'social_media' | 'email_template' | 'landing_page' | 'video' | 'text_ad';
  content: string;
  imageUrl?: string;
  platform?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminAffiliatesPage() {
  const [activeTab, setActiveTab] = useState<'affiliates' | 'commissions' | 'materials' | 'payouts' | 'migration'>('affiliates');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MarketingMaterial | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);

  // Migration states
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [migrateResult, setMigrateResult] = useState<any>(null);
  const [migrateError, setMigrateError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'banner' as 'banner' | 'social_media' | 'email_template' | 'landing_page' | 'video' | 'text_ad',
    content: '',
    imageUrl: '',
    platform: '',
    category: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'affiliates') {
        const res = await fetch(`/api/admin/affiliates/list?status=${filterStatus}`);
        const data = await res.json();
        if (data.success) setAffiliates(data.affiliates);
      } else if (activeTab === 'commissions') {
        const res = await fetch(`/api/admin/affiliates/commissions?status=${filterStatus}`);
        const data = await res.json();
        if (data.success) setCommissions(data.commissions);
      } else if (activeTab === 'materials') {
        const res = await fetch('/api/admin/affiliates/materials');
        const data = await res.json();
        if (data.success) setMaterials(data.materials);
      } else if (activeTab === 'payouts') {
        const res = await fetch(`/api/admin/affiliates/payouts?status=${filterStatus}`);
        const data = await res.json();
        if (data.success) setPayouts(data.affiliates);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAffiliateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao atualizar afiliado:', error);
    }
  };

  const handleUpdateCommissionStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/affiliates/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId: id, status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert('Erro ao atualizar comissão: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao atualizar comissão');
      console.error(error);
    }
  };

  const handleProcessPayout = async (affiliateId: string, payoutStatus: string, payoutNotes?: string) => {
    try {
      const response = await fetch('/api/admin/affiliates/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          affiliateId, 
          payoutStatus, 
          payoutNotes: payoutNotes || '' 
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert('Erro ao processar saque: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao processar saque');
      console.error(error);
    }
  };

  const handleSaveMaterial = async () => {
    try {
      const adminId = localStorage.getItem('userId');
      const url = editingMaterial 
        ? `/api/admin/affiliates/materials/${editingMaterial._id}`
        : '/api/admin/affiliates/materials';
      
      const method = editingMaterial ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...materialForm,
          createdBy: adminId,
        }),
      });
      
      if (res.ok) {
        setShowMaterialModal(false);
        setEditingMaterial(null);
        setMaterialForm({
          title: '',
          description: '',
          type: 'banner',
          content: '',
          imageUrl: '',
          platform: '',
          category: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao salvar material:', error);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;
    
    try {
      const res = await fetch(`/api/admin/affiliates/materials/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao excluir material:', error);
    }
  };

  const handleEditMaterial = (material: MarketingMaterial) => {
    setEditingMaterial(material);
    setMaterialForm({
      title: material.title,
      description: material.description,
      type: material.type,
      content: material.content,
      imageUrl: material.imageUrl || '',
      platform: material.platform || '',
      category: material.category,
    });
    setShowMaterialModal(true);
  };

  // Migration functions
  const handleMigrate = async () => {
    setMigrateLoading(true);
    setMigrateError('');
    setMigrateResult(null);

    try {
      const response = await fetch('/api/admin/migrate-affiliate-codes', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-secret',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMigrateResult(data);
      } else {
        setMigrateError(data.error || 'Erro na migração');
      }
    } catch (err) {
      setMigrateError('Erro ao conectar com o servidor');
    } finally {
      setMigrateLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('⚠️ Tem certeza que deseja apagar todos os registros de afiliados?\n\nEsta ação não pode ser desfeita e irá remover:\n- Todos os afiliados\n- Todas as comissões\n- Todos os cliques rastreados')) {
      return;
    }

    setResetLoading(true);
    setMigrateError('');
    setMigrateResult(null);

    try {
      const response = await fetch('/api/admin/migrate-affiliate-codes/reset', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-secret',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Registros apagados com sucesso!\n\n${data.stats.deletedAffiliates} afiliados\n${data.stats.deletedCommissions} comissões\n${data.stats.deletedClicks} cliques`);
      } else {
        setMigrateError(data.error || 'Erro ao apagar registros');
      }
    } catch (err) {
      setMigrateError('Erro ao conectar com o servidor');
    } finally {
      setResetLoading(false);
    }
  };

  // Upload function
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setUploadedImageUrl(data.url);
        setMaterialForm(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        alert('Erro ao fazer upload: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao fazer upload do arquivo');
      console.error(error);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-MZ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner':
      case 'social_media':
        return <ImageIcon className="h-4 w-4" />;
      case 'email_template':
        return <Mail className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white transition shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-700">Voltar</span>
              </Link>
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  Gestão de Afiliados
                </h1>
                <p className="text-lg text-gray-600">
                  Gerencie o programa de afiliados da WEHOSTHERE
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 px-6 py-3 rounded-xl hover:bg-white transition shadow-sm hover:shadow-md"
            >
              <RefreshCw className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Atualizar</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('affiliates')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'affiliates'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Afiliados</span>
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'commissions'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span>Comissões</span>
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'payouts'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Wallet className="h-5 w-5" />
              <span>Saques</span>
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'materials'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ImageIcon className="h-5 w-5" />
              <span>Materiais</span>
            </button>
            <button
              onClick={() => setActiveTab('migration')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'migration'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className="h-5 w-5" />
              <span>Migração</span>
            </button>
          </div>
        </div>

      {activeTab === 'affiliates' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Afiliados</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <p className="text-gray-500">Lista de afiliados será exibida aqui</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Comissões</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <p className="text-gray-500">Lista de comissões será exibida aqui</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Solicitações de Saque</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                >
                  <option value="">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="processed">Processado</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma solicitação de saque encontrada</p>
                <p className="text-gray-400 text-sm mt-1">Os saques aparecerão aqui quando os afiliados solicitarem</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{payout.userId}</p>
                          <p className="text-sm text-gray-500">{payout.payoutMethod}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payout.payoutStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        payout.payoutStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        payout.payoutStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        payout.payoutStatus === 'processed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payout.payoutStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Saldo disponível: <span className="font-semibold text-gray-900">{payout.availableBalance?.toLocaleString('pt-MZ')} MZN</span></p>
                        {payout.payoutDetails && (
                          <p className="mt-1">
                            {payout.payoutMethod === 'bank_transfer' && `${payout.payoutDetails.bankName} - ${payout.payoutDetails.accountHolder}`}
                            {payout.payoutMethod === 'paypal' && payout.payoutDetails.paypalEmail}
                            {payout.payoutMethod === 'mpesa' && payout.payoutDetails.mpesaPhone}
                          </p>
                        )}
                      </div>
                      {payout.payoutStatus === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleProcessPayout(payout._id, 'approved')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleProcessPayout(payout._id, 'rejected')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Materiais de Marketing</h2>
              <button
                onClick={() => {
                  setEditingMaterial(null);
                  setMaterialForm({
                    title: '',
                    description: '',
                    type: 'banner',
                    content: '',
                    imageUrl: '',
                    platform: '',
                    category: '',
                  });
                  setUploadedImageUrl('');
                  setShowMaterialModal(true);
                }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Material</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum material cadastrado</p>
                <p className="text-gray-400 text-sm mt-1">Clique em &quot;Novo Material&quot; para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((material) => (
                  <div key={material._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                    {material.imageUrl && (
                      <div className="h-40 bg-gray-100 overflow-hidden">
                        <img 
                          src={material.imageUrl} 
                          alt={material.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          material.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {material.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="text-xs text-gray-500">{material.type}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{material.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{material.description}</p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-sm font-medium"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material._id)}
                          className="inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition text-sm font-medium"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingMaterial ? 'Editar Material' : 'Novo Material'}
                </h3>
                <button
                  onClick={() => {
                    setShowMaterialModal(false);
                    setEditingMaterial(null);
                    setUploadedImageUrl('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ex: Banner Promocional"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descrição do material..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={materialForm.type}
                  onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="banner">Banner</option>
                  <option value="social_media">Social Media</option>
                  <option value="email_template">Email Template</option>
                  <option value="landing_page">Landing Page</option>
                  <option value="video">Vídeo</option>
                  <option value="text_ad">Texto Publicitário</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input
                  type="text"
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ex: Promoções"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma (opcional)</label>
                <input
                  type="text"
                  value={materialForm.platform}
                  onChange={(e) => setMaterialForm({ ...materialForm, platform: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ex: Instagram, Facebook"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                <textarea
                  value={materialForm.content}
                  onChange={(e) => setMaterialForm({ ...materialForm, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={4}
                  placeholder="Conteúdo do material..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                    {uploadingFile && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                    )}
                  </div>
                  
                  {materialForm.imageUrl && (
                    <div className="relative">
                      <img 
                        src={materialForm.imageUrl} 
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => {
                          setMaterialForm({ ...materialForm, imageUrl: '' });
                          setUploadedImageUrl('');
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveMaterial}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                >
                  {editingMaterial ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  onClick={() => {
                    setShowMaterialModal(false);
                    setEditingMaterial(null);
                    setUploadedImageUrl('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'migration' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 via-red-700 to-pink-700 p-6 sm:p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Migração de Códigos</h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  Atualiza códigos de afiliados do formato numérico (6 dígitos) para o novo formato baseado no nome do usuário.
                  Isso torna os links mais personalizados e fáceis de compartilhar.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleMigrate}
                disabled={migrateLoading}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white px-6 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  {migrateLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Migrando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      <span>Iniciar Migração</span>
                    </>
                  )}
                </div>
              </button>
              
              <button
                onClick={handleReset}
                disabled={resetLoading}
                className="group relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-700 hover:via-red-800 hover:to-rose-800 text-white px-6 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  {resetLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Apagando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      <span>Apagar Registros</span>
                    </>
                  )}
                </div>
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Atenção</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Apagar registros irá remover permanentemente todos os afiliados, comissões e cliques rastreados do banco de dados.
                  </p>
                </div>
              </div>
            </div>

            {migrateError && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800">Erro</p>
                    <p className="text-red-700 mt-1">{migrateError}</p>
                  </div>
                </div>
              </div>
            )}

            {migrateResult && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-800">Migração Concluída!</h3>
                    <p className="text-green-700">Processo finalizado com sucesso</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">{migrateResult.stats.total}</p>
                    <p className="text-gray-700 font-medium mt-1">Total</p>
                    <p className="text-xs text-gray-500 mt-1">Registros processados</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{migrateResult.stats.updated}</p>
                    <p className="text-gray-700 font-medium mt-1">Atualizados</p>
                    <p className="text-xs text-gray-500 mt-1">Códigos migrados</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-2xl font-bold text-gray-600">{migrateResult.stats.skipped}</p>
                    <p className="text-gray-700 font-medium mt-1">Pulados</p>
                    <p className="text-xs text-gray-500 mt-1">Já no novo formato</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Detalhes da Migração</h4>
                  <div className="bg-white rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuário</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alteração</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {migrateResult.results.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                r.status === 'updated' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {r.status === 'updated' ? '✓ Atualizado' : '○ Pulado'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {r.userName || r.userId}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {r.status === 'updated' ? (
                                <span className="text-green-600 font-medium">
                                  {r.oldCode} → {r.newCode}
                                </span>
                              ) : (
                                <span className="text-gray-500">{r.reason}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

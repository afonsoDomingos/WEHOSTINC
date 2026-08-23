'use client';

import { useState, useEffect } from 'react';
import { 
  Users, DollarSign, TrendingUp, Plus, Edit, Trash2, 
  CheckCircle2, XCircle, Clock, Filter, RefreshCw,
  Image as ImageIcon, FileText, Video, Mail, Share2
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
  const [activeTab, setActiveTab] = useState<'affiliates' | 'commissions' | 'materials'>('affiliates');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MarketingMaterial | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

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

  const handleUpdateCommissionStatus = async (commissionId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/affiliates/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          commissionId, 
          status,
          changedBy: 'admin',
          note: `Status alterado para ${status}`
        }),
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao atualizar comissão:', error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Afiliados</h1>
          <p className="text-gray-600 mt-1">Gerencie o programa de afiliados</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200">
        <button
          onClick={() => setActiveTab('affiliates')}
          className={`px-4 py-2 rounded-md transition ${
            activeTab === 'affiliates' ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Afiliados
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-2 rounded-md transition ${
            activeTab === 'commissions' ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Comissões
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-md transition ${
            activeTab === 'materials' ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Materiais de Marketing
        </button>
      </div>

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Afiliados</h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Afiliado</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Código</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ganhos</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cliques</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Conversões</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Taxa</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr key={affiliate._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{affiliate.userName}</p>
                        <p className="text-xs text-gray-500">{affiliate.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{affiliate.affiliateCode}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(affiliate.status)}`}>
                        {affiliate.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {affiliate.totalEarnings.toLocaleString('pt-MZ')} MZN
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{affiliate.totalClicks}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{affiliate.totalConversions}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{affiliate.conversionRate.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {affiliate.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateAffiliateStatus(affiliate._id, 'active')}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Aprovar"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {affiliate.status === 'active' && (
                          <button
                            onClick={() => handleUpdateAffiliateStatus(affiliate._id, 'suspended')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Suspender"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {affiliates.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      Nenhum afiliado encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Comissões</h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="paid">Pago</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ações</th>
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
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {commission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateCommissionStatus(commission._id, 'approved')}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Aprovar"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateCommissionStatus(commission._id, 'rejected')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Rejeitar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {commission.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateCommissionStatus(commission._id, 'paid')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Marcar como pago"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {commissions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Nenhuma comissão encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Materiais de Marketing</h2>
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
                setShowMaterialModal(true);
              }}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="h-5 w-5" />
              <span>Novo Material</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((material) => (
              <div key={material._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(material.type)}
                    <span className="text-xs font-medium text-gray-600 uppercase">{material.type}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${material.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                    {material.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
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
                  <span className="px-2 py-1 bg-gray-100 rounded">{material.category}</span>
                  {material.platform && (
                    <span className="px-2 py-1 bg-gray-100 rounded">{material.platform}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditMaterial(material)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(material._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Share2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum material de marketing encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="banner">Banner</option>
                    <option value="social_media">Rede Social</option>
                    <option value="email_template">Template de Email</option>
                    <option value="landing_page">Landing Page</option>
                    <option value="video">Vídeo</option>
                    <option value="text_ad">Anúncio de Texto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                  <select
                    value={materialForm.platform}
                    onChange={(e) => setMaterialForm({ ...materialForm, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Nenhuma</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="email">Email</option>
                    <option value="website">Website</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input
                  type="text"
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Promoções, Lançamentos"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (opcional)</label>
                <input
                  type="url"
                  value={materialForm.imageUrl}
                  onChange={(e) => setMaterialForm({ ...materialForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo (use [AFFILIATE_LINK] para o link do afiliado)
                </label>
                <textarea
                  value={materialForm.content}
                  onChange={(e) => setMaterialForm({ ...materialForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                  rows={6}
                  required
                  placeholder="HTML ou texto do material..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowMaterialModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMaterial}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  {editingMaterial ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

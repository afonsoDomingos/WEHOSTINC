'use client';

import { useState, useEffect } from 'react';
import { 
  Users, DollarSign, TrendingUp, Plus, Edit, Trash2, 
  CheckCircle2, XCircle, Clock, Filter, RefreshCw,
  Image as ImageIcon, FileText, Video, Mail, Share2, Wallet
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
  const [activeTab, setActiveTab] = useState<'affiliates' | 'commissions' | 'materials' | 'payouts'>('affiliates');
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

  const handleProcessPayout = async (payoutStatus: string, payoutNotes?: string) => {
    if (!selectedPayout) return;
    
    try {
      const response = await fetch('/api/admin/affiliates/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          affiliateId: selectedPayout._id, 
          payoutStatus, 
          payoutNotes 
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowPayoutModal(false);
        setSelectedPayout(null);
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
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 rounded-md transition ${
            activeTab === 'payouts' ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Saques
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-md transition ${
            activeTab === 'materials' ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Materiais
        </button>
      </div>

      {activeTab === 'affiliates' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Afiliados</h2>
          </div>
          <div className="p-6">
            {loading ? <p>Carregando...</p> : <p>Afiliados tab content</p>}
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Solicitações de Saque</h2>
          </div>
          <div className="p-6">
            {loading ? <p>Carregando...</p> : <p>Payouts tab content</p>}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ExternalLink, Image as ImageIcon, Save, X, Upload, Loader2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { dataManager, Partner } from '@/lib/data';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

export default function AdminPartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    websiteUrl: '',
    active: true
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    loadPartners();
  }, [router]);

  const loadPartners = async () => {
    await dataManager.fetchPartnersAsync();
    setPartners(dataManager.getPartners().sort((a, b) => a.order - b.order));
    setLoading(false);
  };

  const handleShowModal = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        logoUrl: partner.logoUrl,
        websiteUrl: partner.websiteUrl || '',
        active: partner.active
      });
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        logoUrl: '',
        websiteUrl: '',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPartner(null);
    setFormData({
      name: '',
      logoUrl: '',
      websiteUrl: '',
      active: true
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.logoUrl) {
      setToast({ show: true, message: 'Nome e logo são obrigatórios', type: 'error' });
      return;
    }

    if (editingPartner) {
      await dataManager.updatePartnerAsync(editingPartner.id, formData);
      setToast({ show: true, message: 'Parceiro atualizado com sucesso', type: 'success' });
    } else {
      await dataManager.createPartnerAsync(formData.name, formData.logoUrl, formData.websiteUrl);
      setToast({ show: true, message: 'Parceiro adicionado com sucesso', type: 'success' });
    }

    await loadPartners();
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    setPartnerToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (partnerToDelete) {
      await dataManager.deletePartnerAsync(partnerToDelete);
      setToast({ show: true, message: 'Parceiro removido com sucesso', type: 'success' });
      await loadPartners();
      setShowDeleteModal(false);
      setPartnerToDelete(null);
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    await dataManager.updatePartnerAsync(partner.id, { active: !partner.active });
    await loadPartners();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setToast({ show: true, message: 'Por favor, selecione apenas arquivos de imagem', type: 'error' });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ show: true, message: 'A imagem deve ter no máximo 5MB', type: 'error' });
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData({ ...formData, logoUrl: base64 });
        setUploading(false);
      };
      reader.onerror = () => {
        setToast({ show: true, message: 'Erro ao carregar imagem', type: 'error' });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setToast({ show: true, message: 'Erro ao processar imagem', type: 'error' });
      setUploading(false);
    }
  };

  const handleMoveUp = (partner: Partner) => {
    const currentIndex = partners.findIndex(p => p.id === partner.id);
    if (currentIndex > 0) {
      const newPartners = [...partners];
      [newPartners[currentIndex - 1], newPartners[currentIndex]] = [newPartners[currentIndex], newPartners[currentIndex - 1]];
      
      dataManager.updatePartner(partner.id, { order: currentIndex });
      dataManager.updatePartner(newPartners[currentIndex - 1].id, { order: currentIndex + 1 });
      loadPartners();
    }
  };

  const handleMoveDown = (partner: Partner) => {
    const currentIndex = partners.findIndex(p => p.id === partner.id);
    if (currentIndex < partners.length - 1) {
      const newPartners = [...partners];
      [newPartners[currentIndex + 1], newPartners[currentIndex]] = [newPartners[currentIndex], newPartners[currentIndex + 1]];
      
      dataManager.updatePartner(partner.id, { order: currentIndex + 2 });
      dataManager.updatePartner(newPartners[currentIndex + 1].id, { order: currentIndex + 1 });
      loadPartners();
    }
  };

  if (loading) {
    return <PageLoader text="A carregar parceiros..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BrandLogo />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gerenciar Parceiros</h1>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Voltar ao Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {partners.length} parceiro(s) cadastrado(s)
          </p>
          <button
            onClick={() => handleShowModal()}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Adicionar Parceiro</span>
          </button>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-2 transition ${
                partner.active ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {partner.logoUrl ? (
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleMoveUp(partner)}
                    disabled={partners.findIndex(p => p.id === partner.id) === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover para cima"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(partner)}
                    disabled={partners.findIndex(p => p.id === partner.id) === partners.length - 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover para baixo"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-2">{partner.name}</h3>
              
              {partner.websiteUrl && (
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm mb-4"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="truncate">{partner.websiteUrl}</span>
                </a>
              )}

              <div className="flex items-center space-x-2 mb-4">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  partner.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {partner.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleShowModal(partner)}
                  className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleToggleActive(partner)}
                  className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition ${
                    partner.active
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {partner.active ? (
                    <>
                      <X className="h-4 w-4" />
                      <span>Desativar</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Ativar</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(partner.id)}
                  className="flex items-center justify-center bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {partners.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum parceiro cadastrado</h3>
            <p className="text-gray-600 mb-4">Adicione parceiros para exibir seus logos na página inicial</p>
            <button
              onClick={() => handleShowModal()}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Adicionar Primeiro Parceiro</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPartner ? 'Editar Parceiro' : 'Adicionar Parceiro'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nome da empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo *
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {uploading && (
                      <div className="flex items-center space-x-2 text-primary-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Carregando...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">ou cole URL</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                {formData.logoUrl && (
                  <div className="mt-2 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={formData.logoUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website (opcional)
                </label>
                <input
                  type="text"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://exemplo.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Parceiro ativo
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setPartnerToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Remover Parceiro"
        message="Tem certeza que deseja remover este parceiro? Esta ação não pode ser desfeita."
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

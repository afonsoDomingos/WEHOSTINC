'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ExternalLink, Image as ImageIcon, Save, X, Loader2, ArrowLeft, CheckCircle2, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, Partner } from '@/lib/data';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import Link from 'next/link';

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
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      router.push('/login');
      return;
    }

    loadPartners();
  }, [router]);

  const loadPartners = async () => {
    try {
      const fetched = await dataManager.fetchPartnersAsync();
      setPartners((fetched || []).sort((a, b) => a.order - b.order));
    } catch (e) {
      console.error('Erro ao carregar parceiros:', e);
      setPartners(dataManager.getPartners().sort((a, b) => a.order - b.order));
    } finally {
      setLoading(false);
    }
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
    if (!formData.name.trim() || !formData.logoUrl.trim()) {
      setToast({ show: true, message: 'Nome e logo são obrigatórios', type: 'error' });
      return;
    }

    try {
      if (editingPartner) {
        await dataManager.updatePartnerAsync(editingPartner.id, formData);
        setToast({ show: true, message: 'Parceiro atualizado com sucesso', type: 'success' });
      } else {
        await dataManager.createPartnerAsync(formData.name.trim(), formData.logoUrl.trim(), formData.websiteUrl?.trim() || undefined);
        setToast({ show: true, message: 'Parceiro adicionado com sucesso', type: 'success' });
      }

      await loadPartners();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar parceiro:', error);
      setToast({ show: true, message: 'Erro ao salvar parceiro', type: 'error' });
    }
  };

  const handleDelete = (id: string) => {
    setPartnerToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (partnerToDelete) {
      try {
        await dataManager.deletePartnerAsync(partnerToDelete);
        setToast({ show: true, message: 'Parceiro removido com sucesso', type: 'success' });
        await loadPartners();
      } catch (e) {
        setToast({ show: true, message: 'Erro ao remover parceiro', type: 'error' });
      } finally {
        setShowDeleteModal(false);
        setPartnerToDelete(null);
      }
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
      await dataManager.updatePartnerAsync(partner.id, { active: !partner.active });
      await loadPartners();
      setToast({ 
        show: true, 
        message: partner.active ? 'Parceiro desativado' : 'Parceiro ativado com sucesso', 
        type: 'success' 
      });
    } catch (e) {
      setToast({ show: true, message: 'Erro ao alterar estado do parceiro', type: 'error' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ show: true, message: 'Por favor, selecione apenas arquivos de imagem', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ show: true, message: 'A imagem deve ter no máximo 5MB', type: 'error' });
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({ ...prev, logoUrl: base64 }));
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

  const handleMoveUp = async (partner: Partner) => {
    const currentIndex = partners.findIndex(p => p.id === partner.id);
    if (currentIndex > 0) {
      const targetPartner = partners[currentIndex - 1];
      const currentOrder = partner.order;
      const targetOrder = targetPartner.order;

      await dataManager.updatePartnerAsync(partner.id, { order: targetOrder });
      await dataManager.updatePartnerAsync(targetPartner.id, { order: currentOrder });
      await loadPartners();
    }
  };

  const handleMoveDown = async (partner: Partner) => {
    const currentIndex = partners.findIndex(p => p.id === partner.id);
    if (currentIndex < partners.length - 1) {
      const targetPartner = partners[currentIndex + 1];
      const currentOrder = partner.order;
      const targetOrder = targetPartner.order;

      await dataManager.updatePartnerAsync(partner.id, { order: targetOrder });
      await dataManager.updatePartnerAsync(targetPartner.id, { order: currentOrder });
      await loadPartners();
    }
  };

  if (loading) {
    return <PageLoader text="A carregar parceiros..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BrandLogo />
              <div className="h-6 w-px bg-gray-200" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>Gestão de Parceiros</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  Homepage
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin"
                className="flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Painel</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Parceiros em Destaque</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Gerencie as marcas e logotipos de empresas parceiras exibidas na página inicial.
            </p>
          </div>
          <button
            onClick={() => handleShowModal()}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm hover:shadow transition cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Parceiro</span>
          </button>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner, index) => (
            <div
              key={partner.id}
              className={`bg-white rounded-2xl p-6 border transition shadow-xs flex flex-col justify-between ${
                partner.active ? 'border-gray-200/90' : 'border-gray-200 bg-gray-50/70 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-24 h-20 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden p-2">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1 border border-gray-200/60">
                    <button
                      onClick={() => handleMoveUp(partner)}
                      disabled={index === 0}
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(partner)}
                      disabled={index === partners.length - 1}
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base text-gray-900 truncate">{partner.name}</h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    partner.active 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {partner.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-blue-600 hover:text-blue-700 text-xs font-medium mb-4 truncate max-w-full"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{partner.websiteUrl}</span>
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 italic mb-4">Sem link de website</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-100 mt-2">
                <button
                  onClick={() => handleShowModal(partner)}
                  className="flex-1 flex items-center justify-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleToggleActive(partner)}
                  className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    partner.active
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {partner.active ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Desativar</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ativar</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(partner.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Eliminar parceiro"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {partners.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-xs">
            <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum parceiro cadastrado</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Adicione os parceiros da WeHost para destacar as parcerias no rodapé da página inicial.
            </p>
            <button
              onClick={() => handleShowModal()}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Primeiro Parceiro</span>
            </button>
          </div>
        )}
      </main>

      {/* Modal Adicionar / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editingPartner ? 'Editar Parceiro' : 'Adicionar Parceiro'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Nome da Empresa / Parceiro *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Ex: MozHost, Restartmedia..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Logótipo *
                </label>
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="flex-1 text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {uploading && (
                      <div className="flex items-center space-x-1.5 text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-[11px] font-semibold">A carregar...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-400">
                      <span className="px-2 bg-white">ou insira o link da imagem</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="https://exemplo.com/logo.png ou /logo.png"
                  />
                </div>
                {formData.logoUrl && (
                  <div className="mt-3 w-24 h-20 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center p-2 overflow-hidden">
                    <img
                      src={formData.logoUrl}
                      alt="Preview do logo"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Website URL (Opcional)
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="https://empresa.com"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="partner-active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="partner-active" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Exibir parceiro publicamente na Homepage
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer shadow-sm"
              >
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setPartnerToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Remover Parceiro"
        message="Tem a certeza de que deseja remover este parceiro? A imagem deixará de ser exibida na página inicial."
        confirmText="Sim, Remover"
        cancelText="Cancelar"
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

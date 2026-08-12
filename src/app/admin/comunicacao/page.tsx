'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Send, Users, Mail, FileText, History, Plus, Edit2, Trash2, CheckCircle2, 
  XCircle, AlertCircle, Eye, RefreshCw, ArrowLeft, Search, Filter, ShieldCheck, 
  Sparkles, Layers, Check, Copy, Info, CheckSquare, Square
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager } from '@/lib/data';
import { 
  CommunicationTemplate, 
  CommunicationLog, 
  getCommunicationTemplates, 
  getCommunicationLogs, 
  saveCommunicationTemplate, 
  deleteCommunicationTemplate, 
  dispatchMessage,
  replaceTemplateVariables
} from '@/lib/notifications';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminCommunicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'manual' | 'bulk' | 'templates' | 'history') || 'manual';

  const [activeTab, setActiveTab] = useState<'manual' | 'bulk' | 'templates' | 'history'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<User[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);

  // Toast e Modais
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isConfirmingBulk, setIsConfirmingBulk] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<CommunicationTemplate> | null>(null);

  // ESTADO - ENVIO MANUAL
  const [manualClientEmail, setManualClientEmail] = useState('');
  const [manualTemplateId, setManualTemplateId] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualBody, setManualBody] = useState('');
  const [isSendingManual, setIsSendingManual] = useState(false);

  // ESTADO - ENVIO EM MASSA
  const [bulkFilter, setBulkFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'pending_payment' | 'custom'>('all');
  const [bulkSelectedEmails, setBulkSelectedEmails] = useState<string[]>([]);
  const [bulkTemplateId, setBulkTemplateId] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkBody, setBulkBody] = useState('');
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Filtro de Histórico
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'sent' | 'failed' | 'auto' | 'manual'>('all');

  useEffect(() => {
    // Verificar se o utilizador é Admin
    const currentUser = auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = () => {
    setLoading(true);
    try {
      const allUsers = auth.getUsers().filter(u => u.role !== 'admin');
      setClients(allUsers);

      const tpls = getCommunicationTemplates();
      setTemplates(tpls);

      const lgs = getCommunicationLogs();
      setLogs(lgs);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ao selecionar um template no envio manual
  const handleManualTemplateSelect = (templateId: string) => {
    setManualTemplateId(templateId);
    if (!templateId) {
      setManualSubject('');
      setManualBody('');
      return;
    }
    const found = templates.find(t => t.id === templateId);
    if (found) {
      setManualSubject(found.subject);
      setManualBody(found.body);
    }
  };

  // Ao selecionar um template no envio em massa
  const handleBulkTemplateSelect = (templateId: string) => {
    setBulkTemplateId(templateId);
    if (!templateId) {
      setBulkSubject('');
      setBulkBody('');
      return;
    }
    const found = templates.find(t => t.id === templateId);
    if (found) {
      setBulkSubject(found.subject);
      setBulkBody(found.body);
    }
  };

  // Obter destinatários do Envio em Massa com base nos filtros
  const getBulkRecipients = (): User[] => {
    if (bulkFilter === 'custom') {
      return clients.filter(c => bulkSelectedEmails.includes(c.email));
    }
    if (bulkFilter === 'active') return clients.filter(c => (c.status || 'active') === 'active');
    if (bulkFilter === 'pending') return clients.filter(c => c.status === 'pending');
    if (bulkFilter === 'suspended') return clients.filter(c => c.status === 'suspended');
    if (bulkFilter === 'pending_payment') {
      const allOrders = dataManager.getOrders();
      const pendingEmails = new Set(allOrders.filter(o => o.status === 'pending').map(o => o.clientEmail || o.userEmail || ''));
      return clients.filter(c => pendingEmails.has(c.email));
    }
    return clients; // 'all'
  };

  // Executar Envio Manual
  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientEmail) {
      setToast({ message: 'Selecione um cliente destinatário.', type: 'error' });
      return;
    }
    if (!manualSubject || !manualBody) {
      setToast({ message: 'Preencha o assunto e o corpo da mensagem.', type: 'error' });
      return;
    }

    setIsSendingManual(true);
    try {
      const client = clients.find(c => c.email === manualClientEmail);
      const res = await dispatchMessage({
        recipientEmail: manualClientEmail,
        recipientName: client?.name || manualClientEmail.split('@')[0],
        templateId: manualTemplateId || undefined,
        subject: manualSubject,
        body: manualBody,
        variables: {
          nome_cliente: client?.name || manualClientEmail.split('@')[0],
          email: manualClientEmail
        },
        isAutomatic: false
      });

      if (res.success) {
        setToast({ message: `Mensagem enviada com sucesso para ${manualClientEmail}!`, type: 'success' });
        setManualSubject('');
        setManualBody('');
        setManualTemplateId('');
        loadData();
      } else {
        setToast({ message: `Erro ao enviar: ${res.error || 'Falha no servidor.'}`, type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: `Erro ao enviar mensagem: ${err.message}`, type: 'error' });
    } finally {
      setIsSendingManual(false);
    }
  };

  // Executar Envio em Massa
  const handleSendBulk = async () => {
    const recipients = getBulkRecipients();
    if (recipients.length === 0) {
      setToast({ message: 'Nenhum cliente selecionado para o envio em massa.', type: 'error' });
      return;
    }

    setIsSendingBulk(true);
    setIsConfirmingBulk(false);

    try {
      let sentCount = 0;
      let failCount = 0;

      for (const client of recipients) {
        const res = await dispatchMessage({
          recipientEmail: client.email,
          recipientName: client.name || client.email.split('@')[0],
          templateId: bulkTemplateId || undefined,
          subject: bulkSubject,
          body: bulkBody,
          variables: {
            nome_cliente: client.name || client.email.split('@')[0],
            email: client.email
          },
          isAutomatic: false
        });

        if (res.success) sentCount++;
        else failCount++;
      }

      setToast({ 
        message: `Disparo concluído! ${sentCount} enviadas com sucesso, ${failCount} falhas.`, 
        type: sentCount > 0 ? 'success' : 'error' 
      });

      loadData();
    } catch (err: any) {
      setToast({ message: `Erro no disparo em massa: ${err.message}`, type: 'error' });
    } finally {
      setIsSendingBulk(false);
    }
  };

  // Guardar ou Editar Template
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.body) {
      setToast({ message: 'Preencha todos os campos do modelo.', type: 'error' });
      return;
    }

    try {
      saveCommunicationTemplate({
        id: editingTemplate.id || `tpl_${Date.now()}`,
        name: editingTemplate.name,
        category: editingTemplate.category || 'Geral',
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        channel: editingTemplate.channel || 'email',
        isSystem: editingTemplate.isSystem || false
      });

      setToast({ message: 'Modelo de mensagem guardado com sucesso!', type: 'success' });
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      loadData();
    } catch (err: any) {
      setToast({ message: `Erro ao guardar modelo: ${err.message}`, type: 'error' });
    }
  };

  // Eliminar Template Customizado
  const handleDeleteTemplate = (id: string) => {
    try {
      deleteCommunicationTemplate(id);
      setToast({ message: 'Modelo removido com sucesso.', type: 'info' });
      loadData();
    } catch (err: any) {
      setToast({ message: `Erro ao remover modelo: ${err.message}`, type: 'error' });
    }
  };

  // Inserir tag de variável no editor ativo
  const insertVariable = (tag: string, target: 'manual' | 'bulk' | 'template') => {
    const varTag = `{{${tag}}}`;
    if (target === 'manual') {
      setManualBody(prev => prev + ' ' + varTag);
    } else if (target === 'bulk') {
      setBulkBody(prev => prev + ' ' + varTag);
    } else if (target === 'template' && editingTemplate) {
      setEditingTemplate(prev => ({ ...prev, body: (prev?.body || '') + ' ' + varTag }));
    }
  };

  if (loading) return <PageLoader message="A carregar Central de Comunicação..." />;

  // Selecionar cliente para visualização em tempo real das variáveis no manual
  const selectedManualClient = clients.find(c => c.email === manualClientEmail);
  const previewManualSubject = replaceTemplateVariables(manualSubject, {
    nome_cliente: selectedManualClient?.name || 'João Silva',
    email: selectedManualClient?.email || 'cliente@exemplo.com',
    numero_pedido: 'PED-9842',
    valor: '2.500,00 MT',
    estado_pedido: 'Aprovado'
  });
  const previewManualBody = replaceTemplateVariables(manualBody, {
    nome_cliente: selectedManualClient?.name || 'João Silva',
    email: selectedManualClient?.email || 'cliente@exemplo.com',
    numero_pedido: 'PED-9842',
    valor: '2.500,00 MT',
    estado_pedido: 'Aprovado'
  });

  // Filtragem de Logs do Histórico
  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.recipientEmail.toLowerCase().includes(historySearch.toLowerCase()) ||
      l.recipientName.toLowerCase().includes(historySearch.toLowerCase()) ||
      l.subject.toLowerCase().includes(historySearch.toLowerCase());

    if (!matchesSearch) return false;
    if (historyFilter === 'sent') return l.status === 'sent';
    if (historyFilter === 'failed') return l.status === 'failed';
    if (historyFilter === 'auto') return l.isAutomatic;
    if (historyFilter === 'manual') return !l.isAutomatic;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal de Confirmação para Envio em Massa */}
      {isConfirmingBulk && (
        <ConfirmModal
          isOpen={isConfirmingBulk}
          title="⚠️ Confirmar Envio em Massa"
          message={`Tem a certeza de que deseja disparar esta mensagem para ${getBulkRecipients().length} clientes selecionados? Esta ação não pode ser desfeita.`}
          confirmText="Sim, Disparar Agora"
          cancelText="Cancelar"
          type="warning"
          onConfirm={handleSendBulk}
          onCancel={() => setIsConfirmingBulk(false)}
        />
      )}

      {/* Modal de Detalhes do Log do Histórico */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
              <Mail className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Detalhes da Mensagem</h3>
                <p className="text-xs text-slate-400">ID: {selectedLog.id} • {new Date(selectedLog.sentAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Destinatário:</span>
                  <span className="text-slate-200 font-medium">{selectedLog.recipientName} ({selectedLog.recipientEmail})</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Modelo Utilizado:</span>
                  <span className="text-slate-200 font-medium">{selectedLog.templateName || 'Personalizado'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Estado:</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    selectedLog.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {selectedLog.status === 'sent' ? '✅ Enviado' : '❌ Falhou'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Origem:</span>
                  <span className="text-slate-300">{selectedLog.isAutomatic ? '🤖 Automático (Evento)' : '👤 Manual (Admin)'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-semibold block mb-1">Assunto:</span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-medium text-white">
                  {selectedLog.subject}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-semibold block mb-1">Conteúdo da Mensagem:</span>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs whitespace-pre-line max-h-60 overflow-y-auto leading-relaxed">
                  {selectedLog.body}
                </div>
              </div>

              {selectedLog.error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  ⚠️ Erro Registado: {selectedLog.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Template */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              {editingTemplate?.id ? 'Editar Modelo de Mensagem' : 'Novo Modelo de Mensagem'}
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Modelo</label>
                  <input
                    type="text"
                    value={editingTemplate?.name || ''}
                    onChange={e => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Aviso de Manutenção"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={editingTemplate?.category || 'Geral'}
                    onChange={e => setEditingTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Boas-Vindas">Boas-Vindas</option>
                    <option value="Pedidos">Pedidos</option>
                    <option value="Pagamentos">Pagamentos</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Geral">Geral / Avisos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assunto do E-mail</label>
                <input
                  type="text"
                  value={editingTemplate?.subject || ''}
                  onChange={e => setEditingTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Ex: 📢 Comunicado Importante para {{nome_cliente}}"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Corpo da Mensagem (Texto / HTML)</label>
                  <span className="text-[11px] text-slate-400">Clique para inserir variável:</span>
                </div>

                {/* Toolbar de Variáveis */}
                <div className="flex flex-wrap gap-1.5 mb-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {['nome_cliente', 'email', 'numero_pedido', 'valor', 'data', 'estado_pedido', 'nome_empresa'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v, 'template')}
                      className="px-2 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors"
                    >
                      +{v}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={6}
                  value={editingTemplate?.body || ''}
                  onChange={e => setEditingTemplate(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Escreva aqui a mensagem pré-configurada..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all"
                >
                  Guardar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANNER / CABEÇALHO */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin"
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60"
                title="Voltar ao Painel Admin"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white tracking-tight">Central de Comunicação</h1>
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                    WEHOSTHERE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Envio de mensagens diretas, comunicação em massa, gestão de modelos e histórico de envios.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/50 flex items-center gap-2 text-xs font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>
          </div>

          {/* ABAS DE NAVEGAÇÃO */}
          <div className="flex gap-2 mt-8 border-b border-slate-800 overflow-x-auto custom-scrollbar pb-px">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
                activeTab === 'manual'
                  ? 'border-blue-500 bg-slate-800/60 text-blue-400 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Send className="w-4 h-4" />
              Envio Manual / Direto
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
                activeTab === 'bulk'
                  ? 'border-blue-500 bg-slate-800/60 text-blue-400 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Users className="w-4 h-4" />
              Comunicação em Massa ({clients.length})
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
                activeTab === 'templates'
                  ? 'border-blue-500 bg-slate-800/60 text-blue-400 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <FileText className="w-4 h-4" />
              Modelos de Mensagens ({templates.length})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 bg-slate-800/60 text-blue-400 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico de Mensagens ({logs.length})
            </button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL DAS ABAS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* ABA 1: ENVIO MANUAL */}
        {activeTab === 'manual' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulário de Envio */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Send className="w-5 h-5 text-blue-400" />
                Enviar Mensagem para Cliente Específico
              </h2>

              <form onSubmit={handleSendManual} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    1. Selecionar Cliente Destinatário
                  </label>
                  <select
                    value={manualClientEmail}
                    onChange={e => setManualClientEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- Escolha um Cliente da Lista --</option>
                    {clients.map(c => (
                      <option key={c.id || c.email} value={c.email}>
                        👤 {c.name || 'Sem Nome'} — ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    2. Escolher Modelo Pré-Configurado (Opcional)
                  </label>
                  <select
                    value={manualTemplateId}
                    onChange={e => handleManualTemplateSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Escrever Mensagem Livre / Sem Modelo --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        📝 [{t.category}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    3. Assunto da Mensagem
                  </label>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={e => setManualSubject(e.target.value)}
                    placeholder="Ex: Atualização importante sobre o seu serviço"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      4. Conteúdo da Mensagem
                    </label>
                    <span className="text-[11px] text-slate-400">Variáveis rápidas:</span>
                  </div>

                  {/* Toolbar de Inserção de Variáveis */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    {['nome_cliente', 'email', 'numero_pedido', 'valor', 'data', 'estado_pedido', 'nome_empresa'].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v, 'manual')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors"
                      >
                        +{v}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={8}
                    value={manualBody}
                    onChange={e => setManualBody(e.target.value)}
                    placeholder="Escreva aqui o texto da mensagem..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingManual}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSendingManual ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      A Enviar Mensagem via Resend...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Mensagem Agora →
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Painel de Pré-Visualização em Tempo Real */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Pré-visualização em Tempo Real (Substituição de Variáveis)
              </h3>

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-800 pb-3 mb-3">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Para:</span>
                    <span className="text-xs font-semibold text-blue-400">
                      {selectedManualClient ? `${selectedManualClient.name} (${selectedManualClient.email})` : 'Nenhum cliente selecionado'}
                    </span>
                  </div>

                  <div className="border-b border-slate-800 pb-3 mb-3">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Assunto:</span>
                    <span className="text-sm font-bold text-white">
                      {previewManualSubject || '— Sem Assunto —'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider mb-1">Corpo Formatado:</span>
                    <div className="text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 max-h-72 overflow-y-auto">
                      {previewManualBody || 'A pré-visualização da mensagem formatada aparecerá aqui...'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>As variáveis como <code>&#123;&#123;nome_cliente&#125;&#125;</code> são substituídas automaticamente pelos dados reais do cliente.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: ENVIO EM MASSA */}
        {activeTab === 'bulk' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="w-5 h-5 text-blue-400" />
              Comunicação em Massa para Segmentos de Clientes
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Envie anúncios, notificações de manutenção ou atualizações da plataforma para grupos selecionados de clientes.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Filtro de Segmentação */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 mb-2">Filtrar Destinatários por Segmento</label>
                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'all', label: `Todos os Clientes (${clients.length})` },
                      { key: 'active', label: `Apenas Clientes Ativos (${clients.filter(c => (c.status || 'active') === 'active').length})` },
                      { key: 'pending', label: `Clientes Pendentes (${clients.filter(c => c.status === 'pending').length})` },
                      { key: 'suspended', label: `Clientes Suspensos (${clients.filter(c => c.status === 'suspended').length})` },
                      { key: 'pending_payment', label: 'Clientes com Pagamento Pendente' },
                      { key: 'custom', label: `Seleção Manual por Caixas (${bulkSelectedEmails.length} selecionados)` }
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2 p-2 bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer border border-slate-800/60">
                        <input
                          type="radio"
                          name="bulkFilter"
                          checked={bulkFilter === opt.key}
                          onChange={() => setBulkFilter(opt.key as any)}
                          className="accent-blue-500"
                        />
                        <span className="text-slate-200 font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Seleção Manual se custom */}
                {bulkFilter === 'custom' && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-60 overflow-y-auto space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400 block mb-2">Selecione os clientes:</span>
                    {clients.map(c => (
                      <label key={c.email} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={bulkSelectedEmails.includes(c.email)}
                          onChange={e => {
                            if (e.target.checked) setBulkSelectedEmails(prev => [...prev, c.email]);
                            else setBulkSelectedEmails(prev => prev.filter(em => em !== c.email));
                          }}
                          className="rounded bg-slate-900 border-slate-700 accent-blue-500"
                        />
                        <span className="truncate">{c.name || 'Cliente'} ({c.email})</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Resumo do Destino */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300">
                  <span className="font-bold block mb-1">🎯 Destinatários Confirmados:</span>
                  Esta mensagem será enviada para <strong className="text-white font-black text-sm">{getBulkRecipients().length}</strong> clientes.
                </div>
              </div>

              {/* Formulário do Disparo */}
              <div className="lg:col-span-8 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Modelo de Mensagem em Massa</label>
                  <select
                    value={bulkTemplateId}
                    onChange={e => handleBulkTemplateSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Selecionar Modelo de Comunicado / Aviso --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        📝 [{t.category}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assunto da Mensagem em Massa</label>
                  <input
                    type="text"
                    value={bulkSubject}
                    onChange={e => setBulkSubject(e.target.value)}
                    placeholder="Ex: 📢 Comunicado Importante da WEHOSTHERE"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Conteúdo do Comunicado</label>
                    <span className="text-[11px] text-slate-400">Variáveis rápidas:</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    {['nome_cliente', 'email', 'data', 'nome_empresa'].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v, 'bulk')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors"
                      >
                        +{v}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={8}
                    value={bulkBody}
                    onChange={e => setBulkBody(e.target.value)}
                    placeholder="Escreva aqui o comunicado em massa..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsConfirmingBulk(true)}
                  disabled={isSendingBulk || getBulkRecipients().length === 0 || !bulkSubject || !bulkBody}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSendingBulk ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      A disparar mensagens em lote...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      Iniciar Envio em Massa para {getBulkRecipients().length} Clientes →
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: MODELOS DE MENSAGENS */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Modelos de Mensagens Prontas (Templates)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gerencie os modelos reutilizáveis com variáveis dinâmicas para automação e envio rápido.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTemplate({
                    name: '',
                    category: 'Geral',
                    subject: '',
                    body: '',
                    channel: 'email',
                    isSystem: false
                  });
                  setIsTemplateModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Novo Modelo
              </button>
            </div>

            {/* Lista de Cards dos Modelos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(tpl => (
                <div 
                  key={tpl.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                        {tpl.category}
                      </span>
                      {tpl.isSystem && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          Sistema (Padrão)
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-300 mt-1 line-clamp-1">
                      Assunto: {tpl.subject}
                    </p>

                    <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-slate-400 text-xs font-mono line-clamp-4 leading-relaxed">
                      {tpl.body}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setManualTemplateId(tpl.id);
                        handleManualTemplateSelect(tpl.id);
                        setActiveTab('manual');
                      }}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Usar para Enviar
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setIsTemplateModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar Modelo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!tpl.isSystem && (
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Eliminar Modelo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 4: HISTÓRICO DE MENSAGENS */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  Histórico Completo de Comunicações
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Registo de todas as mensagens disparadas automaticamente ou enviadas manualmente pelo Administrador.
                </p>
              </div>

              {/* Barra de Pesquisa e Filtros */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Pesquisar por cliente, e-mail ou assunto..."
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
                  />
                </div>

                <select
                  value={historyFilter}
                  onChange={e => setHistoryFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Todas as Mensagens</option>
                  <option value="sent">Apenas Enviadas (✅)</option>
                  <option value="failed">Apenas Falhas (❌)</option>
                  <option value="auto">🤖 Disparos Automáticos</option>
                  <option value="manual">👤 Envios Manuais</option>
                </select>
              </div>
            </div>

            {/* Tabela de Logs */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Destinatário</th>
                    <th className="py-3 px-4">Assunto</th>
                    <th className="py-3 px-4">Modelo</th>
                    <th className="py-3 px-4">Origem</th>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Nenhuma mensagem encontrada no histórico.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{log.recipientName}</span>
                          <span className="text-[11px] text-slate-400">{log.recipientEmail}</span>
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-200">
                          {log.subject}
                        </td>

                        <td className="py-3 px-4 text-slate-400">
                          {log.templateName || 'Personalizado'}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            log.isAutomatic ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {log.isAutomatic ? '🤖 Automático' : '👤 Manual'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-400">
                          {new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 font-bold ${
                            log.status === 'sent' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {log.status === 'sent' ? '✅ Enviado' : '❌ Falhou'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors font-medium text-xs"
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

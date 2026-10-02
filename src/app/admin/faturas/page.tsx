'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Plus, Edit, Trash2, Download, FileText, Calendar, DollarSign, 
  Search, User, Save, X, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import UserModel from '@/lib/models/User';
import ManualClientModel from '@/lib/models/ManualClient';
import InvoiceModel, { InvoiceItem } from '@/lib/models/Invoice';
import { soundEffects } from '@/lib/soundEffects';
import Toast from '@/components/Toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'user' | 'manual';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  issuedAt: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  dueDate?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export default function FaturasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; title?: string; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    issuedAt: new Date().toISOString().split('T')[0],
    servicePeriodStart: '',
    servicePeriodEnd: '',
    dueDate: '',
    status: 'draft' as 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled',
    paymentMethod: '',
    notes: '',
    items: [] as InvoiceItem[],
    discount: 0
  });

  // New item form
  const [newItem, setNewItem] = useState({
    service: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      // Carregar clientes (Users e ManualClients)
      const [usersRes, manualClientsRes, invoicesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/manual-clients'),
        fetch('/api/invoices')
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
      const manualClientsData = manualClientsRes.ok ? await manualClientsRes.json() : { clients: [] };
      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : { invoices: [] };

      const allCustomers: Customer[] = [
        ...(usersData.users || []).map((u: any) => ({ ...u, type: 'user' as const })),
        ...(manualClientsData.clients || []).map((c: any) => ({ ...c, type: 'manual' as const }))
      ];

      setCustomers(allCustomers);
      setInvoices(invoicesData.invoices || []);
      setLoading(false);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      setToastMsg({ type: 'error', message: 'Erro ao carregar dados' });
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || ''
      });
    }
  };

  const handleAddItem = () => {
    if (!newItem.service || !newItem.description || newItem.unitPrice <= 0) {
      setToastMsg({ type: 'error', message: 'Preencha todos os campos do item' });
      return;
    }

    const subtotal = (newItem.quantity * newItem.unitPrice) - newItem.discount;
    const item: InvoiceItem = {
      service: newItem.service,
      description: newItem.description,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      discount: newItem.discount,
      subtotal
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    setNewItem({ service: '', description: '', quantity: 1, unitPrice: 0, discount: 0 });
    soundEffects.playSuccessSound();
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal - formData.discount;
    return { subtotal, total };
  };

  const handleSubmit = async () => {
    if (!formData.customerId || formData.items.length === 0) {
      setToastMsg({ type: 'error', message: 'Selecione um cliente e adicione pelo menos um item' });
      return;
    }

    try {
      const { subtotal, total } = calculateTotals();
      const payload = {
        ...formData,
        subtotal,
        total,
        items: formData.items
      };

      let res;
      if (editingInvoice) {
        res = await fetch('/api/invoices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingInvoice.id, ...payload })
        });
      } else {
        res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setToastMsg({ type: 'success', message: editingInvoice ? 'Fatura atualizada!' : 'Fatura criada!' });
        setShowModal(false);
        setEditingInvoice(null);
        resetForm();
        loadData();
        soundEffects.playSuccessSound();
      } else {
        const error = await res.json();
        setToastMsg({ type: 'error', message: error.error || 'Erro ao salvar fatura' });
      }
    } catch (e) {
      console.error('Erro ao salvar fatura:', e);
      setToastMsg({ type: 'error', message: 'Erro ao salvar fatura' });
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone || '',
      issuedAt: invoice.issuedAt.split('T')[0],
      servicePeriodStart: invoice.servicePeriodStart?.split('T')[0] || '',
      servicePeriodEnd: invoice.servicePeriodEnd?.split('T')[0] || '',
      dueDate: invoice.dueDate?.split('T')[0] || '',
      status: invoice.status,
      paymentMethod: invoice.paymentMethod || '',
      notes: invoice.notes || '',
      items: invoice.items,
      discount: invoice.discount
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return;

    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToastMsg({ type: 'success', message: 'Fatura excluída!' });
        loadData();
        soundEffects.playDeleteEmailSound();
      } else {
        setToastMsg({ type: 'error', message: 'Erro ao excluir fatura' });
      }
    } catch (e) {
      console.error('Erro ao excluir fatura:', e);
      setToastMsg({ type: 'error', message: 'Erro ao excluir fatura' });
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fatura-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        soundEffects.playSuccessSound();
      } else {
        setToastMsg({ type: 'error', message: 'Erro ao baixar PDF' });
      }
    } catch (e) {
      console.error('Erro ao baixar PDF:', e);
      setToastMsg({ type: 'error', message: 'Erro ao baixar PDF' });
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      issuedAt: new Date().toISOString().split('T')[0],
      servicePeriodStart: '',
      servicePeriodEnd: '',
      dueDate: '',
      status: 'draft',
      paymentMethod: '',
      notes: '',
      items: [],
      discount: 0
    });
    setNewItem({ service: '', description: '', quantity: 1, unitPrice: 0, discount: 0 });
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig = {
    draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800', icon: FileText },
    pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-800', icon: Clock },
    paid: { label: 'Pago', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600', icon: X }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Faturas</h1>
            <p className="text-sm text-gray-500">Criar e gerenciar faturas manuais</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingInvoice(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center space-x-2 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Nova Fatura</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, email ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todos os Status</option>
            <option value="draft">Rascunho</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="overdue">Vencido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma fatura encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data Emissão</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => {
                    const config = statusConfig[invoice.status];
                    const StatusIcon = config.icon;
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{invoice.customerName}</div>
                          <div className="text-xs text-gray-500">{invoice.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(invoice.issuedAt).toLocaleDateString('pt-MZ')}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {invoice.total.toLocaleString('pt-MZ')} MT
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleDownloadPdf(invoice.id)}
                              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Baixar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(invoice)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingInvoice ? 'Editar Fatura' : 'Nova Fatura'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInvoice(null);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  required
                >
                  <option value="" className="text-gray-400">Selecione um cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id} className="text-gray-900">
                      {customer.name} ({customer.email}) {customer.type === 'manual' ? '[Manual]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Emissão</label>
                  <input
                    type="date"
                    value={formData.issuedAt}
                    onChange={(e) => setFormData({ ...formData, issuedAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Vencimento</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Início do Período</label>
                  <input
                    type="date"
                    value={formData.servicePeriodStart}
                    onChange={(e) => setFormData({ ...formData, servicePeriodStart: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fim do Período</label>
                  <input
                    type="date"
                    value={formData.servicePeriodEnd}
                    onChange={(e) => setFormData({ ...formData, servicePeriodEnd: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Status e Método de Pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Vencido</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  >
                    <option value="" className="text-gray-400">Selecione</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="emola">eMola</option>
                    <option value="card">Cartão</option>
                    <option value="bank_transfer">Transferência Bancária</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              {/* Itens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Itens da Fatura</label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.service}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                        <div className="text-xs text-gray-400">
                          {item.quantity} x {item.unitPrice.toLocaleString('pt-MZ')} MT
                          {item.discount > 0 && ` - ${item.discount.toLocaleString('pt-MZ')} MT`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="font-semibold text-gray-900">
                          {item.subtotal.toLocaleString('pt-MZ')} MT
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Adicionar Item */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-3 border-t">
                    <input
                      type="text"
                      placeholder="Serviço"
                      value={newItem.service}
                      onChange={(e) => setNewItem({ ...newItem, service: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="Qtd"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Preço"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                      min="0"
                    />
                    <button
                      onClick={handleAddItem}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition"
                    >
                      <Plus className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Desconto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desconto Total (MT)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  min="0"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  rows={3}
                />
              </div>

              {/* Totais */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{calculateTotals().subtotal.toLocaleString('pt-MZ')} MT</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Desconto:</span>
                    <span className="font-medium">-{formData.discount.toLocaleString('pt-MZ')} MT</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-emerald-600">{calculateTotals().total.toLocaleString('pt-MZ')} MT</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInvoice(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingInvoice ? 'Atualizar' : 'Criar Fatura'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <Toast
          type={toastMsg.type}
          title={toastMsg.title}
          message={toastMsg.message}
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
  );
}

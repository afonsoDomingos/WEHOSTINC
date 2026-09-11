/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, DollarSign, Users, Calendar, CheckCircle, XCircle, AlertCircle, Plus, Edit, Trash2, Search, Filter, Download, TrendingUp, Clock, Eye, X
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import PageLoader from '@/components/PageLoader';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

interface MonthlyPayment {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  year: number;
  month: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  installments?: {
    total: number;
    paid: number;
    installmentAmount: number;
  };
  isManualClient?: boolean;
  source?: 'webhook' | 'manual';
  createdAt: string;
}

interface ManualClient {
  id: string;
  name: string;
  email: string;
  plan: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

interface UnpaidClient {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  isManual: boolean;
  owesAmount: number;
  hasPayment: boolean;
  paymentStatus: 'none' | 'partial';
  totalPaid?: number;
  totalExpected?: number;
}

export default function MonthlyPaymentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Dados
  const [clients, setClients] = useState<User[]>([]);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [manualClients, setManualClients] = useState<ManualClient[]>([]);

  // Estados da UI
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'clients'>('overview');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'pending' | 'overdue' | 'none'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'M-Pesa' | 'Transferência' | 'Cartão' | 'Dinheiro'>('all');
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'platform' | 'manual'>('all');
  const [paymentSourceFilter, setPaymentSourceFilter] = useState<'all' | 'webhook' | 'manual'>('all');
  const [installmentFilter, setInstallmentFilter] = useState<'all' | 'installments' | 'single'>('all');
  const [minAmountFilter, setMinAmountFilter] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('');

  // Modal de edição/adição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<MonthlyPayment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<MonthlyPayment | null>(null);
  
  // Modal de adicionar cliente manual
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ManualClient | null>(null);
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    plan: '',
    phone: '',
    address: ''
  });

  // Formulário
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    paidAmount: '',
    paymentDate: '',
    paymentMethod: '',
    status: 'pending' as 'paid' | 'partial' | 'pending' | 'overdue',
    notes: '',
    isInstallment: false,
    totalInstallments: '',
    currentInstallment: ''
  });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadData();
    setLoading(false);
  }, [router]);

  const loadData = async () => {
    try {
      const allUsers = await auth.fetchUsersAsync();
      setClients((allUsers || []).filter((u: User) => u.role !== 'admin' && u.role !== 'super_admin'));

      // Carregar pagamentos do MongoDB
      try {
        const paymentsRes = await fetch('/api/monthly-payments');
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          const mongoPayments = data.payments || [];
          setPayments(mongoPayments);
          localStorage.setItem('monthlyPayments', JSON.stringify(mongoPayments));
          console.log('Pagamentos carregados do MongoDB:', mongoPayments.length);
        } else {
          console.warn('API de pagamentos retornou erro:', paymentsRes.status);
          throw new Error('API error');
        }
      } catch (e) {
        console.warn('Erro ao carregar pagamentos do MongoDB, usando localStorage:', e);
        const storedPayments = localStorage.getItem('monthlyPayments');
        if (storedPayments) {
          const localPayments = JSON.parse(storedPayments);
          setPayments(localPayments);
          console.log('Pagamentos carregados do localStorage:', localPayments.length);
        } else {
          setPayments([]);
          console.log('Nenhum pagamento encontrado no localStorage');
        }
      }

      // Carregar clientes manuais do MongoDB
      try {
        const clientsRes = await fetch('/api/manual-clients');
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          const mongoClients = data.clients || [];
          setManualClients(mongoClients);
          localStorage.setItem('manualClients', JSON.stringify(mongoClients));
          console.log('Clientes manuais carregados do MongoDB:', mongoClients.length);
        } else {
          console.warn('API de clientes manuais retornou erro:', clientsRes.status);
          throw new Error('API error');
        }
      } catch (e) {
        console.warn('Erro ao carregar clientes manuais do MongoDB, usando localStorage:', e);
        const storedManualClients = localStorage.getItem('manualClients');
        if (storedManualClients) {
          const localClients = JSON.parse(storedManualClients);
          setManualClients(localClients);
          console.log('Clientes manuais carregados do localStorage:', localClients.length);
        } else {
          setManualClients([]);
          console.log('Nenhum cliente manual encontrado no localStorage');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const savePayments = (newPayments: MonthlyPayment[]) => {
    setPayments(newPayments);
    localStorage.setItem('monthlyPayments', JSON.stringify(newPayments));
  };

  const saveManualClients = (newClients: ManualClient[]) => {
    setManualClients(newClients);
    localStorage.setItem('manualClients', JSON.stringify(newClients));
  };

  // Combinar clientes da plataforma com clientes manuais
  const allClients = [
    ...clients.map(c => ({
      id: c.id || c.email,
      name: c.name || 'Sem Nome',
      email: c.email,
      plan: c.plan || 'N/A',
      status: c.status || 'active',
      isManual: false
    })),
    ...manualClients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      plan: c.plan,
      status: 'active',
      isManual: true
    }))
  ];

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = [2024, 2025, 2026, 2027];

  // Helper function to get expected amount based on plan
  const getExpectedAmountForPlan = (plan: string): number => {
    const planAmounts: { [key: string]: number } = {
      'Básico': 5000,
      'Padrão': 10000,
      'Premium': 20000,
      'Enterprise': 50000
    };
    return planAmounts[plan] || 0;
  };

  const filteredPayments = payments.filter(payment => {
    const matchesYear = payment.year === selectedYear;
    const matchesMonth = payment.month === selectedMonth;
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesSearch =
      payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaymentMethod = paymentMethodFilter === 'all' || payment.paymentMethod === paymentMethodFilter;
    const matchesClientType = clientTypeFilter === 'all' ||
      (clientTypeFilter === 'platform' && !payment.isManualClient) ||
      (clientTypeFilter === 'manual' && payment.isManualClient);
    const matchesInstallment = installmentFilter === 'all' ||
      (installmentFilter === 'installments' && payment.installments) ||
      (installmentFilter === 'single' && !payment.installments);
    const matchesMinAmount = minAmountFilter === '' || payment.amount >= parseFloat(minAmountFilter);
    const matchesClient = selectedClientFilter === '' || payment.clientId === selectedClientFilter;
    const matchesPaymentSource = paymentSourceFilter === 'all' || payment.source === paymentSourceFilter;

    return matchesYear && matchesMonth && matchesStatus && matchesSearch &&
           matchesPaymentMethod && matchesClientType && matchesInstallment &&
           matchesMinAmount && matchesClient && matchesPaymentSource;
  });

  const unpaidClients = allClients.map(client => {
    const clientPayments = payments.filter(
      p => p.clientId === client.id &&
      p.year === selectedYear &&
      p.month === selectedMonth
    );

    if (clientPayments.length === 0) {
      // No payment at all - client owes full amount (based on plan or default)
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        plan: client.plan,
        status: client.status,
        isManual: client.isManual,
        owesAmount: client.plan ? getExpectedAmountForPlan(client.plan) : 0,
        hasPayment: false,
        paymentStatus: 'none' as const
      };
    }

    // Has payments - check if fully paid
    const totalPaid = clientPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalExpected = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = totalExpected - totalPaid;

    if (remainingAmount > 0) {
      // Partial payment - still owes money
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        plan: client.plan,
        status: client.status,
        isManual: client.isManual,
        owesAmount: remainingAmount,
        hasPayment: true,
        paymentStatus: 'partial' as const,
        totalPaid,
        totalExpected
      };
    }

    // Fully paid
    return null;
  }).filter((client): client is NonNullable<typeof client> => client !== null);

  // Apply filters to unpaid clients
  const filteredUnpaidClients = unpaidClients.filter(client => {
    const matchesClientType = clientTypeFilter === 'all' ||
      (clientTypeFilter === 'platform' && !client.isManual) ||
      (clientTypeFilter === 'manual' && client.isManual);
    const matchesPaymentStatus = statusFilter === 'all' ||
      (statusFilter === 'none' && client.paymentStatus === 'none') ||
      (statusFilter === 'partial' && client.paymentStatus === 'partial');
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClientType && matchesPaymentStatus && matchesSearch;
  });

  const totalCollected = payments
    .filter(p => p.year === selectedYear && p.month === selectedMonth && (p.status === 'paid' || p.status === 'partial'))
    .reduce((sum, p) => sum + p.paidAmount, 0);

  const totalPending = payments
    .filter(p => p.year === selectedYear && p.month === selectedMonth)
    .reduce((sum, p) => {
      if (p.status === 'pending') {
        // Pagamento pendente: soma o valor total
        return sum + p.amount;
      } else if (p.status === 'partial') {
        // Pagamento parcial: soma o valor restante
        return sum + p.remainingAmount;
      } else if (p.status === 'overdue') {
        // Pagamento atrasado: soma o valor total (considera como pendente)
        return sum + p.amount;
      }
      return sum;
    }, 0);

  const handleAddPayment = () => {
    setEditingPayment(null);
    setFormData({
      clientId: '',
      amount: '',
      paidAmount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      status: 'paid',
      notes: '',
      isInstallment: false,
      totalInstallments: '',
      currentInstallment: ''
    });
    setIsModalOpen(true);
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setClientFormData({
      name: '',
      email: '',
      plan: '',
      phone: '',
      address: ''
    });
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: ManualClient) => {
    setEditingClient(client);
    setClientFormData({
      name: client.name,
      email: client.email,
      plan: client.plan,
      phone: client.phone || '',
      address: client.address || ''
    });
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientFormData.name || !clientFormData.email) {
      setToast({ message: 'Nome e email são obrigatórios!', type: 'error' });
      return;
    }

    try {
      if (editingClient) {
        // Editar cliente existente
        const response = await fetch('/api/manual-clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingClient.id,
            ...clientFormData
          })
        });

        if (response.ok) {
          const data = await response.json();
          const updatedClients = manualClients.map(c =>
            c.id === editingClient.id ? data.client : c
          );
          // Atualizar estado e localStorage apenas, API já foi chamada
          setManualClients(updatedClients);
          localStorage.setItem('manualClients', JSON.stringify(updatedClients));
          setToast({ message: 'Cliente atualizado com sucesso!', type: 'success' });
        } else {
          throw new Error('Erro ao atualizar cliente');
        }
      } else {
        // Criar novo cliente
        const response = await fetch('/api/manual-clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientFormData)
        });

        if (response.ok) {
          const data = await response.json();
          const newClients = [...manualClients, data.client];
          // Atualizar estado e localStorage apenas, API já foi chamada
          setManualClients(newClients);
          localStorage.setItem('manualClients', JSON.stringify(newClients));
          setToast({ message: 'Cliente adicionado com sucesso!', type: 'success' });
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar cliente');
        }
      }

      setIsClientModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setToast({ message: 'Erro ao salvar cliente. Tente novamente.', type: 'error' });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja eliminar este cliente?')) return;

    try {
      const response = await fetch(`/api/manual-clients?id=${clientId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const newClients = manualClients.filter(c => c.id !== clientId);
        saveManualClients(newClients);
        setToast({ message: 'Cliente eliminado com sucesso!', type: 'success' });
      } else {
        // Fallback para localStorage se API falhar
        const newClients = manualClients.filter(c => c.id !== clientId);
        saveManualClients(newClients);
        setToast({ message: 'Cliente eliminado (localStorage)', type: 'success' });
      }
    } catch (error) {
      console.error('Erro ao eliminar cliente:', error);
      // Fallback para localStorage
      const newClients = manualClients.filter(c => c.id !== clientId);
      saveManualClients(newClients);
      setToast({ message: 'Cliente eliminado (localStorage)', type: 'success' });
    }
  };

  const handleEditPayment = (payment: MonthlyPayment) => {
    setEditingPayment(payment);
    setFormData({
      clientId: payment.clientId,
      amount: payment.amount.toString(),
      paidAmount: payment.paidAmount?.toString() || '',
      paymentDate: payment.paymentDate || '',
      paymentMethod: payment.paymentMethod || '',
      status: payment.status,
      notes: payment.notes || '',
      isInstallment: !!payment.installments,
      totalInstallments: payment.installments?.total?.toString() || '',
      currentInstallment: payment.installments?.paid?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const handleViewPayment = (payment: MonthlyPayment) => {
    setViewingPayment(payment);
    setIsViewModalOpen(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    const newPayments = payments.filter(p => p.id !== paymentId);
    savePayments(newPayments);

    // Tentar eliminar do MongoDB
    try {
      await fetch(`/api/monthly-payments?id=${paymentId}`, {
        method: 'DELETE'
      });
      console.log('Pagamento eliminado do MongoDB');
    } catch (e) {
      console.warn('Erro ao eliminar pagamento do MongoDB:', e);
    }

    setToast({ message: 'Pagamento eliminado com sucesso!', type: 'success' });
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const client = allClients.find(c => c.id === formData.clientId);
    if (!client) {
      setToast({ message: 'Cliente não encontrado!', type: 'error' });
      return;
    }

    const totalAmount = parseFloat(formData.amount);
    const paidAmount = formData.paidAmount ? parseFloat(formData.paidAmount) : totalAmount;
    const remainingAmount = totalAmount - paidAmount;

    // Determine status based on payment - only override if user selected paid/partial
    let paymentStatus = formData.status;

    // Only auto-calculate status if it's paid/partial and user didn't manually set it
    if (formData.status === 'paid' || formData.status === 'partial') {
      if (formData.isInstallment) {
        paymentStatus = 'partial';
      } else if (paidAmount > 0 && paidAmount < totalAmount) {
        paymentStatus = 'partial';
      } else if (paidAmount === totalAmount) {
        paymentStatus = 'paid';
      } else if (paidAmount === 0) {
        paymentStatus = 'pending';
      }
    }
    // If user selected pending or overdue, respect that choice

    const paymentData: MonthlyPayment = {
      id: editingPayment?.id || `pay_${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      year: selectedYear,
      month: selectedMonth,
      amount: totalAmount,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      status: paymentStatus,
      paymentDate: formData.paymentDate,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      installments: formData.isInstallment ? {
        total: parseInt(formData.totalInstallments),
        paid: parseInt(formData.currentInstallment),
        installmentAmount: totalAmount / parseInt(formData.totalInstallments)
      } : undefined,
      isManualClient: client.isManual,
      source: editingPayment?.source || 'manual',
      createdAt: editingPayment?.createdAt || new Date().toISOString()
    };

    let newPayments;
    if (editingPayment) {
      // Editar pagamento existente - chamar API PUT primeiro
      try {
        const response = await fetch('/api/monthly-payments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData)
        });
        if (response.ok) {
          console.log('Pagamento atualizado no MongoDB:', paymentData.id);
        } else {
          console.warn('Erro ao atualizar pagamento no MongoDB:', response.status);
        }
      } catch (e) {
        console.warn('Erro ao atualizar pagamento no MongoDB:', e);
      }
      newPayments = payments.map(p => p.id === editingPayment.id ? paymentData : p);
    } else {
      // Criar novo pagamento - chamar API POST primeiro
      try {
        const response = await fetch('/api/monthly-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData)
        });
        if (response.ok) {
          console.log('Pagamento criado no MongoDB:', paymentData.id);
        } else {
          console.warn('Erro ao criar pagamento no MongoDB:', response.status);
        }
      } catch (e) {
        console.warn('Erro ao criar pagamento no MongoDB:', e);
      }
      newPayments = [...payments, paymentData];
    }

    // Atualizar estado e localStorage
    setPayments(newPayments);
    localStorage.setItem('monthlyPayments', JSON.stringify(newPayments));
    setIsModalOpen(false);
    setToast({ message: editingPayment ? 'Pagamento atualizado!' : 'Pagamento adicionado!', type: 'success' });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      partial: 'bg-blue-100 text-blue-700 border-blue-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      overdue: 'bg-red-100 text-red-700 border-red-200'
    };
    const labels = {
      paid: 'Pago',
      partial: 'Parcial',
      pending: 'Pendente',
      overdue: 'Atrasado'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) return <PageLoader text="A carregar Gestão de Pagamentos..." />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white border-b border-gray-200/80 shadow-2xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin"
                className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all border border-gray-200/80 cursor-pointer"
                title="Voltar ao Painel Admin"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestão de Pagamentos Mensais</h1>
                  <span className="bg-blue-50 text-blue-700 text-xs font-extrabold px-3 py-1 rounded-full border border-blue-200">
                    WEHOSTHERE
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Controle de pagamentos mensais, status de clientes e relatórios financeiros.
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 border-b border-gray-100 overflow-x-auto no-scrollbar pb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
                activeTab === 'overview'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Visão Geral
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
                activeTab === 'payments'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Pagamentos ({filteredPayments.length})
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
                activeTab === 'clients'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Clientes Não Pagos ({unpaidClients.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Ano</label>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Mês</label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="paid">Pagos</option>
                    <option value="partial">Parciais</option>
                    <option value="pending">Pendentes</option>
                    <option value="overdue">Atrasados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Método de Pagamento</label>
                  <select
                    value={paymentMethodFilter}
                    onChange={e => setPaymentMethodFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipo de Cliente</label>
                  <select
                    value={clientTypeFilter}
                    onChange={e => setClientTypeFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="platform">Plataforma</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Origem do Pagamento</label>
                  <select
                    value={paymentSourceFilter}
                    onChange={e => setPaymentSourceFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="webhook">Webhook (M-Pesa)</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Pagamento</label>
                  <select
                    value={installmentFilter}
                    onChange={e => setInstallmentFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="installments">Parcelados</option>
                    <option value="single">Único</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Valor Mínimo (MT)</label>
                  <input
                    type="number"
                    value={minAmountFilter}
                    onChange={e => setMinAmountFilter(e.target.value)}
                    placeholder="Ex: 1000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Cliente Específico</label>
                  <select
                    value={selectedClientFilter}
                    onChange={e => setSelectedClientFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">Todos</option>
                    {allClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Nome ou email..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black">{totalCollected.toLocaleString('pt-MZ')} MT</span>
                </div>
                <p className="text-emerald-100 text-sm">Total Arrecadado</p>
                <p className="text-xs text-emerald-200 mt-1">{months[selectedMonth - 1]} {selectedYear}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black">{totalPending.toLocaleString('pt-MZ')} MT</span>
                </div>
                <p className="text-amber-100 text-sm">Total Pendente</p>
                <p className="text-xs text-amber-200 mt-1">{unpaidClients.length} clientes não pagaram</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black">{allClients.length}</span>
                </div>
                <p className="text-blue-100 text-sm">Total de Clientes</p>
                <p className="text-xs text-blue-200 mt-1">{filteredPayments.length} pagamentos registrados</p>
              </div>
            </div>

            {/* Unpaid Clients Alert */}
            {unpaidClients.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-bold text-red-900">Clientes Não Pagaram em {months[selectedMonth - 1]} {selectedYear}</h3>
                  </div>
                  <button
                    onClick={handleAddClient}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Cliente Manual
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unpaidClients.slice(0, 6).map(client => (
                    <div key={client.id} className="bg-white p-4 rounded-xl border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-gray-900">{client.name}</p>
                        {client.isManual && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Manual</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{client.email}</p>
                      <p className="text-xs text-gray-500">{client.plan}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Deve</p>
                          <p className="font-bold text-red-600">{client.owesAmount.toLocaleString('pt-MZ')} MT</p>
                        </div>
                        {client.paymentStatus === 'partial' && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Pago</p>
                            <p className="font-bold text-emerald-600">{client.totalPaid.toLocaleString('pt-MZ')} MT</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setFormData({
                              clientId: client.id,
                              amount: client.paymentStatus === 'partial' ? client.totalExpected.toString() : '',
                              paidAmount: client.paymentStatus === 'partial' ? client.owesAmount.toString() : '',
                              paymentDate: new Date().toISOString().split('T')[0],
                              paymentMethod: '',
                              status: client.paymentStatus === 'partial' ? 'partial' : 'paid',
                              notes: '',
                              isInstallment: false,
                              totalInstallments: '',
                              currentInstallment: ''
                            });
                            setIsModalOpen(true);
                          }}
                          className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          {client.paymentStatus === 'partial' ? 'Adicionar Pagamento' : 'Registrar Pagamento'}
                        </button>
                        {client.isManual && (
                          <>
                            <button
                              onClick={() => {
                                const manualClient = manualClients.find(c => c.id === client.id);
                                if (manualClient) {
                                  handleEditClient(manualClient);
                                }
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {unpaidClients.length > 6 && (
                  <p className="text-sm text-red-700 mt-3">
                    E mais {unpaidClients.length - 6} clientes não listados. Vá para a aba &quot;Clientes Não Pagos&quot; para ver todos.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Pagamentos Registrados</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleAddClient}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Cliente
                </button>
                <button
                  onClick={handleAddPayment}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Pagamento
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Ano</label>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Mês</label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="paid">Pagos</option>
                    <option value="partial">Parciais</option>
                    <option value="pending">Pendentes</option>
                    <option value="overdue">Atrasados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Método de Pagamento</label>
                  <select
                    value={paymentMethodFilter}
                    onChange={e => setPaymentMethodFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipo de Cliente</label>
                  <select
                    value={clientTypeFilter}
                    onChange={e => setClientTypeFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="platform">Plataforma</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Origem do Pagamento</label>
                  <select
                    value={paymentSourceFilter}
                    onChange={e => setPaymentSourceFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="webhook">Webhook (M-Pesa)</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Pagamento</label>
                  <select
                    value={installmentFilter}
                    onChange={e => setInstallmentFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="installments">Parcelados</option>
                    <option value="single">Único</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Valor Mínimo (MT)</label>
                  <input
                    type="number"
                    value={minAmountFilter}
                    onChange={e => setMinAmountFilter(e.target.value)}
                    placeholder="Ex: 1000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Cliente Específico</label>
                  <select
                    value={selectedClientFilter}
                    onChange={e => setSelectedClientFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">Todos</option>
                    {allClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Buscar por Nome ou Email</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Digite nome ou email..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Valor Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Pago</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Restante</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Data Pagamento</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Método</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        Nenhum pagamento encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{payment.clientName}</p>
                            <p className="text-sm text-gray-500">{payment.clientEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {payment.amount.toLocaleString('pt-MZ')} MT
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          {payment.paidAmount.toLocaleString('pt-MZ')} MT
                        </td>
                        <td className="px-6 py-4 font-bold text-red-600">
                          {payment.remainingAmount.toLocaleString('pt-MZ')} MT
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('pt-MZ') : '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {payment.paymentMethod || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(payment.status)}
                          {payment.installments && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {payment.installments.paid}/{payment.installments.total}x
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewPayment(payment)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleEditPayment(payment)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja eliminar este pagamento?')) {
                                  handleDeletePayment(payment.id);
                                }
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Clientes Não Pagaram</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleAddClient}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Cliente
                </button>
                <span className="text-sm text-gray-600">{filteredUnpaidClients.length} clientes</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipo de Cliente</label>
                  <select
                    value={clientTypeFilter}
                    onChange={e => setClientTypeFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="platform">Plataforma</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Status Pagamento</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="none">Não Pagou</option>
                    <option value="partial">Parcial</option>
                  </select>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Buscar por Nome ou Email</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Digite nome ou email..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Plano</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Deve</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUnpaidClients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                        Todos os clientes pagaram este mês! 🎉
                      </td>
                    </tr>
                  ) : (
                    filteredUnpaidClients.map(client => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">{client.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">{client.email}</div>
                          {client.isManual ? (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-purple-100 text-purple-700 border-purple-200">
                              Manual
                            </span>
                          ) : (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-100 text-blue-700 border-blue-200">
                              Plataforma
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {client.plan}
                        </td>
                        <td className="px-4 py-3 font-bold text-red-600 text-sm">
                          {client.owesAmount.toLocaleString('pt-MZ')} MT
                          {client.paymentStatus === 'partial' && (
                            <div className="text-[10px] text-blue-600 font-normal">
                              ({client.totalPaid.toLocaleString('pt-MZ')} MT pago)
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setFormData({
                                  clientId: client.id,
                                  amount: client.paymentStatus === 'partial' ? client.totalExpected.toString() : '',
                                  paidAmount: client.paymentStatus === 'partial' ? client.owesAmount.toString() : '',
                                  paymentDate: new Date().toISOString().split('T')[0],
                                  paymentMethod: '',
                                  status: client.paymentStatus === 'partial' ? 'partial' : 'paid',
                                  notes: '',
                                  isInstallment: false,
                                  totalInstallments: '',
                                  currentInstallment: ''
                                });
                                setIsModalOpen(true);
                              }}
                              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              {client.paymentStatus === 'partial' ? 'Adicionar' : 'Registrar'}
                            </button>
                            {client.isManual && (
                              <>
                                <button
                                  onClick={() => {
                                    const manualClient = manualClients.find(c => c.id === client.id);
                                    if (manualClient) {
                                      handleEditClient(manualClient);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit className="w-3 h-3 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="p-1.5 hover:bg-red-100 rounded-lg transition cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Modal Adicionar/Editar Pagamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingPayment ? 'Editar Pagamento' : 'Adicionar Pagamento'}
            </h3>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Cliente</label>
                <select
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  <optgroup label="Clientes da Plataforma">
                    {clients.map(client => (
                      <option key={client.id || client.email} value={client.id || client.email}>
                        {client.name || 'Sem Nome'} ({client.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Clientes Manuais">
                    {manualClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email}) - Manual
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Valor Total (MT)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Ex: 5000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Valor Pago (MT)</label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={e => setFormData({ ...formData, paidAmount: e.target.value })}
                  placeholder="Ex: 2500 (deixe vazio se pago total)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isInstallment"
                  checked={formData.isInstallment}
                  onChange={e => setFormData({ ...formData, isInstallment: e.target.checked })}
                  className="accent-blue-600"
                />
                <label htmlFor="isInstallment" className="text-xs font-bold text-gray-700">
                  Pagamento em Parcelas
                </label>
              </div>

              {formData.isInstallment && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Total de Parcelas</label>
                    <input
                      type="number"
                      value={formData.totalInstallments}
                      onChange={e => setFormData({ ...formData, totalInstallments: e.target.value })}
                      placeholder="Ex: 3"
                      min="2"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Parcela Atual</label>
                    <input
                      type="number"
                      value={formData.currentInstallment}
                      onChange={e => setFormData({ ...formData, currentInstallment: e.target.value })}
                      placeholder="Ex: 1"
                      min="1"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Data de Pagamento</label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Método de Pagamento</label>
                <select
                  value={formData.paymentMethod}
                  onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="">Selecione</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="paid">Pago</option>
                  <option value="partial">Parcial</option>
                  <option value="pending">Pendente</option>
                  <option value="overdue">Atrasado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition cursor-pointer"
                >
                  {editingPayment ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalhes */}
      {isViewModalOpen && viewingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-6">Detalhes do Pagamento</h3>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Cliente</p>
                <p className="font-bold text-gray-900">{viewingPayment.clientName}</p>
                <p className="text-sm text-gray-600">{viewingPayment.clientEmail}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Valor Total</p>
                  <p className="font-bold text-gray-900">{viewingPayment.amount.toLocaleString('pt-MZ')} MT</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Valor Pago</p>
                  <p className="font-bold text-emerald-600">{viewingPayment.paidAmount.toLocaleString('pt-MZ')} MT</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Restante</p>
                  <p className="font-bold text-red-600">{viewingPayment.remainingAmount.toLocaleString('pt-MZ')} MT</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {getStatusBadge(viewingPayment.status)}
                </div>
              </div>

              {viewingPayment.installments && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-xs text-purple-600 mb-1 font-bold">Pagamento em Parcelas</p>
                  <p className="font-bold text-purple-900">
                    Parcela {viewingPayment.installments.paid} de {viewingPayment.installments.total}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Data Pagamento</p>
                  <p className="font-bold text-gray-900">
                    {viewingPayment.paymentDate ? new Date(viewingPayment.paymentDate).toLocaleDateString('pt-MZ') : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Método</p>
                  <p className="font-bold text-gray-900">{viewingPayment.paymentMethod || '-'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Período</p>
                <p className="font-bold text-gray-900">{months[viewingPayment.month - 1]} {viewingPayment.year}</p>
              </div>

              {viewingPayment.notes && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Notas</p>
                  <p className="text-sm text-gray-700">{viewingPayment.notes}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Registrado em</p>
                <p className="text-sm text-gray-700">{new Date(viewingPayment.createdAt).toLocaleString('pt-MZ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Cliente Manual */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsClientModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingClient ? 'Editar Cliente Manual' : 'Adicionar Cliente Manual'}
            </h3>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nome do Cliente *</label>
                <input
                  type="text"
                  value={clientFormData.name}
                  onChange={e => setClientFormData({ ...clientFormData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={clientFormData.email}
                  onChange={e => setClientFormData({ ...clientFormData, email: e.target.value })}
                  placeholder="Ex: joao@exemplo.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Plano</label>
                <input
                  type="text"
                  value={clientFormData.plan}
                  onChange={e => setClientFormData({ ...clientFormData, plan: e.target.value })}
                  placeholder="Ex: Basic, Pro, Enterprise"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Telefone</label>
                <input
                  type="text"
                  value={clientFormData.phone}
                  onChange={e => setClientFormData({ ...clientFormData, phone: e.target.value })}
                  placeholder="Ex: +258 84 123 4567"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Endereço</label>
                <textarea
                  value={clientFormData.address}
                  onChange={e => setClientFormData({ ...clientFormData, address: e.target.value })}
                  placeholder="Endereço completo..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition cursor-pointer"
                >
                  Adicionar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
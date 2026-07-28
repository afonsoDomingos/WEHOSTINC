// Simulação de dados para MVP
// Em produção, usar banco de dados real

export interface Site {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  storage: number;
  bandwidth: number;
}

export interface EmailAccount {
  id: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  storage: number;
}

export interface HostingPlan {
  id: string;
  name: string;
  price: number;
  features: {
    sites: number;
    emails: number;
    storage: number;
    bandwidth: string;
    ssl: boolean;
    cdn: boolean;
  };
}

export const hostingPlans: HostingPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 1200,
    features: {
      sites: 1,
      emails: 5,
      storage: 10,
      bandwidth: 'Ilimitado',
      ssl: false,
      cdn: false
    }
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 3000,
    features: {
      sites: 5,
      emails: 20,
      storage: 50,
      bandwidth: 'Ilimitado',
      ssl: true,
      cdn: false
    }
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 6200,
    features: {
      sites: -1, // -1 significa ilimitado
      emails: -1,
      storage: 200,
      bandwidth: 'Ilimitado',
      ssl: true,
      cdn: true
    }
  },
  {
    id: 'website_creation',
    name: 'Criação de Site Profissional',
    price: 25000,
    features: {
      sites: 1,
      emails: -1,
      storage: 100,
      bandwidth: 'Ilimitado',
      ssl: true,
      cdn: true
    }
  }
];

// Simulação de armazenamento em localStorage
const SITES_KEY = 'wehosthere_sites';
const EMAILS_KEY = 'wehosthere_emails';

export const dataManager = {
  // Sites
  getSites: (): Site[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(SITES_KEY);
    return data ? JSON.parse(data) : [];
  },

  addSite: (site: Omit<Site, 'id' | 'createdAt'>): Site => {
    const sites = dataManager.getSites();
    const newSite: Site = {
      ...site,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    sites.push(newSite);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SITES_KEY, JSON.stringify(sites));
    }
    return newSite;
  },

  deleteSite: (id: string): void => {
    const sites = dataManager.getSites().filter(s => s.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SITES_KEY, JSON.stringify(sites));
    }
  },

  // Emails
  getEmails: (): EmailAccount[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(EMAILS_KEY);
    return data ? JSON.parse(data) : [];
  },

  addEmail: (email: Omit<EmailAccount, 'id' | 'createdAt'>): EmailAccount => {
    const emails = dataManager.getEmails();
    const newEmail: EmailAccount = {
      ...email,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    emails.push(newEmail);
    if (typeof window !== 'undefined') {
      localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));
    }
    return newEmail;
  },

  deleteEmail: (id: string): void => {
    const emails = dataManager.getEmails().filter(e => e.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));
    }
  },

  // Pedidos de Serviços
  getOrders: (): ServiceOrder[] => {
    if (typeof window === 'undefined') return DEFAULT_ORDERS;
    const data = localStorage.getItem('wehosthere_orders');
    return data ? JSON.parse(data) : DEFAULT_ORDERS;
  },

  addOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt'>): ServiceOrder => {
    const orders = dataManager.getOrders();
    const newOrder: ServiceOrder = {
      ...order,
      id: `ORD-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString()
    };
    orders.unshift(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_orders', JSON.stringify(orders));
    }
    return newOrder;
  },

  updateOrderStatus: (id: string, status: ServiceOrder['status']): void => {
    const orders = dataManager.getOrders().map(o => o.id === id ? { ...o, status } : o);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_orders', JSON.stringify(orders));
    }
  }
};

export interface ServiceOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  amount: number;
  paymentMethod: 'mpesa' | 'emola' | 'card';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
}

const DEFAULT_ORDERS: ServiceOrder[] = [
  {
    id: 'ORD-98214',
    clientName: 'MSServices',
    clientEmail: 'info@msservices.co.mz',
    clientPhone: '+258 84 123 4567',
    serviceName: 'Criação de Site Profissional',
    amount: 25000,
    paymentMethod: 'mpesa',
    status: 'in_progress',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ORD-97410',
    clientName: 'Afonso Domingos',
    clientEmail: 'afonso@wehostinc.co.mz',
    clientPhone: '+258 85 987 6543',
    serviceName: 'Plano Hospedagem Profissional',
    amount: 3000,
    paymentMethod: 'mpesa',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

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
    price: 19,
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
    price: 49,
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
    price: 99,
    features: {
      sites: -1, // -1 significa ilimitado
      emails: -1,
      storage: 200,
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
    localStorage.setItem(SITES_KEY, JSON.stringify(sites));
    return newSite;
  },

  deleteSite: (id: string): void => {
    const sites = dataManager.getSites().filter(s => s.id !== id);
    localStorage.setItem(SITES_KEY, JSON.stringify(sites));
  },

  // Emails
  getEmails: (): EmailAccount[] => {
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
    localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));
    return newEmail;
  },

  deleteEmail: (id: string): void => {
    const emails = dataManager.getEmails().filter(e => e.id !== id);
    localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));
  }
};

import { auth } from './auth';

export interface Site {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  storage: number;
  bandwidth: number;
  userEmail?: string;
}

export interface EmailAccount {
  id: string;
  email: string;
  domain?: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  storage: number;
  userEmail?: string;
}

export interface HostingPlan {
  id: string;
  name: string;
  price: number;
  priceAnnual: number;
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
    price: 550,
    priceAnnual: 5500,
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
    price: 2500,
    priceAnnual: 25000,
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
    priceAnnual: 62000,
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
    priceAnnual: 25000,
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

export interface WebsiteType {
  id: string;
  name: string;
  emoji: string;
  shortDesc: string;
  description: string;
  examples: string[];
  basePrice: number;
  priceNote: string;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  deliveryDays: number;
}

export const websiteTypes: WebsiteType[] = [
  {
    id: 'institutional',
    name: 'Website Institucional',
    emoji: '🏢',
    shortDesc: 'Apresentação da empresa, equipa e serviços',
    description: 'Apresenta uma empresa, organização ou profissional. Inclui serviços, equipa, contactos, localização e portfólio.',
    examples: ['Página de Sobre', 'Serviços', 'Equipa', 'Portfólio', 'Contactos', 'Localização'],
    basePrice: 25000,
    priceNote: 'Investimento único',
    complexity: 'simple',
    deliveryDays: 14
  },
  {
    id: 'ecommerce',
    name: 'Loja Virtual (E-commerce)',
    emoji: '🛒',
    shortDesc: 'Venda de produtos e serviços online',
    description: 'Venda de produtos e serviços online com carrinho de compras, pagamentos, gestão de encomendas e stock.',
    examples: ['Catálogo de produtos', 'Carrinho', 'Pagamentos M-Pesa/eMola', 'Gestão de stock', 'Encomendas'],
    basePrice: 65000,
    priceNote: 'Investimento único',
    complexity: 'complex',
    deliveryDays: 30
  },
  {
    id: 'webapp',
    name: 'Sistema Web (Aplicação)',
    emoji: '⚙️',
    shortDesc: 'Plataformas para automatizar processos empresariais',
    description: 'Plataformas personalizadas para automatizar processos internos ou externos da sua empresa.',
    examples: ['CRM', 'ERP', 'Gestão Escolar', 'Gestão Hospitalar', 'Sistema de Empréstimos', 'Gestão Empresarial'],
    basePrice: 150000,
    priceNote: 'Preço sob orçamento',
    complexity: 'enterprise',
    deliveryDays: 90
  },
  {
    id: 'landing',
    name: 'Landing Page',
    emoji: '🎯',
    shortDesc: 'Página focada numa única ação ou campanha',
    description: 'Página focada numa única ação. Ideal para campanhas de marketing, geração de leads e venda de produtos.',
    examples: ['Geração de leads', 'Venda de produto', 'Campanha de marketing', 'Captura de emails'],
    basePrice: 12000,
    priceNote: 'Investimento único',
    complexity: 'simple',
    deliveryDays: 7
  },
  {
    id: 'saas',
    name: 'Website de Assinaturas (SaaS)',
    emoji: '💻',
    shortDesc: 'Software acessado pela internet via subscrição',
    description: 'Software acessado pela internet mediante subscrição mensal ou anual.',
    examples: ['CRM', 'Faturação', 'Gestão Financeira', 'Automação', 'Gestão de Projetos'],
    basePrice: 200000,
    priceNote: 'Preço sob orçamento',
    complexity: 'enterprise',
    deliveryDays: 120
  },
  {
    id: 'realestate',
    name: 'Website Imobiliário',
    emoji: '🏠',
    shortDesc: 'Venda e arrendamento de imóveis online',
    description: 'Plataforma para venda e arrendamento de imóveis com pesquisa avançada, filtros e mapas.',
    examples: ['Listagem de imóveis', 'Pesquisa avançada', 'Filtros', 'Mapas', 'Contacto com consultores'],
    basePrice: 75000,
    priceNote: 'Investimento único',
    complexity: 'complex',
    deliveryDays: 45
  },
  {
    id: 'events',
    name: 'Website de Eventos',
    emoji: '🎪',
    shortDesc: 'Divulgação, bilhetes e inscrições para eventos',
    description: 'Divulgação e gestão de eventos com venda de bilhetes, inscrições online, check-in com QR Code e emissão de certificados.',
    examples: ['Venda de bilhetes', 'Inscrições', 'Check-in QR Code', 'Certificados', 'Agenda de eventos'],
    basePrice: 55000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 30
  },
  {
    id: 'elearning',
    name: 'Plataforma de Cursos (E-learning)',
    emoji: '🎓',
    shortDesc: 'Venda e gestão de cursos online',
    description: 'Plataforma para venda e gestão de cursos online com vídeos, avaliações, certificados e acompanhamento de alunos.',
    examples: ['Cursos em vídeo', 'Avaliações', 'Certificados', 'Acompanhamento de alunos', 'Pagamentos'],
    basePrice: 90000,
    priceNote: 'Investimento único',
    complexity: 'complex',
    deliveryDays: 60
  },
  {
    id: 'health',
    name: 'Website de Saúde',
    emoji: '🏥',
    shortDesc: 'Clínicas, hospitais e laboratórios online',
    description: 'Plataforma digital para clínicas, hospitais e laboratórios com agendamento de consultas, resultados de exames e telemedicina.',
    examples: ['Agendamento de consultas', 'Resultados de exames', 'Telemedicina', 'Perfil de médicos'],
    basePrice: 80000,
    priceNote: 'Investimento único',
    complexity: 'complex',
    deliveryDays: 45
  },
  {
    id: 'tourism',
    name: 'Website de Turismo',
    emoji: '✈️',
    shortDesc: 'Hotéis, agências e reservas online',
    description: 'Plataforma para hotéis, agências de viagens e passeios com reservas online.',
    examples: ['Reservas online', 'Galeria de destinos', 'Listagem de pacotes', 'Pagamento', 'Avaliações'],
    basePrice: 60000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 30
  },
  {
    id: 'education',
    name: 'Website Educacional',
    emoji: '📚',
    shortDesc: 'Escolas, universidades e centros de formação',
    description: 'Plataforma digital para escolas, universidades e centros de formação com matrículas e área do aluno.',
    examples: ['Matrículas online', 'Área do aluno', 'Calendário escolar', 'Notícias', 'Corpo docente'],
    basePrice: 55000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 30
  },
  {
    id: 'jobs',
    name: 'Website de Empregos',
    emoji: '💼',
    shortDesc: 'Divulgação de vagas e candidaturas online',
    description: 'Plataforma para divulgação de vagas, candidaturas online e gestão de currículos.',
    examples: ['Listagem de vagas', 'Candidaturas online', 'Gestão de currículos', 'Alertas de emprego'],
    basePrice: 50000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 21
  },
  {
    id: 'portfolio',
    name: 'Portfólio',
    emoji: '🎨',
    shortDesc: 'Apresentação de trabalhos para freelancers',
    description: 'Apresentação de trabalhos. Muito utilizado por freelancers e profissionais criativos.',
    examples: ['Galeria de trabalhos', 'Sobre mim', 'Serviços', 'Contacto', 'Blog'],
    basePrice: 15000,
    priceNote: 'Investimento único',
    complexity: 'simple',
    deliveryDays: 10
  },
  {
    id: 'blog',
    name: 'Blog',
    emoji: '✍️',
    shortDesc: 'Publicação de artigos e marketing de conteúdo',
    description: 'Plataforma para publicação de artigos com SEO e marketing de conteúdo.',
    examples: ['Publicação de artigos', 'Categorias', 'SEO', 'Comentários', 'Newsletter'],
    basePrice: 18000,
    priceNote: 'Investimento único',
    complexity: 'simple',
    deliveryDays: 10
  },
  {
    id: 'streaming',
    name: 'Website de Streaming',
    emoji: '📺',
    shortDesc: 'Vídeos, música e transmissões ao vivo',
    description: 'Plataforma de streaming de vídeos, música e transmissões ao vivo com sistema de assinaturas.',
    examples: ['Player de vídeo', 'Músicas', 'Live streaming', 'Assinaturas', 'Biblioteca de conteúdos'],
    basePrice: 120000,
    priceNote: 'Preço sob orçamento',
    complexity: 'enterprise',
    deliveryDays: 90
  },
  {
    id: 'news',
    name: 'Portal de Notícias',
    emoji: '📰',
    shortDesc: 'Notícias organizadas por categorias',
    description: 'Portal de notícias organizadas por categorias com publicidade e assinaturas.',
    examples: ['Notícias por categoria', 'Publicidade', 'Assinaturas', 'Comentários', 'Pesquisa'],
    basePrice: 45000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 25
  },
  {
    id: 'government',
    name: 'Website Governamental',
    emoji: '🏛️',
    shortDesc: 'Serviços públicos e informações institucionais',
    description: 'Plataforma para serviços públicos com formulários e informações institucionais.',
    examples: ['Serviços públicos', 'Formulários online', 'Informações', 'Notícias oficiais', 'Documentos'],
    basePrice: 85000,
    priceNote: 'Preço sob orçamento',
    complexity: 'complex',
    deliveryDays: 60
  },
  {
    id: 'ngo',
    name: 'Website de ONGs e Associações',
    emoji: '🤝',
    shortDesc: 'Projetos sociais, doações e voluntariado',
    description: 'Plataforma para organizações sociais com projetos, doações online e programas de voluntariado.',
    examples: ['Projetos sociais', 'Doações online', 'Voluntariado', 'Relatórios', 'Galeria'],
    basePrice: 30000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 21
  }
];

// Simulação de armazenamento em localStorage
export interface SecurityLog {
  id: string;
  email: string;
  type: 'failed_login' | 'account_locked' | 'suspended_attempt';
  message: string;
  createdAt: string;
}

const SECURITY_LOGS_KEY = 'wehosthere_security_logs';
const SITES_KEY = 'wehosthere_sites';
const EMAILS_KEY = 'wehosthere_emails';

// Returns a user-specific email storage key to strictly isolate accounts per user
const getEmailsKey = (userEmail?: string): string => {
  if (userEmail) return `wehosthere_emails_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return EMAILS_KEY;
};

// Clears email data that doesn't belong to the current user from shared localStorage
const cleanupStaleEmails = (currentUserEmail: string): void => {
  if (typeof window === 'undefined') return;
  // Remove old shared key data that may contain other users' emails
  const sharedData = localStorage.getItem(EMAILS_KEY);
  if (sharedData) {
    try {
      const all: EmailAccount[] = JSON.parse(sharedData);
      // Keep only emails that strictly belong to current user
      const mine = all.filter(e => e.userEmail && e.userEmail.toLowerCase() === currentUserEmail.toLowerCase());
      // Move them to user-specific key
      const userKey = getEmailsKey(currentUserEmail);
      const existing = localStorage.getItem(userKey);
      const existingEmails: EmailAccount[] = existing ? JSON.parse(existing) : [];
      // Merge without duplicates
      const merged = [...existingEmails];
      mine.forEach(m => {
        if (!merged.find(e => e.email.toLowerCase() === m.email.toLowerCase())) {
          merged.push(m);
        }
      });
      localStorage.setItem(userKey, JSON.stringify(merged));
    } catch { /* ignore */ }
  }
};

export const dataManager = {
  // Sites
  getSites: (userEmail?: string): Site[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(SITES_KEY);
    const sites: Site[] = data ? JSON.parse(data) : [];
    if (userEmail) {
      const cleanEmail = userEmail.trim().toLowerCase();
      // ISOLAMENTO ESTRITO: Apenas sites pertencentes ao e-mail deste cliente
      return sites.filter(s => s.userEmail && s.userEmail.trim().toLowerCase() === cleanEmail);
    }
    return sites;
  },

  fetchSitesAsync: async (currentUserEmail?: string): Promise<Site[]> => {
    try {
      const res = await fetch('/api/sites');
      if (res.ok) {
        const data = await res.json();
        if (data.sites && Array.isArray(data.sites)) {
          const serverSites: Site[] = data.sites;
          const localSites = dataManager.getSites();

          const localSiteMap = new Map<string, Site>();
          localSites.forEach(s => {
            const key = (s.domain || s.id).toLowerCase();
            if (!s.userEmail && currentUserEmail) {
              s.userEmail = currentUserEmail;
            }
            localSiteMap.set(key, s);
          });

          const serverKeySet = new Set(serverSites.map(s => (s.domain || s.id).toLowerCase()));

          const updatedSites: Site[] = serverSites.map(serverSite => {
            const key = (serverSite.domain || serverSite.id).toLowerCase();
            const localMatch = localSiteMap.get(key);
            if (localMatch) {
              if (currentUserEmail) {
                // CLIENT: servidor tem prioridade — aprovações do admin propagam-se instantaneamente
                return {
                  ...localMatch,
                  ...serverSite,
                  status: serverSite.status || localMatch.status || 'pending',
                  userEmail: serverSite.userEmail || localMatch.userEmail || currentUserEmail
                };
              } else {
                // ADMIN: localStorage local tem prioridade — mudanças manuais do admin persistem mesmo após restart do servidor
                const effectiveStatus = localMatch.status || serverSite.status || 'pending';
                // Ressincronizar com o servidor se houver discordância
                if (serverSite.status !== effectiveStatus) {
                  fetch('/api/sites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'update_status',
                      siteId: serverSite.id,
                      domain: serverSite.domain,
                      status: effectiveStatus,
                      userEmail: localMatch.userEmail || serverSite.userEmail
                    })
                  }).catch(() => {});
                }
                return {
                  ...serverSite,
                  ...localMatch,
                  status: effectiveStatus,
                  userEmail: serverSite.userEmail || localMatch.userEmail
                };
              }
            }
            return {
              ...serverSite,
              userEmail: serverSite.userEmail || currentUserEmail
            };
          });

          // Preserve locally created sites that have not synced to server yet and auto-sync them
          localSites.forEach(localSite => {
            const key = (localSite.domain || localSite.id).toLowerCase();
            if (!serverKeySet.has(key)) {
              updatedSites.push(localSite);

              fetch('/api/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ site: localSite })
              }).catch(() => {});
            }
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem(SITES_KEY, JSON.stringify(updatedSites));
          }

          if (currentUserEmail) {
            const cleanUserEmail = currentUserEmail.trim().toLowerCase();
            // ISOLAMENTO ESTRITO: Retorna apenas sites pertencentes a este cliente
            return updatedSites.filter(s => s.userEmail && s.userEmail.trim().toLowerCase() === cleanUserEmail);
          }
          return updatedSites;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar sites da API:', e);
    }
    return currentUserEmail ? dataManager.getSites(currentUserEmail) : dataManager.getSites();
  },


  addSite: (site: Omit<Site, 'id' | 'createdAt'>): Site => {
    const cleanDomain = site.domain.trim().toLowerCase();
    
    // Trava de unicidade global de domínio
    const allSites = dataManager.getSites();
    const existing = allSites.find(s => s.domain.trim().toLowerCase() === cleanDomain);
    if (existing) {
      throw new Error(`O domínio "${site.domain}" já se encontra registado na plataforma por outro cliente. Se este domínio pertence à sua organização, entre em contacto com o suporte.`);
    }

    const currentUser = typeof window !== 'undefined' ? auth.getCurrentUser() : null;
    const sites = dataManager.getSites();
    const newSite: Site = {
      ...site,
      domain: cleanDomain,
      userEmail: site.userEmail || currentUser?.email,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    sites.push(newSite);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SITES_KEY, JSON.stringify(sites));

      fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: newSite })
      }).catch(err => console.error('Erro de sync de site no servidor:', err));
    }
    return newSite;
  },

  deleteSite: (id: string, domain?: string): void => {
    const targetDomain = (domain || id).toLowerCase();
    const sites = dataManager.getSites().filter(
      s => s.id !== id && (s.domain || '').toLowerCase() !== targetDomain
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem(SITES_KEY, JSON.stringify(sites));

      fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', siteId: id, domain: targetDomain })
      }).catch(err => console.error('Erro de exclusão de site no servidor:', err));

      // Auto-delete any associated emails for this domain locally and on server
      if (targetDomain) {
        // 1. Local cascade delete
        const emails = dataManager.getEmails();
        const emailsToDelete = emails.filter(e => {
          const domainOfEmail = e.email.includes('@') ? e.email.split('@')[1].toLowerCase() : '';
          return domainOfEmail === targetDomain || e.email.toLowerCase().endsWith(`@${targetDomain}`);
        });
        emailsToDelete.forEach(e => {
          dataManager.deleteEmail(e.id, e.userEmail, e.email);
        });

        // 2. Server API cascade delete for all emails of this domain
        fetch('/api/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', domain: targetDomain })
        }).catch(err => console.error('Erro de exclusão de emails do domínio no servidor:', err));
      }
    }
  },


  updateSiteStatus: (id: string, status: Site['status']): void => {
    const sites = dataManager.getSites().map(s => 
      (s.id === id || (s.domain && s.domain.toLowerCase() === id.toLowerCase())) ? { ...s, status } : s
    );
    const targetSite = sites.find(s => s.id === id || (s.domain && s.domain.toLowerCase() === id.toLowerCase()));

    if (typeof window !== 'undefined') {
      localStorage.setItem(SITES_KEY, JSON.stringify(sites));

      fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_status', 
          siteId: id, 
          domain: targetSite?.domain || id, 
          status,
          userEmail: targetSite?.userEmail
        })
      }).catch(err => console.error('Erro de sync de status de site:', err));
    }
  },

  // Emails - uses per-user key for strict isolation
  getEmails: (userEmail?: string): EmailAccount[] => {
    if (typeof window === 'undefined') return [];
    if (userEmail) {
      // Use user-specific key for strict isolation
      const userKey = getEmailsKey(userEmail);
      const data = localStorage.getItem(userKey);
      return data ? JSON.parse(data) : [];
    }
    // Fallback: read from shared key (admin use)
    const data = localStorage.getItem(EMAILS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Initialize email storage for a user (call on login)
  initUserEmails: (userEmail: string): void => {
    if (typeof window === 'undefined') return;
    cleanupStaleEmails(userEmail);
  },

  fetchEmailsAsync: async (currentUserEmail?: string): Promise<EmailAccount[]> => {
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        if (data.emails && Array.isArray(data.emails)) {
          const serverEmails: EmailAccount[] = data.emails;

          if (currentUserEmail) {
            const cleanUserEmail = currentUserEmail.trim().toLowerCase();
            // STRICT ISOLATION: Only process emails that strictly belong to this user
            const myServerEmails = serverEmails.filter(
              e => e.userEmail && e.userEmail.trim().toLowerCase() === cleanUserEmail
            );

            const userKey = getEmailsKey(currentUserEmail);
            const localData = localStorage.getItem(userKey);
            const localEmails: EmailAccount[] = localData ? JSON.parse(localData) : [];

            const updated: EmailAccount[] = [];
            const processedKeys = new Set<string>();

            // 1. Preservar TODOS os e-mails locais criados (incluindo 'pending') e atualizar com dados do servidor
            localEmails.forEach(local => {
              const key = local.email.toLowerCase();
              processedKeys.add(key);

              const serverMatch = myServerEmails.find(
                s => s.email.toLowerCase() === key || s.id === local.id
              );

              if (serverMatch) {
                updated.push({
                  ...local,
                  ...serverMatch,
                  status: serverMatch.status || local.status,
                  userEmail: serverMatch.userEmail || local.userEmail || currentUserEmail
                });
              } else {
                // Preservar e-mail local pendente/criado e ressincronizar com a API do servidor
                updated.push(local);

                fetch('/api/emails', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: local })
                }).catch(() => {});
              }
            });

            // 2. Adicionar e-mails do servidor que ainda não constam no localStorage local
            myServerEmails.forEach(serverEmail => {
              const key = serverEmail.email.toLowerCase();
              if (!processedKeys.has(key)) {
                updated.push(serverEmail);
              }
            });

            localStorage.setItem(userKey, JSON.stringify(updated));

            // Sincronizar também no storage global do Admin para visibilidade imediata
            const sharedData = localStorage.getItem(EMAILS_KEY);
            const sharedEmails: EmailAccount[] = sharedData ? JSON.parse(sharedData) : [];
            const sharedMap = new Map<string, EmailAccount>();
            sharedEmails.forEach(e => sharedMap.set(e.email.toLowerCase(), e));
            updated.forEach(e => sharedMap.set(e.email.toLowerCase(), e));
            localStorage.setItem(EMAILS_KEY, JSON.stringify(Array.from(sharedMap.values())));

            return updated;
          }

          // Admin use: merge server emails with local — local status has priority (admin decisions persist)
          if (typeof window !== 'undefined') {
            const localAdminEmails: EmailAccount[] = JSON.parse(localStorage.getItem(EMAILS_KEY) || '[]');
            const localAdminMap = new Map<string, EmailAccount>();
            localAdminEmails.forEach(e => localAdminMap.set(e.email.toLowerCase(), e));

            const merged: EmailAccount[] = serverEmails.map(serverEmail => {
              const key = serverEmail.email.toLowerCase();
              const localMatch = localAdminMap.get(key);
              if (localMatch) {
                const effectiveStatus = localMatch.status || serverEmail.status || 'pending';
                // Re-sync server if admin had a different status stored locally
                if (serverEmail.status !== effectiveStatus) {
                  fetch('/api/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_status', emailId: serverEmail.id, emailStr: serverEmail.email, status: effectiveStatus })
                  }).catch(() => {});
                }
                return { ...serverEmail, ...localMatch, status: effectiveStatus };
              }
              return serverEmail;
            });

            // Preserve local emails not in server yet
            localAdminEmails.forEach(local => {
              if (!serverEmails.find(s => s.email.toLowerCase() === local.email.toLowerCase())) {
                merged.push(local);
                fetch('/api/emails', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: local })
                }).catch(() => {});
              }
            });

            localStorage.setItem(EMAILS_KEY, JSON.stringify(merged));
            return merged;
          }
          return serverEmails;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar e-mails da API:', e);
    }
    return currentUserEmail ? dataManager.getEmails(currentUserEmail) : dataManager.getEmails();
  },

  addEmail: (email: Omit<EmailAccount, 'id' | 'createdAt'>): EmailAccount => {
    const userEmailOwner = email.userEmail;
    const targetAddress = email.email.trim().toLowerCase();
    const allEmails = dataManager.getEmails();
    const exists = allEmails.find(e => e.email.trim().toLowerCase() === targetAddress);
    if (exists) {
      throw new Error(`A conta de e-mail "${email.email}" já se encontra registada no sistema. Por favor, escolha outro prefixo ou endereço.`);
    }

    const emails = userEmailOwner ? dataManager.getEmails(userEmailOwner) : dataManager.getEmails();
    const newEmail: EmailAccount = {
      ...email,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    emails.push(newEmail);
    if (typeof window !== 'undefined') {
      // Save to user-specific key if we know the owner
      const storageKey = userEmailOwner ? getEmailsKey(userEmailOwner) : EMAILS_KEY;
      localStorage.setItem(storageKey, JSON.stringify(emails));

      // Also add to shared EMAILS_KEY for admin visibility
      const sharedData = localStorage.getItem(EMAILS_KEY);
      const sharedEmails: EmailAccount[] = sharedData ? JSON.parse(sharedData) : [];
      if (!sharedEmails.find(e => e.email.toLowerCase() === newEmail.email.toLowerCase())) {
        sharedEmails.push(newEmail);
        localStorage.setItem(EMAILS_KEY, JSON.stringify(sharedEmails));
      }

      fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      }).catch(err => console.error('Erro de sync de e-mail no servidor:', err));
    }
    return newEmail;
  },

  deleteEmail: (id: string, ownerEmail?: string, emailStr?: string): void => {
    const targetEmailStr = (emailStr || '').toLowerCase();
    
    if (typeof window !== 'undefined') {
      // 1. Delete from user-specific storage (if ownerEmail is known)
      if (ownerEmail) {
        const userKey = getEmailsKey(ownerEmail);
        const userEmails: EmailAccount[] = JSON.parse(localStorage.getItem(userKey) || '[]');
        const filteredUser = userEmails.filter(e => e.id !== id && (!targetEmailStr || e.email.toLowerCase() !== targetEmailStr));
        localStorage.setItem(userKey, JSON.stringify(filteredUser));
      }

      // 2. Scan ALL localStorage keys for user-specific email stores and purge from each
      // This ensures deletion propagates even if ownerEmail is unknown
      const keysToCheck: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wehosthere_emails_')) {
          keysToCheck.push(key);
        }
      }
      keysToCheck.forEach(key => {
        try {
          const stored: EmailAccount[] = JSON.parse(localStorage.getItem(key) || '[]');
          const filtered = stored.filter(e => e.id !== id && (!targetEmailStr || e.email.toLowerCase() !== targetEmailStr));
          if (filtered.length !== stored.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch { /* ignore */ }
      });

      // 3. Delete from shared storage (admin key)
      const sharedData = localStorage.getItem(EMAILS_KEY);
      if (sharedData) {
        const sharedEmails: EmailAccount[] = JSON.parse(sharedData);
        const filteredShared = sharedEmails.filter(e => e.id !== id && (!targetEmailStr || e.email.toLowerCase() !== targetEmailStr));
        localStorage.setItem(EMAILS_KEY, JSON.stringify(filteredShared));
      }

      // 4. Delete from Server API
      fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', emailId: id, emailStr: targetEmailStr })
      }).catch(err => console.error('Erro de exclusão de e-mail no servidor:', err));
    }
  },


  updateEmail: (id: string, updates: Partial<EmailAccount>): EmailAccount | null => {
    const emails = dataManager.getEmails();
    const index = emails.findIndex(e => e.id === id || e.email === id);
    if (index !== -1) {
      emails[index] = { ...emails[index], ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));

        fetch('/api/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emails[index] })
        }).catch(err => console.error('Erro de sync de e-mail:', err));
      }
      return emails[index];
    }
    return null;
  },

  updateEmailStatus: (id: string, status: EmailAccount['status']): void => {
    const sharedEmails = dataManager.getEmails().map(e => 
      (e.id === id || (e.email && e.email.toLowerCase() === id.toLowerCase())) ? { ...e, status } : e
    );
    const targetEmail = sharedEmails.find(e => e.id === id || (e.email && e.email.toLowerCase() === id.toLowerCase()));

    if (typeof window !== 'undefined') {
      // 1. Update shared admin key
      localStorage.setItem(EMAILS_KEY, JSON.stringify(sharedEmails));

      // 2. Also update per-user keys so client sees change immediately
      const keysToUpdate: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wehosthere_emails_')) {
          keysToUpdate.push(key);
        }
      }
      keysToUpdate.forEach(key => {
        try {
          const stored: EmailAccount[] = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = stored.map(e =>
            (e.id === id || (e.email && e.email.toLowerCase() === id.toLowerCase())) ? { ...e, status } : e
          );
          localStorage.setItem(key, JSON.stringify(updated));
        } catch { /* ignore */ }
      });

      // 3. Sync to server
      fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_status', 
          emailId: id, 
          emailStr: targetEmail?.email || id, 
          status,
          emails: sharedEmails 
        })
      }).catch(err => console.error('Erro de sync de status de email:', err));
    }
  },


  // Pedidos de Serviços
  getOrders: (clientEmail?: string): ServiceOrder[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_orders');
    const orders: ServiceOrder[] = data ? JSON.parse(data) : [];
    if (clientEmail) {
      return orders.filter(o => !o.clientEmail || o.clientEmail.toLowerCase() === clientEmail.toLowerCase());
    }
    return orders;
  },

  fetchOrdersAsync: async (): Promise<ServiceOrder[]> => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          const serverOrders: ServiceOrder[] = data.orders;
          const localOrders = dataManager.getOrders();

          const orderMap = new Map<string, ServiceOrder>();
          localOrders.forEach(o => orderMap.set(o.id, o));
          serverOrders.forEach(serverOrder => {
            const existing = orderMap.get(serverOrder.id);
            if (existing) {
              const effectiveStatus = existing.status || serverOrder.status || 'pending';
              if (serverOrder.status !== effectiveStatus) {
                fetch('/api/orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'update_status', orderId: serverOrder.id, status: effectiveStatus })
                }).catch(() => {});
              }
              orderMap.set(serverOrder.id, { ...serverOrder, ...existing, status: effectiveStatus });
            } else {
              orderMap.set(serverOrder.id, serverOrder);
            }
          });

          const merged = Array.from(orderMap.values());
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_orders', JSON.stringify(merged));
          }
          return merged;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar pedidos da API:', e);
    }
    return dataManager.getOrders();
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

      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      }).catch(err => console.error('Erro de sync de pedido no servidor:', err));
    }
    return newOrder;
  },

  deleteOrder: (id: string): void => {
    const orders = dataManager.getOrders().filter(o => o.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_orders', JSON.stringify(orders));

      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', orderId: id })
      }).catch(err => console.error('Erro de exclusão de pedido no servidor:', err));
    }
  },

  updateOrderStatus: (id: string, status: ServiceOrder['status']): void => {
    const orders = dataManager.getOrders().map(o => o.id === id ? { ...o, status } : o);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_orders', JSON.stringify(orders));

      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', orderId: id, status })
      }).catch(err => console.error('Erro de sync de status de pedido:', err));
    }
  },

  // Tickets de Suporte
  getTickets: (): SupportTicket[] => {
    if (typeof window === 'undefined') return DEFAULT_TICKETS;
    const data = localStorage.getItem('wehosthere_tickets');
    return data ? JSON.parse(data) : DEFAULT_TICKETS;
  },

  fetchTicketsAsync: async (): Promise<SupportTicket[]> => {
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        if (data.tickets && Array.isArray(data.tickets)) {
          const serverTickets: SupportTicket[] = data.tickets;
          const localTickets = dataManager.getTickets();

          const ticketMap = new Map<string, SupportTicket>();
          localTickets.forEach(t => ticketMap.set(t.id, t));
          serverTickets.forEach(t => ticketMap.set(t.id, t));

          const merged = Array.from(ticketMap.values());
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_tickets', JSON.stringify(merged));
          }
          return merged;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar tickets da API:', e);
    }
    return dataManager.getTickets();
  },

  addTicket: (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'> & { initialMessage: string; initialAttachments?: TicketAttachment[] }): SupportTicket => {
    const tickets = dataManager.getTickets();
    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: ticketData.userId,
      userName: ticketData.userName,
      userEmail: ticketData.userEmail,
      subject: ticketData.subject,
      category: ticketData.category,
      priority: ticketData.priority,
      status: ticketData.status || 'open',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'client',
          senderName: ticketData.userName,
          message: ticketData.initialMessage,
          timestamp: now,
          attachments: ticketData.initialAttachments || []
        }
      ]
    };
    tickets.unshift(newTicket);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_tickets', JSON.stringify(tickets));

      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ticket: newTicket })
      }).catch(err => console.error('Erro de sync de ticket no servidor:', err));
    }
    return newTicket;
  },

  addTicketReply: (ticketId: string, sender: 'client' | 'support' | 'admin', senderName: string, message: string, newStatus?: SupportTicket['status'], attachments?: TicketAttachment[]): SupportTicket | null => {
    const tickets = dataManager.getTickets();
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      sender,
      senderName,
      message,
      timestamp: now,
      attachments: attachments || []
    };

    const updatedTicket: SupportTicket = {
      ...tickets[index],
      updatedAt: now,
      status: newStatus || (sender === 'client' ? 'open' : 'answered'),
      messages: [...tickets[index].messages, newMessage]
    };

    tickets[index] = updatedTicket;
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_tickets', JSON.stringify(tickets));

      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', ticketId, message: newMessage, newStatus: updatedTicket.status })
      }).catch(err => console.error('Erro de sync de resposta de ticket no servidor:', err));
    }
    return updatedTicket;
  },

  updateTicketStatus: (ticketId: string, status: SupportTicket['status'], priority?: SupportTicket['priority']): void => {
    const tickets = dataManager.getTickets().map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status,
          priority: priority || t.priority,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_tickets', JSON.stringify(tickets));

      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', ticketId, status, priority })
      }).catch(err => console.error('Erro de sync de status de ticket:', err));
    }
  },

  // Security Audit Logs
  getSecurityLogs: (): SecurityLog[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(SECURITY_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  fetchSecurityLogsAsync: async (): Promise<SecurityLog[]> => {
    try {
      const res = await fetch('/api/security/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(data.logs));
          }
          return data.logs;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar logs de segurança:', e);
    }
    return dataManager.getSecurityLogs();
  },

  addSecurityLog: (email: string, type: 'failed_login' | 'account_locked' | 'suspended_attempt', message: string): SecurityLog => {
    const logs = dataManager.getSecurityLogs();
    const newLog: SecurityLog = {
      id: Date.now().toString(),
      email: email.trim().toLowerCase(),
      type,
      message,
      createdAt: new Date().toISOString()
    };
    const updated = [newLog, ...logs].slice(0, 50);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(updated));

      fetch('/api/security/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: newLog })
      }).catch(() => {});
    }
    return newLog;
  }
};

export interface ServiceOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  amount: number;
  paymentMethod: 'mpesa' | 'emola' | 'card' | 'bank_transfer';
  proofUrl?: string;
  proofName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'suspended';
  createdAt: string;
}

export interface TicketAttachment {
  url: string;
  name: string;
  type: 'image' | 'pdf' | 'file';
  bytes?: number;
}

export interface TicketMessage {
  id: string;
  sender: 'client' | 'support' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: TicketAttachment[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'technical' | 'billing' | 'domain' | 'vps' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

// Sem dados padrão — todos os dados são carregados do MongoDB Atlas
const DEFAULT_ORDERS: ServiceOrder[] = [];
export const DEFAULT_TICKETS: SupportTicket[] = [];

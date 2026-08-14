import { dataManager } from './data';
import { apiEndpoint } from './siteConfig';
import { sendWelcomeEmail } from './sendgrid';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'none' | 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'pending' | 'suspended';
  dueDate?: number;
  role?: 'admin' | 'user';
  avatar?: string;
  referralCode?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Simulação de banco de dados em localStorage
const STORAGE_KEY = 'wehosthere_auth';

const DEFAULT_USERS: Array<User & { password?: string }> = [
  {
    id: 'admin_root',
    name: 'Administrador WEHOSTHERE',
    email: 'admin@wehosthere.com',
    password: '@Admin123@',
    plan: 'enterprise',
    status: 'active',
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];

const seedDefaultUsers = () => {
  if (typeof window === 'undefined') return;
  
  DEFAULT_USERS.forEach((defaultUser) => {
    const key = `user_${defaultUser.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultUser));
    }
  });
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutos

const checkRateLimit = (email: string) => {
  if (typeof window === 'undefined') return;
  const key = `login_attempts_${email.trim().toLowerCase()}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.lockUntil && Date.now() < parsed.lockUntil) {
        const minutesLeft = Math.ceil((parsed.lockUntil - Date.now()) / 60000);
        throw new Error(`Muitas tentativas incorretas de login. Por motivos de segurança, o acesso a esta conta foi bloqueado temporariamente por ${minutesLeft} minuto(s).`);
      }
      if (parsed.lockUntil && Date.now() >= parsed.lockUntil) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('bloqueado')) throw e;
    }
  }
};

const recordFailedAttempt = (email: string, ipAddress?: string, country?: string) => {
  if (typeof window === 'undefined') return;
  const key = `login_attempts_${email.trim().toLowerCase()}`;
  const data = localStorage.getItem(key);
  let count = 1;
  if (data) {
    try {
      const parsed = JSON.parse(data);
      count = (parsed.count || 0) + 1;
    } catch (e) {}
  }
  if (count >= MAX_LOGIN_ATTEMPTS) {
    const lockUntil = Date.now() + LOCK_TIME_MS;
    localStorage.setItem(key, JSON.stringify({ count, lockUntil }));
    try {
      dataManager.addSecurityLog(email, 'account_locked', 'Muitas tentativas incorretas de login. Conta bloqueada temporariamente por 15 minutos.', ipAddress, country);
    } catch {}
  } else {
    localStorage.setItem(key, JSON.stringify({ count }));
    try {
      dataManager.addSecurityLog(email, 'failed_login', `Tentativa de login incorreta (${count}/${MAX_LOGIN_ATTEMPTS}).`, ipAddress, country);
    } catch {}
  }
};

const clearFailedAttempts = (email: string) => {
  if (typeof window === 'undefined') return;
  const key = `login_attempts_${email.trim().toLowerCase()}`;
  localStorage.removeItem(key);
};

// Função para obter IP e país do usuário via API de geolocalização
const getClientLocation = async (): Promise<{ ipAddress: string; country: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const res = await fetch('https://ipapi.co/json/', { 
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      return {
        ipAddress: data.ip || '',
        country: data.country_name || ''
      };
    }
  } catch (e) {
    // Silently fail - location is optional
    if (e instanceof Error && e.name !== 'AbortError') {
      console.warn('Não foi possível obter localização do cliente:', e);
    }
  }
  return { ipAddress: '', country: '' };
};

export const auth = {
  // Inicialização de dados padrão
  initDefaults: (): void => {
    seedDefaultUsers();
  },

  // Registrar novo usuário assincronamente (com confirmação garantida no banco de dados do servidor)
  registerAsync: async (name: string, email: string, password: string, plan: 'none' | 'basic' | 'pro' | 'enterprise' = 'none', status: 'active' | 'pending' | 'suspended' = 'pending', dueDate: number = 29, referralCode?: string): Promise<User> => {
    console.log('[Register] Iniciando registro para:', email);
    seedDefaultUsers();
    
    // 1. Sincronizar usuários atualizados do servidor para garantir validação global
    console.log('[Register] Buscando usuários do servidor...');
    const users = await auth.fetchUsersAsync();
    console.log('[Register] Usuários buscados:', users.length);
    
    // 2. Verificar se email já existe local ou globalmente
    const targetEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.trim().toLowerCase() === targetEmail);
    if (existing) {
      console.error('[Register] Email já existe:', targetEmail);
      throw new Error('Este endereço de e-mail já está registado na plataforma. Por favor, faça login ou use outro e-mail.');
    }

    // 3. Gerar código de referral único
    const userReferralCode = `WH${email.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Gerar código de confirmação de 6 dígitos
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email: email.trim(),
      plan,
      status: 'pending', // Sempre cria como pending para requerer confirmação
      dueDate,
      role: 'user',
      referralCode: userReferralCode,
      createdAt: new Date().toISOString()
    };

    const userWithPassword = { ...newUser, password, referralCode: userReferralCode, confirmationCode };

    console.log('[Register] Enviando dados para API:', { email: newUser.email, plan: newUser.plan, status: newUser.status });

    // 4. ENVIAR PRIMEIRO PARA O BANCO DE DADOS MONGODB ATLAS (DATABASE-FIRST)
    let savedOnServer = false;
    try {
      const apiUrl = apiEndpoint('/api/users');
      console.log('[Register] URL da API:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', user: userWithPassword, referralCode })
      });
      
      console.log('[Register] Resposta da API:', res.status, res.statusText);
      const resData = await res.json();
      console.log('[Register] Dados da resposta:', resData);
      
      if (!res.ok || resData.error) {
        console.error('[Register] Erro na API:', resData.error);
        throw new Error(resData.error || 'Erro ao gravar dados no servidor.');
      }
      savedOnServer = true;
      console.log('[Register] Usuário salvo no servidor com sucesso');
    } catch (err) {
      console.error('[Register] Erro ao salvar no servidor:', err);
      if (err instanceof Error) throw err;
      throw new Error('Não foi possível conectar ao servidor para registar a conta. Por favor, verifique a sua ligação.');
    }

    // 5. Criar registro de referral para o novo usuário
    if (savedOnServer) {
      try {
        dataManager.createReferral(newUser.email, newUser.name);
      } catch (err) {
        console.error('Erro ao criar referral:', err);
      }
    }

    // 6. Gravar na cache do navegador somente após confirmação do servidor MongoDB
    if (typeof window !== 'undefined') {
      localStorage.setItem(`user_${newUser.id}`, JSON.stringify(userWithPassword));
      const currentList = auth.getUsers();
      const updatedList = [...currentList.filter(u => u.id !== newUser.id), newUser];
      localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

      // Enviar email de boas-vindas com código de confirmação
      sendWelcomeEmail(newUser.email, newUser.name, newUser.plan, confirmationCode).catch(err => {
        console.error('Erro ao enviar email de boas-vindas:', err);
      });
    }

    console.log('[Register] Registro concluído com sucesso:', newUser.email);
    return newUser;
  },

  // Registrar novo usuário
  register: (name: string, email: string, password: string, plan: 'none' | 'basic' | 'pro' | 'enterprise' = 'none', status: 'active' | 'pending' | 'suspended' = 'pending', dueDate: number = 29): User => {
    seedDefaultUsers();
    const users = auth.getUsers();
    
    const targetEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.trim().toLowerCase() === targetEmail);
    if (existing) {
      throw new Error('Este endereço de e-mail já está registado na plataforma. Por favor, faça login ou use outro e-mail.');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email: email.trim(),
      plan,
      status,
      dueDate,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    const userWithPassword = { ...newUser, password };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`user_${newUser.id}`, JSON.stringify(userWithPassword));
      const currentList = auth.getUsers();
      const updatedList = [...currentList.filter(u => u.id !== newUser.id), newUser];
      localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

      // Sincronizar com a API do Servidor para aparecer no Admin em qualquer navegador/dispositivo
      fetch(apiEndpoint('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userWithPassword })
      }).catch(err => console.error('Erro de sync no servidor:', err));

      // Enviar email de boas-vindas
      sendWelcomeEmail(newUser.email, newUser.name, newUser.plan).catch(err => {
        console.error('Erro ao enviar email de boas-vindas:', err);
      });
    }

    return newUser;
  },


  // Login assíncrono (database-first - valida sempre no MongoDB Atlas)
  loginAsync: async (email: string, password: string): Promise<User> => {
    seedDefaultUsers();
    checkRateLimit(email);
    
    // Obter localização do cliente (IP e país)
    const { ipAddress, country } = await getClientLocation();
    
    // 1. VALIDAÇÃO NO SERVIDOR (MongoDB Atlas) - OBRIGATÓRIO
    let serverUser: User | null = null;
    try {
      const res = await fetch(apiEndpoint('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password, ipAddress, country })
      });
      
      const resData = await res.json();
      
      if (!res.ok) {
        // Erro do servidor (usuário não encontrado, senha incorreta, conta suspensa, etc)
        recordFailedAttempt(email, ipAddress, country);
        checkRateLimit(email);
        throw new Error(resData.error || 'Erro ao validar credenciais no servidor.');
      }
      
      if (resData.success && resData.user) {
        serverUser = resData.user;
      }
    } catch (err) {
      if (err instanceof Error && (err.message.includes('Usuário não encontrado') || err.message.includes('Senha incorreta') || err.message.includes('suspensa'))) {
        throw err;
      }
      // Se houver erro de conexão, tentar fallback local
      console.warn('Erro de conexão ao validar login no servidor, tentando fallback local:', err);
    }

    // 2. Se validou no servidor com sucesso, usar esses dados
    if (serverUser) {
      clearFailedAttempts(email);
      
      // Salvar sessão
      const session = { user: serverUser };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        // Atualizar cache local com dados do servidor
        localStorage.setItem(`user_${serverUser.id}`, JSON.stringify({ ...serverUser, password }));
      }
      
      return serverUser;
    }

    // 3. FALLBACK LOCAL (apenas se servidor estiver indisponível)
    let users = auth.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      recordFailedAttempt(email, ipAddress, country);
      checkRateLimit(email);
      throw new Error('Usuário não encontrado. O servidor está indisponível e o usuário não foi encontrado na cache local.');
    }

    let userData: any = user;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`user_${user.id}`);
      if (stored) {
        try {
          userData = JSON.parse(stored);
        } catch {
          userData = user;
        }
      }
    }

    if (userData.password && userData.password !== password) {
      recordFailedAttempt(email, ipAddress, country);
      checkRateLimit(email);
      throw new Error('Senha incorreta. O servidor está indisponível e a validação local falhou.');
    }

    if (userData.status === 'suspended') {
      throw new Error('Sua conta encontra-se suspensa por questões de faturação ou incumprimento dos termos. Por favor, entre em contacto com o suporte WEHOSTHERE (+258 84 438 4702).');
    }

    clearFailedAttempts(email);

    // Salvar sessão
    const session = { user: userData };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    return userData;
  },

  // Login síncrono (fallback)
  login: (email: string, password: string): User => {
    seedDefaultUsers();
    checkRateLimit(email);
    const users = auth.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      recordFailedAttempt(email);
      checkRateLimit(email);
      throw new Error('Usuário não encontrado');
    }

    let userData: any = user;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`user_${user.id}`);
      if (stored) {
        userData = JSON.parse(stored);
      }
    }

    if (userData.password && userData.password !== password) {
      recordFailedAttempt(email);
      checkRateLimit(email);
      throw new Error('Senha incorreta');
    }

    if (userData.status === 'suspended') {
      throw new Error('Sua conta encontra-se suspensa por questões de faturação ou incumprimento dos termos. Por favor, entre em contacto com o suporte WEHOSTHERE (+258 84 438 4702).');
    }

    clearFailedAttempts(email);

    // Salvar sessão
    const session = { user: userData };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    return userData;
  },


  // Logout
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      
      // Limpeza completa de todos os cookies de sessão no navegador
      try {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      } catch (e) {}
    }
  },

  // Obter usuário atual
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem(STORAGE_KEY);
    if (!session) return null;
    try {
      const parsed = JSON.parse(session);
      return parsed.user || null;
    } catch (e) {
      return null;
    }
  },

  // Helper para verificar se usuário é Admin
  isAdminUser: (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'admin' || user.email.toLowerCase() === 'admin@wehosthere.com';
  },


  // Verificar se está autenticado
  isAuthenticated: (): boolean => {
    return auth.getCurrentUser() !== null;
  },

  // Obter todos os usuários (com persistência garantida)
  getUsers: (): User[] => {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    seedDefaultUsers();

    const userMap = new Map<string, User>();
    DEFAULT_USERS.forEach(u => userMap.set(u.id, u));

    const storedList = localStorage.getItem('wehosthere_all_users');
    if (storedList) {
      try {
        const parsed: User[] = JSON.parse(storedList);
        parsed.forEach(u => {
          if (u && u.id) userMap.set(u.id, u);
        });
      } catch (e) {}
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('user_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key) || '{}');
          if (userData && userData.id) {
            userMap.set(userData.id, userData);
          }
        } catch (e) {}
      }
    }

    const allUsers = Array.from(userMap.values());
    localStorage.setItem('wehosthere_all_users', JSON.stringify(allUsers));
    return allUsers;
  },

  // Buscar usuários do servidor via API e atualizar LocalStorage
  fetchUsersAsync: async (): Promise<User[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/users'));
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          const serverUsers: User[] = data.users;
          const localUsers = auth.getUsers();
          
          const localMap = new Map<string, User>();
          localUsers.forEach(u => localMap.set(u.id, u));

          const serverKeySet = new Set(serverUsers.map(u => u.id));

          // 1. Atualizar lista com usuários do servidor, priorizando a alteração recente do Admin local
          const updatedUsers: User[] = serverUsers.map(serverUser => {
            const localMatch = localMap.get(serverUser.id) || Array.from(localMap.values()).find(l => l.email.trim().toLowerCase() === serverUser.email.trim().toLowerCase());
            if (localMatch) {
              const effectiveStatus = localMatch.status || serverUser.status || 'active';
              const effectivePlan = localMatch.plan || serverUser.plan || 'basic';

              // Se o status local difere do servidor, avisar o servidor
              if (serverUser.status !== effectiveStatus) {
                fetch(apiEndpoint('/api/users'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'update_status', userId: serverUser.id, email: serverUser.email, status: effectiveStatus })
                }).catch(() => {});
              }

              return {
                ...serverUser,
                ...localMatch,
                status: effectiveStatus,
                plan: effectivePlan
              };
            }
            return {
              ...serverUser,
              status: serverUser.status || 'active'
            };
          });

          // 2. Preservar apenas usuários criados muito recentemente (< 15s) que ainda não chegaram ao servidor
          localUsers.forEach(localUser => {
            if (!serverKeySet.has(localUser.id) && !serverKeySet.has(localUser.email.toLowerCase())) {
              const createdAtTime = new Date(localUser.createdAt || '').getTime();
              const isJustCreated = !isNaN(createdAtTime) && (Date.now() - createdAtTime < 15000);
              if (isJustCreated) {
                updatedUsers.push(localUser);

                fetch(apiEndpoint('/api/users'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'register', user: localUser })
                }).catch(() => {});
              }
            }
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedUsers));
          }
          return updatedUsers;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar usuários da API:', e);
    }
    return auth.getUsers();
  },

  // Atualizar plano do usuário
  updatePlan: (userId: string, plan: 'basic' | 'pro' | 'enterprise'): void => {
    if (typeof window === 'undefined') return;
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.plan = plan;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    const currentList = auth.getUsers();
    const updatedList = currentList.map(u => u.id === userId ? { ...u, plan } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_plan', userId, plan })
    }).catch(err => console.error('Erro de sync de plano:', err));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user.id === userId) {
          parsed.user.plan = plan;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  },

  // Atualizar status do usuário (Ativo, Pendente, Suspenso)
  updateUserStatus: (userId: string, status: 'active' | 'pending' | 'suspended'): void => {
    if (typeof window === 'undefined') return;
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.status = status;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    if (userData.email) {
      clearFailedAttempts(userData.email);
    }

    const currentList = auth.getUsers();
    const updatedList = currentList.map(u => u.id === userId ? { ...u, status } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', userId, email: userData.email, status })
    }).catch(err => console.error('Erro de sync de status:', err));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user.id === userId) {
          parsed.user.status = status;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  },

  // Atualizar avatar do usuário
  updateUserAvatar: (userId: string, avatarUrl: string): void => {
    if (typeof window === 'undefined') return;
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.avatar = avatarUrl;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    const currentList = auth.getUsers();
    const updatedList = currentList.map(u => u.id === userId ? { ...u, avatar: avatarUrl } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_avatar', userId, avatar: avatarUrl })
    }).catch(err => console.error('Erro de sync de avatar:', err));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user.id === userId) {
          parsed.user.avatar = avatarUrl;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  },

  // Eliminar usuário
  deleteUser: (userId: string, userEmail?: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`user_${userId}`);

    const targetEmail = userEmail?.toLowerCase();
    const currentList = auth.getUsers();
    const updatedList = currentList.filter(
      u => u.id !== userId && (!targetEmail || u.email.toLowerCase() !== targetEmail)
    );
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', userId, userEmail: targetEmail })
    }).catch(err => console.error('Erro ao eliminar usuário no servidor:', err));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user.id === userId || (targetEmail && parsed.user.email?.toLowerCase() === targetEmail)) {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {}
    }
  },

  // Atualizar senha do usuário
  updatePassword: (email: string, newPassword: string): void => {
    if (typeof window === 'undefined') return;
    const users = auth.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const userData: any = JSON.parse(localStorage.getItem(`user_${user.id}`) || '{}');
    userData.password = newPassword;
    localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));

    const updatedList = users.map(u => u.id === user.id ? { ...u, password: newPassword } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    // Sync with server
    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_password', userId: user.id, email: user.email, password: newPassword })
    }).catch(err => console.error('Erro ao sincronizar senha com servidor:', err));
  }

};


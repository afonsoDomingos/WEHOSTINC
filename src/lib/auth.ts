import { dataManager } from './data';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'pending' | 'suspended';
  dueDate?: number;
  role?: 'admin' | 'user';
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

const recordFailedAttempt = (email: string) => {
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
      dataManager.addSecurityLog(email, 'account_locked', 'Muitas tentativas incorretas de login. Conta bloqueada temporariamente por 15 minutos.');
    } catch {}
  } else {
    localStorage.setItem(key, JSON.stringify({ count }));
    try {
      dataManager.addSecurityLog(email, 'failed_login', `Tentativa de login incorreta (${count}/${MAX_LOGIN_ATTEMPTS}).`);
    } catch {}
  }
};

const clearFailedAttempts = (email: string) => {
  if (typeof window === 'undefined') return;
  const key = `login_attempts_${email.trim().toLowerCase()}`;
  localStorage.removeItem(key);
};

export const auth = {
  // Inicialização de dados padrão
  initDefaults: (): void => {
    seedDefaultUsers();
  },

  // Registrar novo usuário assincronamente (com confirmação de salvamento no servidor)
  registerAsync: async (name: string, email: string, password: string, plan: 'basic' | 'pro' | 'enterprise' = 'basic', status: 'active' | 'pending' | 'suspended' = 'pending', dueDate: number = 29): Promise<User> => {
    seedDefaultUsers();
    
    // 1. Sincronizar usuários atualizados do servidor para garantir validação global
    const users = await auth.fetchUsersAsync();
    
    // 2. Verificar se email já existe
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

      // Sincronizar com a API do Servidor (persistência no banco do servidor)
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', user: userWithPassword })
        });
        if (!res.ok) {
          const resData = await res.json();
          if (resData.error) throw new Error(resData.error);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('registado')) throw err;
        console.error('Erro de sync de registro no servidor:', err);
      }
    }

    return newUser;
  },

  // Registrar novo usuário
  register: (name: string, email: string, password: string, plan: 'basic' | 'pro' | 'enterprise' = 'basic', status: 'active' | 'pending' | 'suspended' = 'pending', dueDate: number = 29): User => {
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
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userWithPassword })
      }).catch(err => console.error('Erro de sync no servidor:', err));
    }

    return newUser;
  },


  // Login assíncrono (resiliente a limpeza de cookies/localStorage + rate limiting)
  loginAsync: async (email: string, password: string): Promise<User> => {
    seedDefaultUsers();
    checkRateLimit(email);
    
    // Tenta primeiro no storage local
    let users = auth.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Se o utilizador limpou a cache/cookies do navegador, busca no servidor via API para restaurar a conta
    if (!user) {
      const fetchedUsers = await auth.fetchUsersAsync();
      user = fetchedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      recordFailedAttempt(email);
      checkRateLimit(email);
      throw new Error('Usuário não encontrado');
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
      const res = await fetch('/api/users');
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
                fetch('/api/users', {
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

                fetch('/api/users', {
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

    fetch('/api/users', {
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

    fetch('/api/users', {
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

    fetch('/api/users', {
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
  }

};


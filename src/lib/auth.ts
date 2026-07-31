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
  },
  {
    id: 'client_msservices',
    name: 'MSServices',
    email: 'info@msservices.co.mz',
    password: '@Admin123@',
    plan: 'pro',
    status: 'active',
    dueDate: 29,
    role: 'user',
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

export const auth = {
  // Inicialização de dados padrão
  initDefaults: (): void => {
    seedDefaultUsers();
  },

  // Registrar novo usuário
  register: (name: string, email: string, password: string, plan: 'basic' | 'pro' | 'enterprise' = 'basic', status: 'active' | 'pending' | 'suspended' = 'active', dueDate: number = 29): User => {
    seedDefaultUsers();
    const users = auth.getUsers();
    
    // Verificar se email já existe
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return existing;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
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

  // Login
  login: (email: string, password: string): User => {
    seedDefaultUsers();
    const users = auth.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
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
      throw new Error('Senha incorreta');
    }

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
    }
  },

  // Obter usuário atual
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    seedDefaultUsers();
    const session = localStorage.getItem(STORAGE_KEY);
    if (!session) return null;

    try {
      const { user } = JSON.parse(session);
      return user;
    } catch (e) {
      return null;
    }
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
          
          const userMap = new Map<string, User>();
          localUsers.forEach(u => userMap.set(u.id, u));
          serverUsers.forEach(serverUser => {
            const existing = userMap.get(serverUser.id);
            if (existing) {
              userMap.set(serverUser.id, {
                ...existing,
                ...serverUser,
                status: serverUser.status || existing.status || 'active',
                plan: serverUser.plan || existing.plan || 'basic'
              });
            } else {
              userMap.set(serverUser.id, {
                ...serverUser,
                status: serverUser.status || 'active'
              });
            }
          });

          const merged = Array.from(userMap.values());
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_all_users', JSON.stringify(merged));
            merged.forEach(u => {
              const localKey = `user_${u.id}`;
              const stored = localStorage.getItem(localKey);
              if (stored) {
                try {
                  const parsed = JSON.parse(stored);
                  localStorage.setItem(localKey, JSON.stringify({ ...parsed, ...u }));
                } catch {
                  localStorage.setItem(localKey, JSON.stringify(u));
                }
              } else {
                localStorage.setItem(localKey, JSON.stringify(u));
              }
            });
          }
          return merged;
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

    const currentList = auth.getUsers();
    const updatedList = currentList.map(u => u.id === userId ? { ...u, status } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', userId, status })
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


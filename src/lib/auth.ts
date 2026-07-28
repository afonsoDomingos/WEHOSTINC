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
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email já cadastrado');
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

    localStorage.setItem(`user_${newUser.id}`, JSON.stringify({
      ...newUser,
      password
    }));

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

    const userData = JSON.parse(localStorage.getItem(`user_${user.id}`) || '{}');
    if (userData.password !== password) {
      throw new Error('Senha incorreta');
    }

    // Salvar sessão
    const session = { user: userData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

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

    const { user } = JSON.parse(session);
    return user;
  },

  // Verificar se está autenticado
  isAuthenticated: (): boolean => {
    return auth.getCurrentUser() !== null;
  },

  // Obter todos os usuários (para simulação)
  getUsers: (): User[] => {
    if (typeof window === 'undefined') return [];
    seedDefaultUsers();
    const users: User[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('user_')) {
        const userData = JSON.parse(localStorage.getItem(key) || '{}');
        users.push(userData);
      }
    }
    return users;
  },

  // Atualizar plano do usuário
  updatePlan: (userId: string, plan: 'basic' | 'pro' | 'enterprise'): void => {
    if (typeof window === 'undefined') return;
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.plan = plan;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    // Atualizar sessão se for o usuário atual
    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.user.id === userId) {
        parsed.user.plan = plan;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
  },

  // Atualizar status do usuário (Ativo, Pendente, Suspenso)
  updateUserStatus: (userId: string, status: 'active' | 'pending' | 'suspended'): void => {
    if (typeof window === 'undefined') return;
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.status = status;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.user.id === userId) {
        parsed.user.status = status;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
  }
};


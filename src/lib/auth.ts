// Simulação de sistema de autenticação para MVP
// Em produção, usar NextAuth.js ou similar

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'basic' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Simulação de banco de dados em localStorage
const STORAGE_KEY = 'wehosthere_auth';

export const auth = {
  // Registrar novo usuário
  register: (name: string, email: string, password: string): User => {
    const users = auth.getUsers();
    
    // Verificar se email já existe
    if (users.find(u => u.email === email)) {
      throw new Error('Email já cadastrado');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      plan: 'basic',
      createdAt: new Date().toISOString()
    };

    // Salvar usuário (em produção, usar bcrypt para senha)
    localStorage.setItem(`user_${newUser.id}`, JSON.stringify({
      ...newUser,
      password // Em produção, hash a senha!
    }));

    return newUser;
  },

  // Login
  login: (email: string, password: string): User => {
    const users = auth.getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Em produção, verificar hash da senha
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
    localStorage.removeItem(STORAGE_KEY);
  },

  // Obter usuário atual
  getCurrentUser = (): User | null => {
    const session = localStorage.getItem(STORAGE_KEY);
    if (!session) return null;

    const { user } = JSON.parse(session);
    return user;
  },

  // Verificar se está autenticado
  isAuthenticated = (): boolean => {
    return auth.getCurrentUser() !== null;
  },

  // Obter todos os usuários (para simulação)
  getUsers = (): User[] => {
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
  updatePlan = (userId: string, plan: 'basic' | 'pro' | 'enterprise'): void => {
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.plan = plan;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    // Atualizar sessão
    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      const parsed = JSON.parse(session);
      parsed.user.plan = plan;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
  }
};

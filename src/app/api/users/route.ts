import { NextResponse } from 'next/server';

export interface ServerUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'pending' | 'suspended';
  dueDate?: number;
  role?: 'admin' | 'user';
  createdAt: string;
}

// Em memória no servidor (persiste durante a execução na Vercel e dev)
let GLOBAL_USERS: ServerUser[] = [
  {
    id: 'admin_root',
    name: 'Administrador WEHOSTHERE',
    email: 'admin@wehosthere.com',
    password: '@Admin123@',
    plan: 'enterprise',
    status: 'active',
    role: 'admin',
    dueDate: 29,
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
  },
  {
    id: 'client_hinguili',
    name: 'Hinguili Artes',
    email: 'info@hinguiliartes.com',
    password: '@Admin123@',
    plan: 'basic',
    status: 'active',
    dueDate: 29,
    role: 'user',
    createdAt: new Date().toISOString()
  }
];

// GET: Retorna a lista global de todos os usuários
export async function GET() {
  return NextResponse.json({ users: GLOBAL_USERS });
}

// POST: Registrar novo usuário ou atualizar existente
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, user, userId, plan, status } = body;

    if (action === 'update_plan') {
      GLOBAL_USERS = GLOBAL_USERS.map(u => u.id === userId ? { ...u, plan } : u);
      return NextResponse.json({ success: true, users: GLOBAL_USERS });
    }

    if (action === 'update_status') {
      GLOBAL_USERS = GLOBAL_USERS.map(u => u.id === userId ? { ...u, status } : u);
      return NextResponse.json({ success: true, users: GLOBAL_USERS });
    }

    if (action === 'delete') {
      GLOBAL_USERS = GLOBAL_USERS.filter(u => u.id !== userId);
      return NextResponse.json({ success: true, users: GLOBAL_USERS });
    }

    // Registrar ou adicionar usuário
    const existingIndex = GLOBAL_USERS.findIndex(
      u => u.email.toLowerCase() === (user?.email || body.email || '').toLowerCase()
    );

    const newUser: ServerUser = user || {
      id: body.id || Date.now().toString(),
      name: body.name,
      email: body.email,
      password: body.password || '@Admin123@',
      plan: body.plan || 'basic',
      status: body.status || 'active',
      dueDate: body.dueDate || 29,
      role: body.role || 'user',
      createdAt: body.createdAt || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      GLOBAL_USERS[existingIndex] = { ...GLOBAL_USERS[existingIndex], ...newUser };
    } else {
      GLOBAL_USERS.push(newUser);
    }

    return NextResponse.json({ success: true, user: newUser, users: GLOBAL_USERS });
  } catch (error) {
    console.error('Erro na API de Usuários:', error);
    return NextResponse.json({ error: 'Erro ao processar usuários' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';

const ADMIN_SEED = {
  id: 'admin_root',
  name: 'Administrador WEHOSTHERE',
  email: 'admin@wehosthere.com',
  password: '@Admin123@',
  plan: 'enterprise' as const,
  status: 'active' as const,
  role: 'admin' as const,
  dueDate: 29,
  createdAt: new Date().toISOString()
};

async function ensureAdmin() {
  const exists = await UserModel.findOne({ email: 'admin@wehosthere.com' });
  if (!exists) {
    await UserModel.create(ADMIN_SEED);
  }
}

// GET: Retorna todos os utilizadores
export async function GET() {
  try {
    await connectDB();
    await ensureAdmin();
    const users = await UserModel.find({}).lean();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao buscar utilizadores:', error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}

// POST: Registar, atualizar ou eliminar utilizador
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, user, userId, plan, status } = body;

    if (action === 'update_plan') {
      await UserModel.findOneAndUpdate({ id: userId }, { plan });
      const users = await UserModel.find({}).lean();
      return NextResponse.json({ success: true, users });
    }

    if (action === 'update_status') {
      const targetId = (userId || body.id || '').toLowerCase();
      const targetEmail = (body.email || body.userEmail || '').trim().toLowerCase();
      const filter = targetEmail
        ? { $or: [{ id: targetId }, { email: targetEmail }] }
        : { id: targetId };
      await UserModel.updateMany(filter, { status });
      const users = await UserModel.find({}).lean();
      return NextResponse.json({ success: true, users });
    }

    if (action === 'delete') {
      const targetId = (userId || '').toLowerCase();
      const targetEmail = (body.email || body.userEmail || '').toLowerCase();
      await UserModel.deleteOne({
        $or: [
          ...(targetId ? [{ id: targetId }] : []),
          ...(targetEmail ? [{ email: targetEmail }] : [])
        ]
      });
      const users = await UserModel.find({}).lean();
      return NextResponse.json({ success: true, users });
    }

    // Registar ou atualizar utilizador
    const reqEmail = (user?.email || body.email || '').trim().toLowerCase();

    if (action === 'register') {
      const exists = await UserModel.findOne({ email: reqEmail });
      if (exists) {
        return NextResponse.json({ error: 'Este e-mail já está registado na plataforma.' }, { status: 400 });
      }
    }

    const userData = user || {
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

    const saved = await UserModel.findOneAndUpdate(
      { email: reqEmail },
      userData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    const users = await UserModel.find({}).lean();
    return NextResponse.json({ success: true, user: saved, users });
  } catch (error) {
    console.error('Erro na API de Utilizadores:', error);
    return NextResponse.json({ error: 'Erro ao processar utilizadores' }, { status: 500 });
  }
}

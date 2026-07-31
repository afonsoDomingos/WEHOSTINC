import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';

// Fallback in-memory para quando MongoDB não estiver acessível (dev local sem rede)
let FALLBACK_USERS: any[] = [
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
  }
];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue:', err);
    return false;
  }
}

async function ensureAdmin() {
  const exists = await UserModel.findOne({ email: 'admin@wehosthere.com' });
  if (!exists) {
    await UserModel.create(FALLBACK_USERS[0]);
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      await ensureAdmin();
      const users = await UserModel.find({}).lean();
      return NextResponse.json({ users });
    }
  } catch (e) {
    console.error('MongoDB indisponível, usando fallback:', e);
  }
  return NextResponse.json({ users: FALLBACK_USERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, user, userId, plan, status } = body;
    const useMongo = await tryMongo();

    if (action === 'update_plan') {
      if (useMongo) {
        await UserModel.findOneAndUpdate({ id: userId }, { plan });
        const users = await UserModel.find({}).lean();
        return NextResponse.json({ success: true, users });
      }
      FALLBACK_USERS = FALLBACK_USERS.map(u => u.id === userId ? { ...u, plan } : u);
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    if (action === 'update_status') {
      const targetId = (userId || body.id || '').toLowerCase();
      const targetEmail = (body.email || body.userEmail || '').trim().toLowerCase();
      if (useMongo) {
        const filter = targetEmail
          ? { $or: [{ id: targetId }, { email: targetEmail }] }
          : { id: targetId };
        await UserModel.updateMany(filter, { status });
        const users = await UserModel.find({}).lean();
        return NextResponse.json({ success: true, users });
      }
      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, status } : u
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    if (action === 'delete') {
      const targetId = (userId || body.userId || '').toLowerCase().trim();
      const targetEmail = (body.email || body.userEmail || '').toLowerCase().trim();
      if (useMongo) {
        // Protect root admin from deletion
        const isRootAdmin = targetEmail === 'admin@wehosthere.com' || targetId === 'admin_root';
        if (!isRootAdmin) {
          const deleteConditions: any[] = [];
          if (targetId) deleteConditions.push({ id: targetId });
          if (targetEmail) deleteConditions.push({ email: new RegExp(`^${targetEmail}$`, 'i') });
          if (deleteConditions.length > 0) {
            await UserModel.deleteMany({ $or: deleteConditions });
          }
        }
        const users = await UserModel.find({}).lean();
        return NextResponse.json({ success: true, users });
      }
      FALLBACK_USERS = FALLBACK_USERS.filter(u =>
        u.email.toLowerCase() === 'admin@wehosthere.com' ||
        (!(targetId && (u.id.toLowerCase() === targetId || u.email.toLowerCase() === targetId)) &&
         !(targetEmail && (u.id.toLowerCase() === targetEmail || u.email.toLowerCase() === targetEmail)))
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    const reqEmail = (user?.email || body.email || '').trim().toLowerCase();

    if (action === 'register') {
      if (useMongo) {
        const exists = await UserModel.findOne({ email: reqEmail });
        if (exists) return NextResponse.json({ error: 'Este e-mail já está registado na plataforma.' }, { status: 400 });
      } else {
        const exists = FALLBACK_USERS.find(u => u.email.toLowerCase() === reqEmail);
        if (exists) return NextResponse.json({ error: 'Este e-mail já está registado na plataforma.' }, { status: 400 });
      }
    }

    const userData = user || {
      id: body.id || Date.now().toString(),
      name: body.name,
      email: body.email,
      password: body.password || '@Admin123@',
      plan: body.plan || 'basic',
      status: body.status || 'pending',
      dueDate: body.dueDate || 29,
      role: body.role || 'user',
      createdAt: body.createdAt || new Date().toISOString()
    };

    if (useMongo) {
      // Garantir email limpo em minúsculas
      const cleanEmail = reqEmail || (userData.email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return NextResponse.json({ error: 'E-mail é obrigatório para registo.' }, { status: 400 });
      }

      userData.email = cleanEmail;
      if (!userData.id) userData.id = Date.now().toString();

      let saved;
      const existingDoc = await UserModel.findOne({ email: cleanEmail });
      if (existingDoc) {
        saved = await UserModel.findOneAndUpdate(
          { email: cleanEmail },
          { $set: userData },
          { new: true }
        ).lean();
      } else {
        const createdDoc = await UserModel.create(userData);
        saved = createdDoc.toObject ? createdDoc.toObject() : createdDoc;
      }

      const users = await UserModel.find({}).lean();
      return NextResponse.json({ success: true, user: saved, users });
    }

    const idx = FALLBACK_USERS.findIndex(u => u.email.toLowerCase() === reqEmail);
    if (idx >= 0) FALLBACK_USERS[idx] = { ...FALLBACK_USERS[idx], ...userData };
    else FALLBACK_USERS.push(userData);
    return NextResponse.json({ success: true, user: userData, users: FALLBACK_USERS });

  } catch (error: any) {
    console.error('Erro na API de Utilizadores:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao processar utilizadores' }, { status: 500 });
  }
}

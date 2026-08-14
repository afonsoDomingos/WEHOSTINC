import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';

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
    const { action, user, userId, plan, status, email, password, avatar } = body;
    const useMongo = await tryMongo();

    // Endpoint de login - valida credenciais no servidor (database-first)
    if (action === 'login') {
      const targetEmail = (email || body.email || '').trim().toLowerCase();
      const targetPassword = password || body.password;
      const clientIpAddress = body.ipAddress || '';
      const clientCountry = body.country || '';

      if (!targetEmail || !targetPassword) {
        return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
      }

      if (useMongo) {
        await ensureAdmin();
        const userDoc = await UserModel.findOne({ email: targetEmail }).lean();
        
        if (!userDoc) {
          // Registrar tentativa falha com IP e país
          try {
            const SecurityLogModel = (await import('@/lib/models/SecurityLog')).default;
            await SecurityLogModel.create({
              id: Date.now().toString(),
              email: targetEmail,
              type: 'failed_login',
              message: 'Usuário não encontrado',
              ipAddress: clientIpAddress,
              country: clientCountry,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error('Erro ao registrar log de segurança:', e);
          }
          return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
        }

        if (userDoc.password !== targetPassword) {
          // Registrar tentativa falha com IP e país
          try {
            const SecurityLogModel = (await import('@/lib/models/SecurityLog')).default;
            await SecurityLogModel.create({
              id: Date.now().toString(),
              email: targetEmail,
              type: 'failed_login',
              message: 'Senha incorreta',
              ipAddress: clientIpAddress,
              country: clientCountry,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error('Erro ao registrar log de segurança:', e);
          }
          return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
        }

        if (userDoc.status === 'suspended') {
          // Registrar tentativa de conta suspensa com IP e país
          try {
            const SecurityLogModel = (await import('@/lib/models/SecurityLog')).default;
            await SecurityLogModel.create({
              id: Date.now().toString(),
              email: targetEmail,
              type: 'suspended_attempt',
              message: 'Tentativa de login em conta suspensa',
              ipAddress: clientIpAddress,
              country: clientCountry,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error('Erro ao registrar log de segurança:', e);
          }
          return NextResponse.json({ error: 'Sua conta encontra-se suspensa por questões de faturação ou incumprimento dos termos. Por favor, entre em contacto com o suporte WEHOSTHERE (+258 84 438 4702).' }, { status: 403 });
        }

        return NextResponse.json({ success: true, user: userDoc });
      } else {
        const fallbackUser = FALLBACK_USERS.find(u => u.email.toLowerCase() === targetEmail);
        
        if (!fallbackUser) {
          return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
        }

        if (fallbackUser.password !== targetPassword) {
          return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
        }

        if (fallbackUser.status === 'suspended') {
          return NextResponse.json({ error: 'Sua conta encontra-se suspensa por questões de faturação ou incumprimento dos termos. Por favor, entre em contacto com o suporte WEHOSTHERE (+258 84 438 4702).' }, { status: 403 });
        }

        return NextResponse.json({ success: true, user: fallbackUser });
      }
    }

    if (action === 'update_plan') {
      if (useMongo) {
        await UserModel.findOneAndUpdate({ id: userId }, { plan });
        const users = await UserModel.find({}).lean();
        return NextResponse.json({ success: true, users });
      }
      FALLBACK_USERS = FALLBACK_USERS.map(u => u.id === userId ? { ...u, plan } : u);
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    if (action === 'confirm_email') {
      const targetId = (userId || body.id || '').toLowerCase();
      const targetEmail = (email || body.email || '').trim().toLowerCase();
      
      if (useMongo) {
        const filter = targetEmail
          ? { $or: [{ id: targetId }, { email: targetEmail }] }
          : { id: targetId };
        
        const updated = await UserModel.findOneAndUpdate(
          filter,
          { status: 'active', $unset: { confirmationCode: 1 } },
          { new: true }
        ).lean();
        
        if (!updated) {
          return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }
        
        const users = await UserModel.find({}).lean();
        return NextResponse.json({ success: true, user: updated, users });
      }
      
      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, status: 'active', confirmationCode: undefined } : u
      );
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

    if (action === 'update_avatar') {
      if (useMongo) {
        await UserModel.findOneAndUpdate({ id: userId }, { avatar });
        const users = await UserModel.find({}).lean();
        return NextResponse.json({ success: true, users });
      }
      FALLBACK_USERS = FALLBACK_USERS.map(u => u.id === userId ? { ...u, avatar } : u);
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
      plan: body.plan || 'none',
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

        // Notificar admin do novo registo
        if (action === 'register') {
          addAdminNotification({
            title: `👤 Novo Utilizador Registado`,
            message: `${userData.name || userData.email} criou uma nova conta na plataforma.`,
            type: 'user_signup',
            userEmail: userData.email,
            userName: userData.name,
            link: '/admin?tab=users'
          });

          // Enviar e-mail de boas-vindas ao cliente
          dispatchMessage({
            recipientEmail: userData.email,
            recipientName: userData.name || userData.email.split('@')[0],
            templateId: 'welcome',
            variables: {
              nome_cliente: userData.name || userData.email.split('@')[0],
              email: userData.email
            },
            isAutomatic: true,
            eventType: 'user_signup'
          });
        }
      }

      const users = await UserModel.find({}).lean();
      return NextResponse.json({ success: true, user: saved, users });
    }

    const idx = FALLBACK_USERS.findIndex(u => u.email.toLowerCase() === reqEmail);
    const isNewFallback = idx < 0;
    if (idx >= 0) FALLBACK_USERS[idx] = { ...FALLBACK_USERS[idx], ...userData };
    else FALLBACK_USERS.push(userData);

    if (isNewFallback && action === 'register') {
      addAdminNotification({
        title: `👤 Novo Utilizador Registado`,
        message: `${userData.name || userData.email} criou uma nova conta na plataforma.`,
        type: 'user_signup',
        userEmail: userData.email,
        userName: userData.name,
        link: '/admin?tab=users'
      });

      dispatchMessage({
        recipientEmail: userData.email,
        recipientName: userData.name || userData.email.split('@')[0],
        templateId: 'welcome',
        variables: {
          nome_cliente: userData.name || userData.email.split('@')[0],
          email: userData.email
        },
        isAutomatic: true,
        eventType: 'user_signup'
      });
    }

    return NextResponse.json({ success: true, user: userData, users: FALLBACK_USERS });

  } catch (error: any) {
    console.error('Erro na API de Utilizadores:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao processar utilizadores' }, { status: 500 });
  }
}

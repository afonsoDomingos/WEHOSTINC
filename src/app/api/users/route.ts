import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import bcrypt from 'bcryptjs';
import { sendAccountDeletionEmail, sendRoleChangeEmail } from '@/lib/sendgrid';
import { DomainInvitation } from '@/models/DomainInvitation';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import EmailAccountModel from '@/lib/models/EmailAccount';
import SiteModel from '@/lib/models/Site';

const DEFAULT_ADMIN_HASH = '$2a$12$uKp3eU0f.E8ZTuQJg2B3K.Ekqb7BqmPLoHdwmdu7pmtdIeUGaq7wG';

// Fallback in-memory para quando MongoDB não estiver acessível (dev local sem rede)
let FALLBACK_USERS: any[] = [
  {
    id: 'admin_root',
    name: 'Administrador WEHOSTHERE',
    email: 'admin@wehosthere.com',
    password: process.env.ADMIN_DEFAULT_PASSWORD_HASH || DEFAULT_ADMIN_HASH,
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
  const adminHash = process.env.ADMIN_DEFAULT_PASSWORD_HASH?.trim() || DEFAULT_ADMIN_HASH;
  const adminPayload = {
    ...FALLBACK_USERS[0],
    password: adminHash,
  };

  const exists = await UserModel.findOne({ email: 'admin@wehosthere.com' });
  if (!exists) {
    await UserModel.create(adminPayload);
    return;
  }

  // Se a senha do admin no MongoDB estiver vazia, for texto puro ou diferente do hash atual, sincroniza
  if (!exists.password || !exists.password.startsWith('$2') || exists.password !== adminHash) {
    await UserModel.findOneAndUpdate(
      { email: 'admin@wehosthere.com' },
      { $set: { password: adminHash, role: 'admin', status: 'active' } }
    );
  }
}

export async function GET(request: Request) {
  // 🔒 PROTECÇÃO: Apenas permite:
  // 1. Chamadas server-side (sem header Origin) — ex: NextAuth, outros routes
  // 2. Chamadas com token interno correto (x-internal-auth)
  // 3. Chamadas do próprio domínio do site (same-origin browser calls)
  const origin = request.headers.get('origin');
  const authHeader = request.headers.get('x-internal-auth');
  const internalSecret = process.env.NEXTAUTH_SECRET || '';

  const isInternalCall = !origin; // Chamadas server-side não enviam Origin
  const hasValidInternalToken = authHeader === internalSecret && internalSecret.length > 0;
  const isSameOrigin = origin === 'https://wehosthere.com' ||
                       origin === 'https://www.wehosthere.com' ||
                       origin === 'http://localhost:3000' ||
                       origin === 'http://localhost:3001';

  if (!isInternalCall && !hasValidInternalToken && !isSameOrigin) {
    console.warn('[Users API] Acesso não autorizado ao GET /api/users — origin:', origin);
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    if (await tryMongo()) {
      await ensureAdmin();
      const users = await UserModel.find({}).lean();
      // 🔒 NUNCA retornar passwords ou códigos de confirmação na resposta
      const safeUsers = users.map(({ password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...u }: any) => u);
      return NextResponse.json({ users: safeUsers });
    }
  } catch (e) {
    console.error('MongoDB indisponível, usando fallback:', e);
  }
  // Fallback: remover passwords
  const safeFallback = FALLBACK_USERS.map(({ password: _pw, ...u }: any) => u);
  return NextResponse.json({ users: safeFallback });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, user, userId, plan, status, email, password, avatar } = body;
    const useMongo = await tryMongo();

    // Sanitização básica de inputs
    const sanitizeInput = (input: any): string => {
      if (typeof input !== 'string') return '';
      return input.trim().replace(/[<>]/g, '');
    };

    const safeEmail = email ? sanitizeInput(email).toLowerCase() : '';
    const safePassword = password ? sanitizeInput(password) : '';
    const safeName = user?.name ? sanitizeInput(user.name) : '';

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (safeEmail && !emailRegex.test(safeEmail)) {
      return NextResponse.json({ error: 'Formato de email inválido.' }, { status: 400 });
    }

    // Endpoint de login - valida credenciais no servidor (database-first)
    if (action === 'login') {
      const targetEmail = safeEmail;
      const targetPassword = safePassword;
      const clientIpAddress = body.ipAddress || '';
      const clientCountry = body.country || '';

      if (!targetEmail || !targetPassword) {
        return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
      }

      // Rate limiting para prevenir força bruta
      const rateLimitResult = rateLimit(
        getRateLimitIdentifier(clientIpAddress, targetEmail),
        5, // 5 tentativas
        60000 // 1 minuto
      );

      if (!rateLimitResult.success) {
        return NextResponse.json(
          { 
            error: 'Muitas tentativas de login. Tente novamente em 1 minuto.',
            resetTime: rateLimitResult.resetTime
          }, 
          { status: 429 }
        );
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

        // 🔒 Comparar com bcrypt — com migração automática para passwords antigas em plaintext
        let passwordMatch = false;
        if (userDoc.password) {
          if (userDoc.password.startsWith('$2')) {
            passwordMatch = await bcrypt.compare(targetPassword, userDoc.password);
          } else if (userDoc.password === targetPassword) {
            // Migração automática e transparente de contas antigas para bcrypt
            passwordMatch = true;
          }
        }

        // 🔒 Fallback de emergência para admin (garante acesso imediato com nova ou antiga senha)
        if (!passwordMatch && targetEmail === 'admin@wehosthere.com') {
          if (targetPassword === 'AdminSecure2026!#Wh' || targetPassword === '@Admin123@') {
            passwordMatch = true;
          }
        }

        // Se autenticou e a senha no banco não era o hash oficial, atualiza no MongoDB
        if (passwordMatch) {
          try {
            const adminHash = process.env.ADMIN_DEFAULT_PASSWORD_HASH?.trim() || DEFAULT_ADMIN_HASH;
            if (targetEmail === 'admin@wehosthere.com') {
              if (userDoc.password !== adminHash) {
                await UserModel.updateOne({ email: targetEmail }, { $set: { password: adminHash } });
              }
            } else if (!userDoc.password || !userDoc.password.startsWith('$2')) {
              const newHashed = await bcrypt.hash(targetPassword, 12);
              await UserModel.updateOne({ email: targetEmail }, { $set: { password: newHashed } });
            }
          } catch (e) {
            console.error('Erro ao atualizar hash:', e);
          }
        }

        if (!passwordMatch) {
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

        const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeUser } = userDoc as any;
        return NextResponse.json({ success: true, user: safeUser });
      } else {
        const fallbackUser = FALLBACK_USERS.find(u => u.email.toLowerCase() === targetEmail);

        if (!fallbackUser) {
          return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
        }

        // 🔒 Comparar com bcrypt
        let fallbackMatch = false;
        if (fallbackUser.password) {
          if (fallbackUser.password.startsWith('$2')) {
            fallbackMatch = await bcrypt.compare(targetPassword, fallbackUser.password);
          } else if (fallbackUser.password === targetPassword) {
            fallbackMatch = true;
          }
        }
        if (!fallbackMatch && targetEmail === 'admin@wehosthere.com') {
          if (targetPassword === 'AdminSecure2026!#Wh' || targetPassword === '@Admin123@') {
            fallbackMatch = true;
          }
        }
        if (!fallbackMatch) {
          return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
        }

        if (fallbackUser.status === 'suspended') {
          return NextResponse.json({ error: 'Sua conta encontra-se suspensa por questões de faturação ou incumprimento dos termos. Por favor, entre em contacto com o suporte WEHOSTHERE (+258 84 438 4702).' }, { status: 403 });
        }

        const { password: _pw, ...safeFallbackUser } = fallbackUser;
        return NextResponse.json({ success: true, user: safeFallbackUser });
      }
    }

    if (action === 'update_password') {
      const targetId = (userId || body.id || '').toLowerCase();
      const targetEmail = safeEmail || (body.email || '').trim().toLowerCase();

      if (!safePassword) {
        return NextResponse.json({ error: 'Nova senha é obrigatória.' }, { status: 400 });
      }
      if (safePassword.length < 6) {
        return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
      }

      const hashedPassword = safePassword.startsWith('$2')
        ? safePassword
        : await bcrypt.hash(safePassword, 12);

      if (useMongo) {
        const filter = targetEmail
          ? { $or: [{ id: targetId }, { email: targetEmail }] }
          : { id: targetId };

        const updated = await UserModel.findOneAndUpdate(
          filter,
          { $set: { password: hashedPassword } },
          { new: true }
        ).lean();

        if (!updated) {
          return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
        }

        const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeUser } = updated as any;
        return NextResponse.json({ success: true, user: safeUser });
      }

      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, password: hashedPassword }
          : u
      );
      const updatedFallback = FALLBACK_USERS.find(u =>
        (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail)
      );
      if (!updatedFallback) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }
      const { password: _pw, ...safeUser } = updatedFallback;
      return NextResponse.json({ success: true, user: safeUser });
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

    if (action === 'update_confirmation_code') {
      const targetId = (userId || body.id || '').toLowerCase();
      const targetEmail = (email || body.email || '').trim().toLowerCase();
      const newCode = body.confirmationCode;
      const newExpiresAt = body.confirmationCodeExpiresAt;

      if (!newCode || !newExpiresAt) {
        return NextResponse.json({ error: 'Código e expiração são obrigatórios' }, { status: 400 });
      }

      if (useMongo) {
        const filter = targetEmail
          ? { $or: [{ id: targetId }, { email: targetEmail }] }
          : { id: targetId };
        
        const updated = await UserModel.findOneAndUpdate(
          filter,
          { 
            confirmationCode: newCode,
            confirmationCodeExpiresAt: newExpiresAt
          },
          { new: true }
        ).lean();
        
        if (!updated) {
          return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, user: updated });
      }
      
      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, confirmationCode: newCode, confirmationCodeExpiresAt: newExpiresAt } : u
      );
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
          { status: 'active', $unset: { confirmationCode: 1, confirmationCodeExpiresAt: 1 } },
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
          ? { ...u, status: 'active', confirmationCode: undefined, confirmationCodeExpiresAt: undefined } : u
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

    if (action === 'update_due_date') {
      const targetId = (userId || body.id || '').toLowerCase();
      const targetEmail = (body.email || body.userEmail || '').trim().toLowerCase();
      const newDueDate = Number(body.dueDate) || 29;

      if (useMongo) {
        const filter = targetEmail
          ? { $or: [{ id: targetId }, { email: targetEmail }] }
          : { id: targetId };
        await UserModel.updateMany(filter, { dueDate: newDueDate });
        const users = await UserModel.find({}).lean();
        return NextResponse.json({ success: true, users, dueDate: newDueDate });
      }
      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, dueDate: newDueDate } : u
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS, dueDate: newDueDate });
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

    if (action === 'update_role') {
      const targetId = (userId || body.id || '').toLowerCase();
      const targetEmail = (body.email || body.userEmail || '').trim().toLowerCase();
      const newRole = body.role;

      if (!newRole || !['user', 'admin'].includes(newRole)) {
        return NextResponse.json({ error: 'Role inválida. Use "user" ou "admin".' }, { status: 400 });
      }

      // Proteger: não permitir remover admin do root admin
      const isRootAdmin = targetEmail === 'admin@wehosthere.com' || targetId === 'admin_root';
      if (isRootAdmin && newRole !== 'admin') {
        return NextResponse.json({ error: 'Não é possível remover permissões de admin do administrador principal.' }, { status: 403 });
      }

      if (useMongo) {
        const filter = targetEmail
          ? { $or: [{ id: targetId }, { email: targetEmail }] }
          : { id: targetId };
        
        const existingTarget = await UserModel.findOne(filter).lean();
        await UserModel.updateMany(filter, { role: newRole });

        // Enviar e-mail de notificação de cargo
        if (existingTarget?.email) {
          sendRoleChangeEmail(existingTarget.email, existingTarget.name || existingTarget.email, newRole).catch(err => {
            console.error('[UsersAPI] Erro ao enviar email de mudança de cargo:', err);
          });
        }

        const users = await UserModel.find({}).lean();
        return NextResponse.json({ success: true, users });
      }

      const localTarget = FALLBACK_USERS.find(u => (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail));
      if (localTarget?.email) {
        sendRoleChangeEmail(localTarget.email, localTarget.name || localTarget.email, newRole).catch(() => {});
      }

      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, role: newRole }
          : u
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
          // Buscar usuário para enviar email antes de deletar
          const userToDelete = await UserModel.findOne({
            $or: [
              { id: targetId },
              { email: new RegExp(`^${targetEmail}$`, 'i') }
            ]
          });
          
          // Enviar email de notificação antes de deletar
          if (userToDelete && userToDelete.email) {
            sendAccountDeletionEmail(
              userToDelete.email,
              userToDelete.name,
              body.reason || 'Violação dos termos de serviço'
            ).catch((err) => {
              console.error('[Users API] Erro ao enviar email de exclusão:', err);
            });
          }
          
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
      
      // Para fallback, buscar usuário antes de deletar
      const userToDelete = FALLBACK_USERS.find(u =>
        (targetId && (u.id.toLowerCase() === targetId || u.email.toLowerCase() === targetId)) ||
        (targetEmail && (u.id.toLowerCase() === targetEmail || u.email.toLowerCase() === targetEmail))
      );
      
      // Enviar email de notificação antes de deletar
      if (userToDelete && userToDelete.email && userToDelete.email.toLowerCase() !== 'admin@wehosthere.com') {
        sendAccountDeletionEmail(
          userToDelete.email,
          userToDelete.name,
          body.reason || 'Violação dos termos de serviço'
        ).catch((err) => {
          console.error('[Users API] Erro ao enviar email de exclusão:', err);
        });
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
      console.log('[Users API] Iniciando registro:', { email: reqEmail, hasUser: !!user, hasBody: !!body });
      
      if (useMongo) {
        const exists = await UserModel.findOne({ email: reqEmail });
        if (exists) {
          console.log('[Users API] Email já existe:', reqEmail);
          return NextResponse.json({ error: 'Este e-mail já está registado na plataforma.' }, { status: 400 });
        }
      } else {
        const exists = FALLBACK_USERS.find(u => u.email.toLowerCase() === reqEmail);
        if (exists) {
          console.log('[Users API] Email já existe (fallback):', reqEmail);
          return NextResponse.json({ error: 'Este e-mail já está registado na plataforma.' }, { status: 400 });
        }
      }
    }

    // 🔒 Se existe uma password em texto puro vinda do body, fazer hash antes de guardar
    let incomingPassword = (user?.password) || body.password || '';
    if (incomingPassword && !incomingPassword.startsWith('$2')) {
      // Ainda não está em hash bcrypt (hashes bcrypt começam com $2a$ ou $2b$)
      incomingPassword = await bcrypt.hash(incomingPassword, 12);
    }

    const userData = user || {
      id: body.id || Date.now().toString(),
      name: body.name,
      email: body.email,
      password: incomingPassword, // Sempre guardado em hash
      plan: body.plan || 'none',
      status: body.status || 'pending',
      dueDate: body.dueDate || 29,
      role: body.role || 'user',
      createdAt: body.createdAt || new Date().toISOString()
    };

    // Garantir que o userData.password também está em hash quando veio do objeto user
    if (userData.password && !userData.password.startsWith('$2')) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }

    // Adicionar campos de confirmação se existirem no body.user ou body
    const userBody = body.user || body;
    if (userBody.confirmationCode) {
      userData.confirmationCode = userBody.confirmationCode;
      console.log('[Users API] Código de confirmação adicionado:', userBody.confirmationCode);
    }
    if (userBody.confirmationCodeExpiresAt) {
      userData.confirmationCodeExpiresAt = userBody.confirmationCodeExpiresAt;
      console.log('[Users API] Expiração do código adicionada:', userBody.confirmationCodeExpiresAt);
    }

    console.log('[Users API] Dados do usuário antes de salvar:', { 
      email: userData.email, 
      hasConfirmationCode: !!userData.confirmationCode,
      hasExpiration: !!userData.confirmationCodeExpiresAt 
    });

    if (useMongo) {
      // Garantir email limpo em minúsculas
      const cleanEmail = reqEmail || (userData.email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return NextResponse.json({ error: 'E-mail é obrigatório para registo.' }, { status: 400 });
      }

      // 🎯 Extrair código de afiliado (do body ou do cookie)
      const cookieHeader = req.headers.get('cookie') || '';
      let affiliateCode = body.referredBy || body.user?.referredBy || '';
      if (!affiliateCode && cookieHeader.includes('affiliate_code=')) {
        const match = cookieHeader.match(/affiliate_code=([^;]+)/);
        if (match) affiliateCode = decodeURIComponent(match[1].trim());
      }

      if (affiliateCode) {
        userData.referredBy = affiliateCode;
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

          // 🎯 Rastreamento de Afiliado & Envio de E-mail de Novo Lead
          if (affiliateCode) {
            try {
              const AffiliateModel = (await import('@/lib/models/Affiliate')).default;
              const affiliateDoc = await AffiliateModel.findOne({ affiliateCode });
              if (affiliateDoc) {
                await AffiliateModel.findByIdAndUpdate(affiliateDoc._id, {
                  $inc: { totalReferredUsers: 1 }
                });

                // Buscar dados do afiliado para enviar o email
                const affiliateUser = await UserModel.findOne({
                  $or: [{ id: affiliateDoc.userId }, { email: affiliateDoc.userId }]
                });

                if (affiliateUser && affiliateUser.email) {
                  const { sendAffiliateNewLeadEmail } = await import('@/lib/affiliateEmails');
                  sendAffiliateNewLeadEmail(
                    affiliateUser.email,
                    affiliateUser.name || 'Parceiro Afiliado',
                    userData.name || 'Novo Cliente',
                    userData.email
                  ).catch((err: any) => console.error('[Affiliate Lead Email] Erro:', err));
                }
              }
            } catch (affErr) {
              console.error('[Users API] Erro ao processar afiliado:', affErr);
            }
          }

          // 🎁 Auto-claim de convite de domínio pré-provisionado
          try {
            const inviteToken = body.inviteToken || body.user?.inviteToken;
            const query: any = inviteToken 
              ? { token: inviteToken, status: 'pending' }
              : { invitedEmail: cleanEmail, status: 'pending' };

            const pendingInvite = await DomainInvitation.findOne(query);
            if (pendingInvite) {
              const dName = pendingInvite.domainName;
              const domDoc = await EmailDomain.findOne({ domainName: new RegExp(`^${dName}$`, 'i') });
              if (domDoc) {
                domDoc.customerId = cleanEmail;
                domDoc.updatedAt = new Date();
                await domDoc.save();

                await EmailMailbox.updateMany(
                  {
                    $or: [
                      { domainId: domDoc._id.toString() },
                      { email: { $regex: `@${dName}$`, $options: 'i' } }
                    ]
                  },
                  { $set: { customerId: cleanEmail, updatedAt: new Date() } }
                );

                await EmailAccountModel.updateMany(
                  {
                    $or: [
                      { domain: new RegExp(`^${dName}$`, 'i') },
                      { email: { $regex: `@${dName}$`, $options: 'i' } }
                    ]
                  },
                  { $set: { userEmail: cleanEmail } }
                );

                await SiteModel.findOneAndUpdate(
                  { domain: new RegExp(`^${dName}$`, 'i') },
                  {
                    $set: {
                      domain: dName.toLowerCase().trim(),
                      name: dName,
                      userEmail: cleanEmail,
                      status: domDoc.status === 'active' ? 'active' : 'pending',
                      storage: 10,
                      bandwidth: 100,
                      createdAt: domDoc.createdAt ? new Date(domDoc.createdAt).toISOString() : new Date().toISOString()
                    },
                    $setOnInsert: {
                      id: `site_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
                    }
                  },
                  { upsert: true, new: true }
                ).catch(() => {});
              }

              pendingInvite.status = 'accepted';
              pendingInvite.acceptedByEmail = cleanEmail;
              pendingInvite.acceptedAt = new Date();
              await pendingInvite.save();
              console.log(`[Registration] Domínio ${dName} atribuído com sucesso a ${cleanEmail} via convite`);
            }
          } catch (invErr) {
            console.warn('[Registration] Erro ao processar auto-claim de convite de domínio:', invErr);
          }
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

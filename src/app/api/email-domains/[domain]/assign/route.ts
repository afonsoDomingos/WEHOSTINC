import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import EmailAccountModel from '@/lib/models/EmailAccount';
import SiteModel from '@/lib/models/Site';
import { EmailAuditLog } from '@/models/EmailAuditLog';
import UserModel from '@/lib/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const domainName = params.domain;
    const body = await request.json();
    const { targetUserEmail, action } = body;
    const isUnassign = action === 'unassign' || targetUserEmail === 'system' || !targetUserEmail;

    if (!isUnassign && (!targetUserEmail.trim() || !targetUserEmail.includes('@'))) {
      return NextResponse.json(
        { error: 'Email de utilizador destinatário inválido ou não fornecido' },
        { status: 400 }
      );
    }

    const cleanEmail = isUnassign ? 'system' : targetUserEmail.trim().toLowerCase();

    // Check if domain exists
    const domain = await EmailDomain.findOne({ domainName: new RegExp(`^${domainName}$`, 'i') });
    if (!domain) {
      return NextResponse.json(
        { error: `Domínio ${domainName} não encontrado na base de dados` },
        { status: 404 }
      );
    }

    const oldCustomerId = domain.customerId;

    // 1. Update EmailDomain
    domain.customerId = cleanEmail;
    domain.updatedAt = new Date();
    await domain.save();

    // 2. Update EmailMailbox records
    const mailboxUpdateResult = await EmailMailbox.updateMany(
      {
        $or: [
          { domainId: domain._id.toString() },
          { email: { $regex: `@${domainName}$`, $options: 'i' } }
        ]
      },
      {
        $set: {
          customerId: cleanEmail,
          updatedAt: new Date()
        }
      }
    );

    // 3. Update EmailAccountModel records
    const emailAccountUpdateResult = await EmailAccountModel.updateMany(
      {
        $or: [
          { domain: new RegExp(`^${domainName}$`, 'i') },
          { email: { $regex: `@${domainName}$`, $options: 'i' } }
        ]
      },
      {
        $set: {
          userEmail: isUnassign ? '' : cleanEmail
        }
      }
    );

    // 4. Update / Upsert SiteModel so it appears in "Meus Domínios" (dashboard/sites & dashboard/domains)
    if (!isUnassign) {
      await SiteModel.findOneAndUpdate(
        { domain: new RegExp(`^${domainName}$`, 'i') },
        {
          $set: {
            domain: domainName.toLowerCase().trim(),
            name: domainName,
            userEmail: cleanEmail,
            status: domain.status === 'active' ? 'active' : 'pending',
            storage: 10,
            bandwidth: 100,
            createdAt: domain.createdAt ? new Date(domain.createdAt).toISOString() : new Date().toISOString()
          },
          $setOnInsert: {
            id: `site_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
          }
        },
        { upsert: true, new: true }
      );
    } else {
      await SiteModel.updateMany(
        { domain: new RegExp(`^${domainName}$`, 'i') },
        { $unset: { userEmail: "" } }
      );
    }

    // 5. Log audit trail
    try {
      await EmailAuditLog.create({
        actorEmail: 'admin@wehosthere.com',
        action: 'ASSIGN_DOMAIN_TO_USER',
        entityType: 'domain',
        entityId: domainName,
        details: {
          previousOwner: oldCustomerId,
          newOwner: cleanEmail,
          mailboxesUpdated: mailboxUpdateResult.modifiedCount,
          accountsUpdated: emailAccountUpdateResult.modifiedCount
        },
        timestamp: new Date()
      });
    } catch (auditErr) {
      console.warn('[Assign Domain] Audit log error:', auditErr);
    }

    // 6. Enviar e-mail de notificação ao utilizador (apenas se for atribuição a cliente real)
    if (!isUnassign && cleanEmail.includes('@')) {
      try {
        const { dispatchMessage } = await import('@/lib/notifications');
        await dispatchMessage({
          recipientEmail: cleanEmail,
          recipientName: cleanEmail.split('@')[0],
          subject: `🎉 O domínio ${domainName} e e-mails foram vinculados à sua conta!`,
          body: `Olá,\n\nInformamos que o domínio corporativo ${domainName} e as suas respetivas caixas de e-mail foram vinculados com sucesso à sua conta WEHOSTHERE.\n\nPode agora aceder ao seu painel em https://wehosthere.com/dashboard/email, à gestão de domínios em https://wehosthere.com/dashboard/sites e ao Webmail em https://wehosthere.com/webmail.\n\nCom os melhores cumprimentos,\nEquipa WEHOSTHERE`,
          isAutomatic: true,
          eventType: 'domain_assigned'
        });
      } catch (notifyErr) {
        console.warn('[Assign Domain] Erro ao enviar email de notificação:', notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: isUnassign 
        ? `Domínio ${domainName} desvinculado com sucesso e retornado ao sistema.`
        : `Domínio ${domainName} e todas as caixas de correio foram vinculados com sucesso a ${cleanEmail}`,
      assignedTo: cleanEmail,
      stats: {
        mailboxesUpdated: mailboxUpdateResult.modifiedCount,
        accountsUpdated: emailAccountUpdateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('[Assign Domain] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atribuir domínio ao utilizador' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { DomainInvitation } from '@/models/DomainInvitation';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import EmailAccountModel from '@/lib/models/EmailAccount';
import SiteModel from '@/lib/models/Site';
import { EmailAuditLog } from '@/models/EmailAuditLog';

// GET - Validate token & get info
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await connectDB();
    const { token } = params;

    const invitation = await DomainInvitation.findOne({ token }).lean();
    if (!invitation) {
      return NextResponse.json({ error: 'Convite não encontrado ou inválido' }, { status: 404 });
    }

    const isExpired = new Date() > new Date(invitation.expiresAt);
    if (isExpired && invitation.status === 'pending') {
      invitation.status = 'expired';
    }

    return NextResponse.json({
      success: true,
      invitation: {
        domainName: invitation.domainName,
        invitedEmail: invitation.invitedEmail,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        mailboxes: invitation.mailboxes || [],
        isExpired
      }
    });
  } catch (error) {
    console.error('[Invitation GET] Error:', error);
    return NextResponse.json({ error: 'Erro ao validar convite' }, { status: 500 });
  }
}

// POST - Claim invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await connectDB();
    const { token } = params;
    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json({ error: 'Email de utilizador inválido' }, { status: 400 });
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    const invitation = await DomainInvitation.findOne({ token });

    if (!invitation) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Convite já ${invitation.status}` }, { status: 400 });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      invitation.status = 'expired';
      await invitation.save();
      return NextResponse.json({ error: 'Convite expirado' }, { status: 400 });
    }

    const domainName = invitation.domainName;
    const domain = await EmailDomain.findOne({ domainName: new RegExp(`^${domainName}$`, 'i') });

    if (domain) {
      // 1. Assign domain to this user
      domain.customerId = cleanEmail;
      domain.updatedAt = new Date();
      await domain.save();

      // 2. Assign mailboxes
      await EmailMailbox.updateMany(
        {
          $or: [
            { domainId: domain._id.toString() },
            { email: { $regex: `@${domainName}$`, $options: 'i' } }
          ]
        },
        {
          $set: { customerId: cleanEmail, updatedAt: new Date() }
        }
      );

      // 3. Update EmailAccountModel
      await EmailAccountModel.updateMany(
        {
          $or: [
            { domain: new RegExp(`^${domainName}$`, 'i') },
            { email: { $regex: `@${domainName}$`, $options: 'i' } }
          ]
        },
        {
          $set: { userEmail: cleanEmail }
        }
      );

      // 4. Update SiteModel
      await SiteModel.updateMany(
        { domain: new RegExp(`^${domainName}$`, 'i') },
        { $set: { userEmail: cleanEmail } }
      );
    }

    // Mark invitation accepted
    invitation.status = 'accepted';
    invitation.acceptedByEmail = cleanEmail;
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Log audit trail
    try {
      await EmailAuditLog.create({
        actorEmail: cleanEmail,
        action: 'CLAIM_DOMAIN_INVITATION',
        entityType: 'domain',
        entityId: domainName,
        details: { token, userEmail: cleanEmail },
        timestamp: new Date()
      });
    } catch (auditErr) {
      console.warn('[Claim Invite] Audit error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Domínio ${domainName} vinculado à sua conta com sucesso!`,
      domainName
    });
  } catch (error) {
    console.error('[Invitation POST Claim] Error:', error);
    return NextResponse.json({ error: 'Erro ao resgatar convite' }, { status: 500 });
  }
}

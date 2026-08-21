import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import { DomainInvitation } from '@/models/DomainInvitation';
import crypto from 'crypto';

// GET - List invitations for a domain
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const domainName = params.domain;

    const invitations = await DomainInvitation.find({
      domainName: new RegExp(`^${domainName}$`, 'i')
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      invitations
    });
  } catch (error) {
    console.error('[Domain Invitations GET] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar convites do domínio' },
      { status: 500 }
    );
  }
}

// POST - Create invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const domainName = params.domain;
    const body = await request.json();
    const { invitedEmail, expiresInDays = 7 } = body;

    if (!invitedEmail || !invitedEmail.trim() || !invitedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Email de destino do convite inválido' },
        { status: 400 }
      );
    }

    const cleanEmail = invitedEmail.trim().toLowerCase();

    // Check if domain exists
    const domain = await EmailDomain.findOne({ domainName: new RegExp(`^${domainName}$`, 'i') });
    if (!domain) {
      return NextResponse.json(
        { error: `Domínio ${domainName} não encontrado` },
        { status: 404 }
      );
    }

    // Get current mailboxes for this domain
    const mailboxes = await EmailMailbox.find({
      $or: [
        { domainId: domain._id.toString() },
        { email: { $regex: `@${domainName}$`, $options: 'i' } }
      ]
    }).lean();

    const mailboxList = mailboxes.map((m: any) => m.email);

    // Invalidate existing pending invites for this email + domain
    await DomainInvitation.updateMany(
      {
        domainName: new RegExp(`^${domainName}$`, 'i'),
        invitedEmail: cleanEmail,
        status: 'pending'
      },
      {
        $set: { status: 'revoked' }
      }
    );

    // Generate secure token
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000));

    const invitation = await DomainInvitation.create({
      domainName: domain.domainName,
      invitedEmail: cleanEmail,
      token,
      status: 'pending',
      createdBy: 'admin@wehosthere.com',
      expiresAt,
      mailboxes: mailboxList
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://wehosthere.com';
    const inviteLink = `${baseUrl}/register?inviteToken=${token}&email=${encodeURIComponent(cleanEmail)}`;

    return NextResponse.json({
      success: true,
      message: 'Convite criado com sucesso!',
      invitation,
      inviteLink,
      token
    });
  } catch (error) {
    console.error('[Domain Invite POST] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar convite de domínio' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke an invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id') || searchParams.get('token');

    if (!tokenId) {
      return NextResponse.json({ error: 'ID ou Token do convite necessário' }, { status: 400 });
    }

    await DomainInvitation.deleteOne({
      $or: [{ _id: tokenId }, { token: tokenId }]
    });

    return NextResponse.json({
      success: true,
      message: 'Convite revogado com sucesso'
    });
  } catch (error) {
    console.error('[Domain Invite DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao revogar convite' },
      { status: 500 }
    );
  }
}

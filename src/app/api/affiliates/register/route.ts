import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import User from '@/lib/models/User';
import { dispatchMessage } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID é obrigatório' }, { status: 400 });
    }

    // Check if user exists
    const user = await User.findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Check if affiliate already exists
    const existingAffiliate = await Affiliate.findOne({ userId });
    if (existingAffiliate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário já é um afiliado',
        affiliate: existingAffiliate
      }, { status: 400 });
    }

    // Generate unique affiliate code
    const affiliateCode = await generateUniqueAffiliateCode(user.name);
    const affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://wehosthere.com'}/ref/${affiliateCode}`;

    // Create affiliate
    const affiliate = await Affiliate.create({
      userId,
      affiliateCode,
      affiliateLink,
      status: 'active',
      totalEarnings: 0,
      availableBalance: 0,
      totalClicks: 0,
      totalConversions: 0,
      conversionRate: 0,
    });

    // Send welcome email to affiliate
    await dispatchMessage({
      recipientEmail: user.email,
      recipientName: user.name,
      templateId: 'affiliate-welcome',
      variables: {
        nome_afiliado: user.name,
        link_afiliado: affiliateLink,
        codigo_afiliado: affiliateCode,
      },
      isAutomatic: true,
      eventType: 'affiliate_registered'
    });

    return NextResponse.json({ 
      success: true, 
      affiliate 
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao registrar afiliado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao registrar afiliado' 
    }, { status: 500 });
  }
}

async function generateUniqueAffiliateCode(userName: string): Promise<string> {
  const baseCode = userName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 8);
  
  let code = baseCode;
  let counter = 1;
  
  while (await Affiliate.findOne({ affiliateCode: code })) {
    code = `${baseCode}${counter}`;
    counter++;
  }
  
  return code;
}

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

    console.log('Register affiliate request:', { userId, body });

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID é obrigatório' }, { status: 400 });
    }

    // Check if user exists - try by id first, then by email as fallback
    let user = await User.findOne({ id: userId });
    
    if (!user) {
      // Fallback: try to find by email if userId looks like an email
      if (userId.includes('@')) {
        user = await User.findOne({ email: userId });
      }
    }
    
    console.log('User found:', user ? { id: user.id, email: user.email, name: user.name } : null);
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Check if affiliate already exists
    const existingAffiliate = await Affiliate.findOne({ userId: user.id });
    if (existingAffiliate) {
      return NextResponse.json({ 
        success: true, 
        affiliate: existingAffiliate,
        alreadyAffiliate: true
      }, { status: 200 });
    }

    // Generate unique affiliate code
    const affiliateCode = await generateUniqueAffiliateCode();
    const affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://wehosthere.com'}/ref/${affiliateCode}`;

    // Create affiliate
    const affiliate = await Affiliate.create({
      userId: user.id,
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

async function generateUniqueAffiliateCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Generate a random 6-digit number
    code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if code already exists
    const existing = await Affiliate.findOne({ affiliateCode: code });
    if (!existing) {
      return code;
    }
    
    attempts++;
  }
  
  // Fallback: use timestamp + random
  return Date.now().toString().slice(-6);
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID é obrigatório' }, { status: 400 });
    }
    
    // Find user
    let user = await User.findOne({ id: userId });
    if (!user && userId.includes('@')) {
      user = await User.findOne({ email: userId });
    }
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Find affiliate
    const affiliate = await Affiliate.findOne({ userId: user.id });
    
    if (!affiliate) {
      return NextResponse.json({ 
        success: true, 
        exists: false,
        hasPhoneConfigured: false,
        message: 'Afiliado não encontrado'
      });
    }
    
    // Check if affiliate has phone configured for payouts
    const hasPhoneConfigured = !!(
      affiliate.payoutMethod === 'mpesa' && 
      affiliate.payoutDetails?.mpesaPhone
    );
    
    return NextResponse.json({ 
      success: true, 
      exists: true,
      hasPhoneConfigured,
      phone: affiliate.payoutDetails?.mpesaPhone || null,
      payoutMethod: affiliate.payoutMethod,
      affiliateCode: affiliate.affiliateCode,
      status: affiliate.status
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil de afiliado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar perfil de afiliado' 
    }, { status: 500 });
  }
}

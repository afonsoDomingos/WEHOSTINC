import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';
import AffiliateClick from '@/lib/models/AffiliateClick';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    // Se não tiver userId, tentar obter do header de autenticação interna
    if (!userId) {
      const internalAuth = request.headers.get('x-internal-auth');
      if (!internalAuth) {
        return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
      }
      
      // Tentar buscar usuários para identificar o usuário atual
      const baseUrl = process.env.NEXTAUTH_URL || 'https://wehosthere.com';
      const usersResponse = await fetch(`${baseUrl}/api/users`, {
        headers: { 'x-internal-auth': internalAuth },
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = usersData.users || [];
        
        // Pegar o primeiro usuário ativo (simplificação - em produção deve usar sessão real)
        const activeUser = users.find((u: any) => u.status === 'active');
        if (activeUser) {
          userId = activeUser.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
    }

    // Get affiliate data - try by userId first, then by email as fallback
    let affiliate = await Affiliate.findOne({ userId });
    if (!affiliate && userId.includes('@')) {
      // Fallback: try to find by email if userId looks like an email
      affiliate = await Affiliate.findOne({ userId: userId.toLowerCase() });
    }
    
    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
    }

    // Get commissions
    const commissions = await Commission.find({ affiliateId: affiliate.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get recent clicks (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentClicks = await AffiliateClick.find({
      affiliateId: affiliate.userId,
      clickedAt: { $gte: thirtyDaysAgo.toISOString() }
    }).sort({ clickedAt: -1 }).limit(100);

    // Calculate stats
    const pendingCommissions = commissions.filter(c => c.status === 'pending');
    const approvedCommissions = commissions.filter(c => c.status === 'approved');
    const paidCommissions = commissions.filter(c => c.status === 'paid');

    const stats = {
      totalClicks: affiliate.totalClicks,
      totalConversions: affiliate.totalConversions,
      conversionRate: affiliate.conversionRate,
      totalEarnings: affiliate.totalEarnings,
      availableBalance: affiliate.availableBalance,
      pendingAmount: pendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      approvedAmount: approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      paidAmount: paidCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
    };

    return NextResponse.json({ 
      success: true, 
      affiliate,
      commissions,
      recentClicks,
      stats
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard de afiliado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar dashboard de afiliado' 
    }, { status: 500 });
  }
}

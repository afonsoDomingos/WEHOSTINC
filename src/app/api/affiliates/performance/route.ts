import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateClick from '@/lib/models/AffiliateClick';
import Commission from '@/lib/models/Commission';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '30'; // days

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID é obrigatório' 
      }, { status: 400 });
    }

    const affiliate = await Affiliate.findOne({ userId });
    if (!affiliate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Afiliado não encontrado' 
      }, { status: 404 });
    }

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get clicks per day
    const clicks = await AffiliateClick.find({
      affiliateId: userId,
      clickedAt: { $gte: startDate.toISOString() }
    }).sort({ clickedAt: 1 });

    // Group clicks by day
    const clicksByDay: Record<string, number> = {};
    clicks.forEach(click => {
      const date = new Date(click.clickedAt).toLocaleDateString('pt-MZ');
      clicksByDay[date] = (clicksByDay[date] || 0) + 1;
    });

    // Get commissions per month
    const commissions = await Commission.find({
      affiliateId: userId,
      createdAt: { $gte: startDate.toISOString() }
    }).sort({ createdAt: 1 });

    // Group commissions by month
    const commissionsByMonth: Record<string, number> = {};
    commissions.forEach(commission => {
      const date = new Date(commission.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      commissionsByMonth[monthKey] = (commissionsByMonth[monthKey] || 0) + commission.commissionAmount;
    });

    // Calculate conversion rate
    const totalClicks = clicks.length;
    const totalConversions = commissions.length;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return NextResponse.json({ 
      success: true, 
      data: {
        clicksByDay,
        commissionsByMonth,
        totalClicks,
        totalConversions,
        conversionRate,
        period: days
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados de performance:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar dados de performance' 
    }, { status: 500 });
  }
}

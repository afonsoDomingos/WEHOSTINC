import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AffiliateClick from '@/lib/models/AffiliateClick';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { affiliateCode, orderId, amount, customerEmail, customerName } = body;

    if (!affiliateCode || !orderId || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de afiliado, orderId e amount são obrigatórios' 
      }, { status: 400 });
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Find the most recent click from this affiliate that visited checkout
    const recentClick = await AffiliateClick.findOne({
      affiliateCode,
      convertedToSale: false,
      ipAddress,
    }).sort({ clickedAt: -1 });

    if (!recentClick) {
      console.log(`[Affiliate] No recent click found for affiliate ${affiliateCode}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum clique recente encontrado para este afiliado' 
      }, { status: 404 });
    }

    // Find affiliate by code to get userId
    const affiliate = await Affiliate.findOne({ affiliateCode });
    if (!affiliate) {
      console.log(`[Affiliate] Affiliate not found for code ${affiliateCode}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Afiliado não encontrado' 
      }, { status: 404 });
    }

    // Update the click to mark as converted
    await AffiliateClick.findByIdAndUpdate(recentClick._id, {
      convertedToSale: true,
      conversionOrderId: orderId,
      conversionDate: new Date().toISOString(),
      abandonedCheckout: false,
    });

    // Create commission
    const commissionAmount = amount * 0.30; // 30% commission
    await Commission.create({
      affiliateId: affiliate.userId,
      orderId,
      orderAmount: amount,
      commissionAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      statusHistory: [{
        status: 'pending',
        changedAt: new Date().toISOString(),
        changedBy: 'system',
        note: 'Comissão criada automaticamente após conversão'
      }]
    });

    // Update affiliate stats
    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: { 
        totalEarnings: commissionAmount,
        availableBalance: commissionAmount,
        totalConversions: 1
      }
    });

    console.log(`[Affiliate] Conversion tracked for affiliate ${affiliateCode}, order: ${orderId}, commission: ${commissionAmount}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Conversão rastreada com sucesso',
      commissionAmount
    });

  } catch (error) {
    console.error('Erro ao rastrear conversão:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao rastrear conversão' 
    }, { status: 500 });
  }
}

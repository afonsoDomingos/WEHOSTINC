import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AffiliateClick from '@/lib/models/AffiliateClick';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { affiliateCode } = body;

    if (!affiliateCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de afiliado é obrigatório' 
      }, { status: 400 });
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Find the most recent click from this affiliate that visited checkout but didn't convert
    const recentClick = await AffiliateClick.findOne({
      affiliateCode,
      convertedToSale: false,
      visitedCheckout: true,
      ipAddress,
    }).sort({ clickedAt: -1 });

    if (recentClick && !recentClick.abandonedCheckout) {
      // Update the click to mark as abandoned checkout
      await AffiliateClick.findByIdAndUpdate(recentClick._id, {
        abandonedCheckout: true,
        abandonedAt: new Date().toISOString(),
      });
      
      console.log(`[Affiliate] Checkout abandonment tracked for affiliate ${affiliateCode}, click ID: ${recentClick._id}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Abandono de checkout rastreado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao rastrear abandono de checkout:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao rastrear abandono de checkout' 
    }, { status: 500 });
  }
}

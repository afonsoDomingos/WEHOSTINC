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
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Find the most recent click from this affiliate that hasn't converted yet
    const recentClick = await AffiliateClick.findOne({
      affiliateCode,
      convertedToSale: false,
      ipAddress,
    }).sort({ clickedAt: -1 });

    if (recentClick) {
      // Update the click to indicate checkout visit
      await AffiliateClick.findByIdAndUpdate(recentClick._id, {
        visitedCheckout: true,
        checkoutVisitAt: new Date().toISOString(),
      });
      
      console.log(`[Affiliate] Checkout visit tracked for affiliate ${affiliateCode}, click ID: ${recentClick._id}`);
    } else {
      // Create a new click record for checkout visit
      await AffiliateClick.create({
        affiliateId: affiliateCode, // Will be updated later
        affiliateCode,
        clickedAt: new Date().toISOString(),
        ipAddress,
        userAgent,
        referrer: 'checkout',
        convertedToSale: false,
        visitedCheckout: true,
        checkoutVisitAt: new Date().toISOString(),
        landingPage: '/checkout',
      });
      
      console.log(`[Affiliate] New checkout visit created for affiliate ${affiliateCode}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Visita ao checkout rastreada com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao rastrear visita ao checkout:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao rastrear visita ao checkout' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateClick from '@/lib/models/AffiliateClick';

export async function GET(
  request: NextRequest,
  { params }: { params: { affiliateCode: string } }
) {
  try {
    await connectDB();
    
    const { affiliateCode } = params;

    // Find affiliate by code
    const affiliate = await Affiliate.findOne({ affiliateCode });
    if (!affiliate) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (affiliate.status !== 'active') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || 'unknown';

    // Track click
    await AffiliateClick.create({
      affiliateId: affiliate.userId,
      affiliateCode,
      clickedAt: new Date().toISOString(),
      ipAddress,
      userAgent,
      referrer,
      convertedToSale: false,
      landingPage: '/',
      utmSource: request.nextUrl.searchParams.get('utm_source') || undefined,
      utmMedium: request.nextUrl.searchParams.get('utm_medium') || undefined,
      utmCampaign: request.nextUrl.searchParams.get('utm_campaign') || undefined,
    });

    // Update affiliate click count
    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: { totalClicks: 1 }
    });

    // Set cookie for affiliate tracking (30 days)
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('affiliate_code', affiliateCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;

  } catch (error) {
    console.error('Erro ao rastrear clique de afiliado:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

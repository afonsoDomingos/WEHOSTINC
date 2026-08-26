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

    // Update affiliate click count and get new count
    const updatedAffiliate = await Affiliate.findByIdAndUpdate(
      affiliate._id,
      { $inc: { totalClicks: 1 } },
      { new: true }
    );

    // Milestone notifications (a cada 10 cliques ate 50, depois a cada 50)
    const newClicks = updatedAffiliate?.totalClicks || (affiliate.totalClicks + 1);
    const isMilestone = (newClicks <= 50 && newClicks % 10 === 0) || (newClicks > 50 && newClicks % 50 === 0);

    if (isMilestone) {
      try {
        const UserModel = (await import('@/lib/models/User')).default;
        const affiliateUser = await UserModel.findOne({
          $or: [{ id: affiliate.userId }, { email: affiliate.userId }]
        });
        if (affiliateUser && affiliateUser.email) {
          const { sendAffiliateMilestoneEmail } = await import('@/lib/affiliateEmails');
          sendAffiliateMilestoneEmail(
            affiliateUser.email,
            affiliateUser.name || 'Parceiro Afiliado',
            newClicks
          ).catch((err: any) => console.error('[Affiliate Milestone Email] Erro:', err));
        }
      } catch (err) {
        console.error('[Affiliate Milestone] Erro:', err);
      }
    }

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

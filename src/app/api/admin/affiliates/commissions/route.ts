import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Commission from '@/lib/models/Commission';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const affiliateId = searchParams.get('affiliateId');

    const query: any = {};
    if (status) query.status = status;
    if (affiliateId) query.affiliateId = affiliateId;

    const commissions = await Commission.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ 
      success: true, 
      commissions
    });

  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar comissões' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { commissionId, status, note, changedBy } = body;

    if (!commissionId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'commissionId e status são obrigatórios' 
      }, { status: 400 });
    }

    const commission = await Commission.findById(commissionId);
    if (!commission) {
      return NextResponse.json({ success: false, error: 'Comissão não encontrada' }, { status: 404 });
    }

    // Update status
    commission.status = status;
    commission.statusHistory.push({
      status,
      changedAt: new Date().toISOString(),
      changedBy,
      note,
    });

    if (status === 'approved') {
      commission.approvedAt = new Date().toISOString();
    } else if (status === 'paid') {
      commission.paidAt = new Date().toISOString();
    }

    await commission.save();

    // Update affiliate balance if approved
    if (status === 'approved') {
      const Affiliate = (await import('@/lib/models/Affiliate')).default;
      await Affiliate.findByIdAndUpdate(
        commission.affiliateId,
        {
          $inc: { 
            availableBalance: commission.commissionAmount,
            totalEarnings: commission.commissionAmount,
            totalConversions: 1
          }
        }
      );
    }

    return NextResponse.json({ success: true, commission });

  } catch (error) {
    console.error('Erro ao atualizar comissão:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar comissão' }, { status: 500 });
  }
}

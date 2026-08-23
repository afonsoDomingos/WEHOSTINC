import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, payoutMethod, payoutDetails } = body;

    if (!userId || !payoutMethod || !payoutDetails) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID, método de pagamento e detalhes são obrigatórios' 
      }, { status: 400 });
    }

    // Get affiliate
    const affiliate = await Affiliate.findOne({ userId });
    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
    }

    // Check if has available balance
    if (affiliate.availableBalance < 1000) {
      return NextResponse.json({ 
        success: false, 
        error: 'Saldo mínimo para saque é de 1.000 MZN' 
      }, { status: 400 });
    }

    // Update payout details
    affiliate.payoutMethod = payoutMethod;
    affiliate.payoutDetails = payoutDetails;
    affiliate.availableBalance = 0;
    affiliate.updatedAt = new Date().toISOString();
    await affiliate.save();

    // Mark approved commissions as paid
    await Commission.updateMany(
      { 
        affiliateId: affiliate.userId, 
        status: 'approved' 
      },
      { 
        status: 'paid',
        paidAt: new Date().toISOString(),
        $push: {
          statusHistory: {
            status: 'paid',
            changedAt: new Date().toISOString(),
            changedBy: userId,
            note: 'Saque solicitado pelo afiliado'
          }
        }
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Saque solicitado com sucesso',
      affiliate
    });

  } catch (error) {
    console.error('Erro ao solicitar saque:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao solicitar saque' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';
import { dispatchMessage } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, payoutMethod, payoutDetails } = body;
    const typedPayoutMethod = payoutMethod as 'bank_transfer' | 'paypal' | 'mpesa';

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

    // Validate payout details based on method
    if (typedPayoutMethod === 'bank_transfer') {
      if (!payoutDetails.bankName || !payoutDetails.accountNumber || !payoutDetails.accountHolder) {
        return NextResponse.json({ 
          success: false, 
          error: 'Para transferência bancária, informe: banco, número da conta e titular' 
        }, { status: 400 });
      }
    } else if (typedPayoutMethod === 'paypal') {
      if (!payoutDetails.paypalEmail) {
        return NextResponse.json({ 
          success: false, 
          error: 'Para PayPal, informe o email PayPal' 
        }, { status: 400 });
      }
    } else if (typedPayoutMethod === 'mpesa') {
      if (!payoutDetails.mpesaPhone) {
        return NextResponse.json({ 
          success: false, 
          error: 'Para M-Pesa, informe o número de telefone M-Pesa' 
        }, { status: 400 });
      }
    }

    // Save payout amount BEFORE zeroing balance
    const payoutAmount = affiliate.availableBalance;

    // Update payout details
    affiliate.payoutMethod = typedPayoutMethod;
    affiliate.payoutDetails = payoutDetails;
    affiliate.payoutStatus = 'pending';
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

    // Send email notification about payout
    const user = await User.findOne({ id: userId });
    if (user) {
      const payoutAmount = affiliate.availableBalance;
      const methodNames: Record<'bank_transfer' | 'paypal' | 'mpesa', string> = {
        bank_transfer: 'Transferência Bancária',
        paypal: 'PayPal',
        mpesa: 'M-Pesa'
      };

      await dispatchMessage({
        recipientEmail: user.email,
        recipientName: user.name,
        templateId: 'affiliate-payout-processed',
        variables: {
          nome_afiliado: user.name,
          valor_saque: payoutAmount.toFixed(2),
          metodo_pagamento: methodNames[typedPayoutMethod],
          data: new Date().toLocaleDateString('pt-MZ'),
        },
        isAutomatic: true,
        eventType: 'affiliate_payout_processed'
      });
    }

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

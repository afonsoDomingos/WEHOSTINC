import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ReferralCommissionModel from '@/lib/models/ReferralCommission';

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const commissions = await ReferralCommissionModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ commissions });
  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    return NextResponse.json({ error: 'Erro ao buscar comissões' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const body = await request.json();
    const { action, commission, commissionId, status, paymentDate } = body;

    if (action === 'create' && commission) {
      const newCommission = new ReferralCommissionModel(commission);
      await newCommission.save();
      return NextResponse.json({ success: true, commission: newCommission });
    }

    if (action === 'update_status' && commissionId) {
      const updateData: any = { status };
      if (paymentDate) {
        updateData.paymentDate = new Date(paymentDate);
      }
      const updated = await ReferralCommissionModel.findByIdAndUpdate(
        commissionId,
        updateData,
        { new: true }
      );
      return NextResponse.json({ success: true, commission: updated });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar comissão:', error);
    return NextResponse.json({ error: 'Erro ao processar comissão' }, { status: 500 });
  }
}

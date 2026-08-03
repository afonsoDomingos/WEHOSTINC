import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ReferralModel from '@/lib/models/Referral';

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const referrals = await ReferralModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Erro ao buscar referrals:', error);
    return NextResponse.json({ error: 'Erro ao buscar referrals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const body = await request.json();
    const { action, referral, referrerEmail, totalReferrals, totalCommissions } = body;

    if (action === 'create' && referral) {
      const newReferral = new ReferralModel(referral);
      await newReferral.save();
      return NextResponse.json({ success: true, referral: newReferral });
    }

    if (action === 'update_stats' && referrerEmail) {
      const updated = await ReferralModel.findOneAndUpdate(
        { referrerEmail },
        { totalReferrals, totalCommissions, updatedAt: new Date() },
        { new: true }
      );
      return NextResponse.json({ success: true, referral: updated });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar referral:', error);
    return NextResponse.json({ error: 'Erro ao processar referral' }, { status: 500 });
  }
}

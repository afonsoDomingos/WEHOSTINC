import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SystemRatingModel from '@/lib/models/SystemRating';

let FALLBACK_RATINGS: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (system-ratings):', err);
    return false;
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      const ratings = await SystemRatingModel.find({}).lean();
      return NextResponse.json({ ratings });
    }
  } catch (e) { console.error('MongoDB indisponível (system-ratings):', e); }
  return NextResponse.json({ ratings: FALLBACK_RATINGS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, rating, ratingId, updates } = body;

    if (await tryMongo()) {
      if (action === 'create') {
        await SystemRatingModel.create(rating);
        return NextResponse.json({ success: true });
      }

      if (action === 'update') {
        await SystemRatingModel.updateOne({ id: ratingId }, { $set: updates });
        return NextResponse.json({ success: true });
      }

      if (action === 'delete') {
        await SystemRatingModel.deleteOne({ id: ratingId });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar avaliações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import RentalRequestModel from '@/lib/models/RentalRequest';

let FALLBACK_RENTAL_REQUESTS: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (rental-requests):', err);
    return false;
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      const requests = await RentalRequestModel.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ requests });
    }
  } catch (e) {
    console.error('MongoDB indisponível (rental-requests):', e);
  }
  return NextResponse.json({ requests: FALLBACK_RENTAL_REQUESTS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, request, requestId, updates } = body;

    if (await tryMongo()) {
      if (action === 'create') {
        const created = await RentalRequestModel.create(request);
        return NextResponse.json({ success: true, request: created });
      }

      if (action === 'update') {
        const updated = await RentalRequestModel.findOneAndUpdate(
          { id: requestId },
          { $set: updates },
          { new: true }
        ).lean();
        return NextResponse.json({ success: true, request: updated });
      }

      if (action === 'delete') {
        await RentalRequestModel.deleteOne({ id: requestId });
        return NextResponse.json({ success: true });
      }
    }

    if (action === 'create') {
      FALLBACK_RENTAL_REQUESTS.unshift(request);
      return NextResponse.json({ success: true, request });
    }

    if (action === 'update') {
      FALLBACK_RENTAL_REQUESTS = FALLBACK_RENTAL_REQUESTS.map(r =>
        r.id === requestId ? { ...r, ...updates } : r
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar pedido de aluguer:', error);
    return NextResponse.json({ error: 'Erro interno ao processar pedido' }, { status: 500 });
  }
}

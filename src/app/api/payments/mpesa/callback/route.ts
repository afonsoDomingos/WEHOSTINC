import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('M-Pesa Callback recebido:', body);

    return NextResponse.json({ status: 'SUCCESS', message: 'Callback processado' });
  } catch (error) {
    console.error('Erro no Callback M-Pesa:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { registerDomainWithProvider } from '@/lib/reseller';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, clientName, clientEmail, clientPhone, years } = body;

    if (!domain || !clientEmail) {
      return NextResponse.json(
        { error: 'Campos domain e clientEmail são obrigatórios.' },
        { status: 400 }
      );
    }

    const result = await registerDomainWithProvider({
      domain,
      clientName: clientName || 'Cliente WEHOSTHERE',
      clientEmail,
      clientPhone: clientPhone || '',
      years: years || 1,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na API de registro de domínio:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de registro de domínio.' },
      { status: 500 }
    );
  }
}

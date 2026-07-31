import { NextRequest, NextResponse } from 'next/server';
import { registerDomainWithProvider } from '@/lib/reseller';
import { connectDB } from '@/lib/mongodb';
import SiteModel from '@/lib/models/Site';
import OrderModel from '@/lib/models/Order';

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

    const cleanDomain = domain.toLowerCase().trim();
    const cleanEmail = clientEmail.toLowerCase().trim();

    const result = await registerDomainWithProvider({
      domain: cleanDomain,
      clientName: clientName || 'Cliente WEHOSTHERE',
      clientEmail: cleanEmail,
      clientPhone: clientPhone || '',
      years: years || 1,
    });

    // Registar no MongoDB (Site & Order) para persistência garantida
    try {
      await connectDB();
      const siteId = Date.now().toString();
      await SiteModel.findOneAndUpdate(
        { domain: cleanDomain },
        {
          id: siteId,
          name: cleanDomain,
          domain: cleanDomain,
          status: 'pending',
          userEmail: cleanEmail,
          createdAt: new Date().toISOString(),
          storage: 10,
          bandwidth: 100
        },
        { upsert: true, new: true }
      );

      await OrderModel.create({
        id: `ORD-${Date.now().toString().slice(-5)}`,
        clientName: clientName || 'Cliente WEHOSTHERE',
        clientEmail: cleanEmail,
        clientPhone: clientPhone || '',
        serviceName: `Registo de Domínio (${cleanDomain}) - ${years || 1} ano(s)`,
        amount: 890 * (years || 1),
        paymentMethod: 'mpesa',
        status: 'in_progress',
        createdAt: new Date().toISOString()
      });
    } catch (dbErr) {
      console.warn('Persistência no DB durante registo de domínio:', dbErr);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na API de registro de domínio:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de registro de domínio.' },
      { status: 500 }
    );
  }
}
